# TOEIC pipeline — synthetic QA

All sources and approvals below are generated fixtures.
No network, paid AI calls, real exams or real backend writes were used.

| Year | Questions | Media | Dry run | Fake publish | AI calls |
|---|---|---|---|---|---|
| 2019 | 200 | 8 | DRY_RUN | PASS | 0 |
| 2020 | 200 | 8 | DRY_RUN | PASS | 0 |
| 2021 | 200 | 8 | DRY_RUN | PASS | 0 |
| 2022 | 200 | 8 | DRY_RUN | PASS | 0 |

Pending: real-source compatibility, live integration and independent human QA.

## Bằng chứng kiểm nội bộ (2026-10-22)

- `python -B -m unittest discover -s tools/exam_ingest/tests -t .` -> 38 test OK.
- `python -B -m tools.exam_ingest.tests.demo --output-root <ngoài repo>` sinh bảng trên.
- `inventory` với profile 2019 -> `BLOCKED_SOURCE`, exit 2 (không bịa số Test).
- Đây là kiểm nội bộ, KHÔNG thay QA độc lập (ING-09).
