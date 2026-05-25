# Telemetry summary — evaluation and workflow tracking

This document describes **operational and quality telemetry** in the repository: what is recorded, where it lives, and how **evaluation-style signals** and **workflow-stage tracking** relate to each other. It is not legal or compliance certification.

## 1. How telemetry is organized

| Layer | Role | Typical use |
| --- | --- | --- |
| **Quality observations** (`quality_observations` table + `/api/v1/observability/*`) | Structured AI/workflow quality events | Evaluation runs, component health, LLM trace payloads |
| **Prometheus metrics** (`/metrics`) | Counters and histograms | Scraping for dashboards and alerting |
| **OpenTelemetry** (optional) | Distributed request spans | Trace IDs correlated with logs and quality rows |
| **Structured logs** (`structlog`, `http_request` events) | Per-request diagnostics | Operations and incident response |
| **Audit trail** (`audit_events`, Skills `log_event`) | Governance evidence | Who did what on which subject; not the same as quality KPI telemetry |

Evaluation and pipeline “workflow” visibility in this repo are primarily expressed through **quality observations** (per-event records) and their **aggregations** (summary and per-component breakdown), plus **Prometheus** counters that mirror some of those events.

## 2. Quality and evaluation telemetry (core model)

### 2.1 Persistence

- **Table:** `quality_observations` (Alembic `006_quality_observations.py`).
- **ORM:** `QualityObservationORM` in `src/doc_quality/models/orm.py`.

Each row captures:

- **`source_component`** — logical emitter (e.g. `research_agent`, `document_analyzer`, `compliance_checker`; any string up to 100 chars in the API).
- **`aspect`** — one of: `performance`, `accuracy`, `error`, `hallucination`, `evaluation` (`QualityAspect` in `src/doc_quality/models/quality.py`).
- **`outcome`** — `pass`, `warn`, `fail`, `info`.
- **Optional:** `score`, `latency_ms`, `error_type`, `hallucination_flag`, `evaluation_dataset`, `evaluation_metric`, `subject_type`, `subject_id`, `trace_id`, `correlation_id`, JSON **`payload`**.

The **`payload`** field holds flexible metadata. For LLM-backed flows, prompt/output extraction for the **LLM traces** API uses keys such as `llm_prompt` / `llm_output` (or `prompt` / `output` / `answer`) inside `payload` (`get_recent_llm_prompt_output_pairs` in `src/doc_quality/services/quality_service.py`).

### 2.2 Ingestion API

- **`POST /api/v1/observability/quality-observations`** — append one observation; requires roles `qm_lead`, `auditor`, `riskmanager`, `architect`, or **service** auth (`src/doc_quality/api/routes/observability.py`).
- On success, the service persists the row and calls **`observe_quality_observation`** so Prometheus stays in sync (`src/doc_quality/services/quality_service.py`).

This endpoint is the main **extensibility point** for evaluation harnesses, batch eval jobs, or future agents: emit one observation per eval step or per pipeline stage with a stable `source_component` and, for eval sets, **`evaluation_dataset`** / **`evaluation_metric`**.

### 2.3 Read APIs (evaluation and workflow views)

| Endpoint | Purpose |
| --- | --- |
| **`GET /api/v1/observability/quality-summary`** | Windowed KPIs: total observations, hallucination report count, error-related count, **`evaluation_observations`** count, average score, P95 latency, and **per-aspect** breakdown (including `evaluation`). Query params: `window_hours`, optional `source_component`, `aspect`. |
| **`GET /api/v1/observability/workflow-components`** | **Per `source_component`** totals, outcome counts (pass/warn/fail/info), average latency, latest event time — i.e. **which pipeline stages** produced telemetry in the window. |
| **`GET /api/v1/observability/llm-traces`** | Recent **prompt/output pairs** derived from observations whose `payload` contains LLM fields. |

**Evaluation observation counting** (for `evaluation_observations` in the summary): a row counts if **`aspect == "evaluation"`** *or* **`evaluation_dataset`** is set (`get_quality_summary` in `quality_service.py`). That means eval-tagged traffic can be counted even when another aspect is used but a dataset name is present.

### 2.4 Prometheus metrics tied to quality and evaluation

Defined in `src/doc_quality/core/observability.py` and updated when observations are created:

| Metric | Labels | Notes |
| --- | --- | --- |
| `dq_ai_quality_observations_total` | `aspect`, `outcome`, `source_component` | Every quality observation |
| `dq_ai_quality_score` | `aspect`, `source_component` | Histogram when `score` is set |
| `dq_ai_hallucination_reports_total` | `source_component` | Incremented when `hallucination_flag` is true |
| `dq_ai_evaluations_total` | `dataset`, `outcome`, `source_component` | Incremented only when **`aspect == "evaluation"`**; `dataset` defaults to `unspecified` if `evaluation_dataset` is empty |

