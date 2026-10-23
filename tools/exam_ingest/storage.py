"""Explicit live adapters. Constructor reads credentials only when selected.

Uses Supabase Management SQL for rows and object inventory, non-upsert Storage
POST for images and conditional R2 S3 writes. Never deploys a Worker.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request
from .common import IngestError, digest, file_hash, require

COLUMNS = {"id": "text", "exam": "text", "test": "text", "part": "int", "num": "int",
           "stem": "text", "opts": "jsonb", "answer": "text", "tag": "text", "passage": "text",
           "src": "text", "answer_src": "text", "explain": "text", "stem_vi": "text",
           "vocab": "jsonb", "i18n": "jsonb"}


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


class LiveBackend:
    def __init__(self, target, preflight=None):
        self.target = target
        self.preflight = preflight or {}
        ref = target.get("project_ref", "")
        require(bool(re.fullmatch(r"[a-z]{20}", ref)), "INVALID_TARGET", "Explicit Supabase project ref required")
        self.base = f"https://{ref}.supabase.co"
        require(target.get("supabase_url") == self.base and
                target.get("image_base") == self.base + "/storage/v1/object/public/toeic/listening/img/",
                "INVALID_TARGET", "Supabase/project/image destinations disagree")
        self.pat = os.environ.get("SUPABASE_PAT") or os.environ.get("SBPAT")
        require(bool(self.pat), "BLOCKED_AUTH", "Set SUPABASE_PAT or SBPAT for explicit live access")
        self.ref = ref
        self._r2_client = None

    def _sql(self, query):
        req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{self.ref}/database/query",
                                      data=json.dumps({"query": query}).encode(),
                                      headers={"Content-Type": "application/json", "Authorization": "Bearer " + self.pat})
        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                return json.load(response)
        except (OSError, ValueError) as exc:
            raise IngestError("BACKEND_FAILED", "Management request failed; credentials/response are not logged") from exc

    def _r2(self):
        if self._r2_client is None:
            endpoint = self.target.get("r2_endpoint", "")
            require(bool(re.fullmatch(r"https://[a-f0-9]{32}\.r2\.cloudflarestorage\.com", endpoint)),
                    "INVALID_TARGET", "Explicit account R2 endpoint required")
            require(bool(self.target.get("r2_bucket")), "INVALID_TARGET", "Explicit R2 bucket required")
            access, secret = os.environ.get("R2_ACCESS_KEY_ID"), os.environ.get("R2_SECRET_ACCESS_KEY")
            require(bool(access and secret), "BLOCKED_AUTH", "Set existing authorized R2 S3 credentials")
            import boto3
            self._r2_client = boto3.client("s3", endpoint_url=endpoint, region_name="auto",
                                           aws_access_key_id=access, aws_secret_access_key=secret)
        return self._r2_client

    def _image_info(self, key):
        records = self._sql("select name from storage.objects where bucket_id='toeic' and name=" + literal(key))
        if not records:
            return None
        url = self.base + "/storage/v1/object/public/toeic/" + urllib.parse.quote(key, safe="/")
        h, size = hashlib.sha256(), 0
        try:
            with urllib.request.urlopen(url, timeout=120) as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    h.update(chunk)
                    size += len(chunk)
        except OSError as exc:
            raise IngestError("MEDIA_READ_FAILED", "Cannot verify public image bytes") from exc
        return {"sha256": h.hexdigest(), "bytes": size}

    def _audio_info(self, key):
        from botocore.exceptions import ClientError
        try:
            response = self._r2().get_object(Bucket=self.target["r2_bucket"], Key=key)
        except ClientError as exc:
            if str(exc.response.get("Error", {}).get("Code")) in {"NoSuchKey", "404", "NotFound"}:
                return None
            raise IngestError("MEDIA_READ_FAILED", "Cannot inspect R2 object") from exc
        except Exception as exc:
            raise IngestError("MEDIA_READ_FAILED", "R2 read failed; response/credentials not logged") from exc
        h, size = hashlib.sha256(), 0
        with response["Body"] as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                h.update(chunk)
                size += len(chunk)
        return {"sha256": h.hexdigest(), "bytes": size}

    def snapshot(self, test, media):
        rows = self._sql("select " + ",".join(COLUMNS) + " from test_items where exam='toeic' and test=" + literal(test) + " order by id")
        # Management responses are not assumed to be unbounded: exact count must agree.
        count = self._sql("select count(*) n from test_items where exam='toeic' and test=" + literal(test))[0]["n"]
        require(len(rows) == count, "INCOMPLETE_SNAPSHOT", "Management response was truncated")
        protected = self._sql("select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) as hash "
                              "from test_items t where exam='toeic' and (test like '2023-%' or test ~ '^[1-9][0-9]*$')")[0]["hash"]
        objects = {}
        for item in media:
            info = self._image_info(item["object"]) if item["kind"] == "image" else self._audio_info(item["object"])
            if info is not None:
                objects[item["object"]] = info
        return {"schema_version": 1, "complete": True, "test": test,
                "target_hash": digest(self.target), "protected_hash": protected,
                "rows": rows, "objects": objects, "live": True, "preflight": self.preflight}

    def put_media(self, item):
        require(file_hash(item["path"]) == item["sha256"], "ARTIFACT_CHANGED", "Media changed before upload")
        if item["kind"] == "audio":
            try:
                with Path(item["path"]).open("rb") as data:
                    self._r2().put_object(Bucket=self.target["r2_bucket"], Key=item["object"], Body=data,
                                           ContentType="audio/mpeg", IfNoneMatch="*",
                                           Metadata={"sha256": item["sha256"]})
            except IngestError:
                raise
            except Exception as exc:
                raise IngestError("UPLOAD_FAILED", "Conditional R2 upload failed; response/credentials not logged") from exc
        else:
            key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            require(bool(key), "BLOCKED_AUTH", "Storage write requires an explicitly supplied service role key")
            url = self.base + "/storage/v1/object/toeic/" + urllib.parse.quote(item["object"], safe="/")
            req = urllib.request.Request(url, data=Path(item["path"]).read_bytes(), method="POST",
                                          headers={"Authorization": "Bearer " + key, "apikey": key,
                                                   "Content-Type": "image/jpeg", "x-upsert": "false"})
            try:
                with urllib.request.urlopen(req, timeout=120) as response:
                    response.read()
            except OSError as exc:
                raise IngestError("UPLOAD_FAILED", "Non-overwrite Storage upload failed") from exc

    def check_write_access(self):
        # Presence is a prerequisite, not proof that remote scopes are valid.
        require(bool(os.environ.get("SUPABASE_SERVICE_ROLE_KEY")), "BLOCKED_AUTH", "Storage credential missing")
        self._r2()
        require(self.preflight.get("permissions_checked") is True, "BLOCKED_AUTH", "Current permissions review required before writes")

    def audit_media(self, media):
        origin = self.target.get("origin", "")
        for item in media:
            if item["kind"] != "audio":
                continue
            url = self.target["audio_base"].rstrip("/") + "/" + item["object"]
            headers = {"Range": "bytes=0-0"}
            if origin:
                headers["Origin"] = origin
            req = urllib.request.Request(url, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=60) as response:
                    require(response.status == 206 and response.headers.get("Content-Range") ==
                            f"bytes 0-0/{item['bytes']}" and len(response.read(2)) == 1,
                            "VERIFY_FAILED", "Public audio Range is not valid")
                    cors = response.headers.get("Access-Control-Allow-Origin")
                    require(cors == "*" or bool(origin and cors == origin), "VERIFY_FAILED", "Public audio CORS missing/wrong")
            except OSError as exc:
                raise IngestError("VERIFY_FAILED", "Public audio endpoint unavailable") from exc

    def write_rows(self, rows, mode, expected=None):
        require(all(set(row) <= set(COLUMNS) for row in rows), "INVALID_ROWS", "Unknown DB columns")
        payload = literal(json.dumps(rows, ensure_ascii=False)) + "::jsonb"
        record = "jsonb_to_recordset(" + payload + ") as r(" + ",".join(k + " " + t for k, t in COLUMNS.items()) + ")"
        if mode == "insert":
            query = ("insert into test_items (" + ",".join(COLUMNS) + ") select " + ",".join("r." + k for k in COLUMNS) +
                     " from " + record + " returning id")
        else:
            require(expected is not None and len(expected) == len(rows), "INVALID_PLAN", "Enrich requires exact before rows")
            expected_json = literal(json.dumps(expected, ensure_ascii=False)) + "::jsonb"
            query = ("with locked as materialized (select " + ",".join(COLUMNS) +
                     " from test_items where id in (" + ",".join(literal(row["id"]) for row in rows) + ") for update), "
                     "expected as (select value from jsonb_array_elements(" + expected_json + ")), "
                     "gate as (select count(*)=" + str(len(rows)) + " as ok from locked l join expected e "
                     "on l.id=e.value->>'id' where to_jsonb(l) = e.value) "
                     "update test_items t set " + ",".join(k + "=r." + k for k in ("explain", "stem_vi", "vocab", "i18n")) +
                     " from " + record + " where (select ok from gate) and t.id=r.id and t.test=r.test returning t.id")
        changed = self._sql(query)
        require(len(changed) == len(rows), "VERIFY_FAILED", "Database affected an unexpected number of rows")
