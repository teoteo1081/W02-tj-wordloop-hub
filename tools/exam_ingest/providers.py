"""Explicit opt-in, bounded AI calls; never switches to a paid fallback."""
import json
import os
import time
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path
from .common import IngestError, require, read_json, write_json


class Provider:
    def __init__(self, settings=None, allow_ai=False, transport=None, sleep=time.sleep, ledger=None):
        self.settings = settings or {}
        self.allowed = allow_ai
        self.transport = transport
        self.sleep = sleep
        self.ledger = Path(ledger) if ledger else None
        previous = read_json(self.ledger) if self.ledger and self.ledger.exists() else {}
        self.calls = previous.get("calls", 0)
        self.usage = previous.get("usage", [])

    def _save(self):
        if self.ledger:
            write_json(self.ledger, {"calls": self.calls, "usage": self.usage})

    def structured(self, system, prompt):
        s = self.settings
        require(self.allowed and s.get("quota_checked") is True and s.get("budget_approved") is True,
                "BLOCKED_AI", "AI requires explicit opt-in, current quota check and approved budget")
        try:
            checked = datetime.fromisoformat(s["quota_checked_at"])
            fresh = checked.tzinfo is not None and timedelta(0) <= datetime.now(timezone.utc) - checked <= timedelta(hours=24)
        except (KeyError, ValueError, TypeError):
            fresh = False
        require(fresh, "BLOCKED_AI", "Provider quota check is missing or older than 24 hours")
        maximum = s.get("max_calls", 0)
        attempts = s.get("attempts", 1)
        require(type(maximum) is int and maximum > 0 and type(attempts) is int and 1 <= attempts <= 3,
                "INVALID_BUDGET", "Specify max_calls and 1..3 attempts")
        require(isinstance(s.get("model"), str) and bool(s["model"]), "INVALID_BUDGET", "Explicit model required")
        for attempt in range(attempts):
            require(self.calls < maximum, "BUDGET_EXHAUSTED", "AI call limit reached")
            self.calls += 1
            entry = {"call": self.calls, "model": s["model"], "status": "ATTEMPTED", "tokens": None, "cost_usd": None}
            self.usage.append(entry)
            self._save()
            try:
                payload = {"model": s["model"], "sys": system, "user": prompt}
                data = self.transport(payload) if self.transport else self._request(payload)
                usage = data.get("usageMetadata")
                entry["tokens"] = ({k: usage[k] for k in ("promptTokenCount", "candidatesTokenCount", "totalTokenCount")
                                     if type(usage.get(k)) is int} if isinstance(usage, dict) else None)
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                text = text.strip()
                if text.startswith("```json") and text.endswith("```"):
                    text = text[7:-3].strip()
                result = json.loads(text)
                require(isinstance(result, dict), "AI_SCHEMA", "AI must return one JSON object")
                entry["status"] = "PASS"
                self._save()
                return result
            except Exception:
                entry["status"] = "FAILED"
                self._save()
                if attempt + 1 < attempts:
                    self.sleep(min(2 ** attempt, 4))
        raise IngestError("AI_FAILED", "Provider failed within retry/call budget; inspect local source")

    def _request(self, payload):
        s = self.settings
        endpoint = s.get("endpoint", "")
        import re
        require(bool(re.fullmatch(r"https://[a-z0-9]{20}\.supabase\.co/functions/v1/gemini-proxy", endpoint)),
                "INVALID_TARGET", "Use an HTTPS gemini-proxy endpoint")
        key = os.environ.get(s.get("credential_env", "SUPABASE_ANON_KEY"), "")
        require(bool(key), "BLOCKED_AUTH", "Provider credential environment variable is unset")
        req = urllib.request.Request(endpoint, data=json.dumps(payload).encode(),
                                      headers={"Content-Type": "application/json", "apikey": key,
                                               "Authorization": "Bearer " + key})
        with urllib.request.urlopen(req, timeout=min(float(s.get("timeout", 120)), 180)) as response:
            return json.load(response)