HTTP-level metrics (`dq_http_requests_total`, `dq_http_request_duration_seconds`) are recorded in request middleware when metrics are enabled (`src/doc_quality/api/main.py`).

## 3. Built-in evaluation-related workflow emission

Today, the API emits quality observations **automatically** in one product path:

- **`POST /api/v1/research/regulations`** (`src/doc_quality/api/routes/research.py`): when the research result uses **`provider == "perplexity"`**, the handler calls **`create_quality_observation`** with:
  - `source_component="research_agent"`
  - **`aspect="evaluation"`**
  - `outcome="info"`
  - `subject_type="research"`, `subject_id` set to the sanitized **domain**
  - `trace_id` from **`get_trace_id_hex()`** (OpenTelemetry context when available)
  - `payload` containing `llm_prompt`, `llm_output`, `provider`, `model_used`, citation/framework metadata

Static or non-Perplexity research paths do **not** write this observation.

The **orchestrator** service under `services/orchestrator/` does **not** currently reference quality observations; any future crew/runtime eval hooks would use the same **`POST .../quality-observations`** contract.

## 4. Admin UI: evaluation and workflow tracking

- **Route:** `frontend/pages/admin/observability.tsx` (**Admin → Observability**).
- **Default:** **Demo mode** — mock data from `frontend/lib/adminObservabilityViewModel.ts`; no database calls.
- **Live mode:** set **`NEXT_PUBLIC_OBSERVABILITY_SOURCE=backend`** to load from the backend (same pattern as the Dashboard).

The page is designed to surface:

1. **Summary KPIs** — totals, average score, P95 latency, hallucination reports (`ObservabilityKpiGrid`).
2. **Quality aspect breakdown** — including the **`evaluation`** row (`ObservabilityAspectTable`).
3. **Workflow component breakdown** — per **`source_component`** outcomes and latency (`ObservabilityWorkflowTable`).
4. **Prometheus snapshot** — HTTP requests, hallucination reports, **AI evaluations** counts (`ObservabilitySidePanels`).
5. **Prompt/output export** — CSV export of pairs shown in the LLM traces panel.

**Note:** `frontend/lib/observabilityClient.ts` currently exports **placeholder** fetchers and types. Components such as `ObservabilityKpiGrid` and `ObservabilityWorkflowTable` expect **backend-shaped** objects (e.g. `total_observations`, `aspects`, `components`). Wiring those functions to **`/api/v1/observability/quality-summary`**, **`workflow-components`**, **`llm-traces`**, and **`/metrics`** is required for end-to-end live admin telemetry.

## 5. OpenTelemetry and logs (request workflow)

- **Tracing:** `configure_observability` in `observability.py` registers a `TracerProvider` when `tracing_enabled` is true (OTLP or console exporter, sampling via `tracing_sampling_ratio`). **HTTP middleware** in `main.py` starts a span per API request and attaches standard HTTP attributes.
- **Logs:** Each request logs **`http_request`** with `method`, `path`, `status`, `duration_ms`, and optional **`trace_id`** when a valid span context exists.

These mechanisms trace **API request execution**, not a separate end-user “clickstream” product analytics layer.

## 6. Tests as examples of evaluation workflows

`tests/test_observability_api.py` demonstrates:

- Posting observations with **`evaluation_dataset`** / **`evaluation_metric`** on non-evaluation aspects (still counted toward **`evaluation_observations`** in the summary when `evaluation_dataset` is set).
- Posting **`aspect: "evaluation"`** with LLM fields in **`payload`** and retrieving them via **`/llm-traces`**.
- Populating **workflow component breakdown** with multiple **`source_component`** values.

## 7. Configuration touchpoints

- **Service name:** `TELEMETRY_SERVICE_NAME` (e.g. in `.env.example`) feeds OpenTelemetry **`service.name`**.
- **Tracing/metrics flags and OTLP endpoint:** see `Settings` in `src/doc_quality/core/config.py` (tracing exporter, `tracing_otlp_endpoint`, `metrics_enabled`, etc.).

## 8. Related documentation

- **`OBSERVABILITY_LOGGING_README.md`** — deeper operational logging and observability guide.
- **`README.md`** — Admin Observability overview and RBAC for `/api/v1/observability/*`.
- **`docs/PRIVACY_AUDIT_REPORT.md`** — privacy-oriented notes on research payload storage in quality observations.

---

*Generated from repository review; align deployment behavior with your environment and RBAC policies.*
