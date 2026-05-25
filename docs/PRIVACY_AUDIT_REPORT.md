# Privacy audit report — Doc Quality Compliance Check

**Scope:** Repository review of personal/sensitive data storage, egress to subprocessors, isolation, telemetry, exports, and operator tooling (MCP/Copilot). This is **not** legal compliance certification; map findings to your jurisdiction and deployment.

**Method:** Static analysis of backend (`src/doc_quality/`), frontend (`frontend/`), orchestrator (`services/orchestrator/`), config, CI, and Docker.

---

## 1. Personal and sensitive data inventory

### 1.1 Database tables (ORM: `src/doc_quality/models/orm.py`)

| Table | Fields with privacy relevance | Notes |
| --- | --- | --- |
| `app_users` | `email`, `password_hash`, `roles`, `org` | Identity; password is hashed. |
| `user_sessions` | `user_email`, `user_roles`, `user_org`, `session_token_hash` | Session binding; raw token only in cookie. |
| `password_recovery_tokens` | `user_email`, `token_hash`, `requested_ip`, `requested_user_agent` | IP/UA are personal data in GDPR terms. |
| `skill_documents` | `filename`, `extracted_text`, metadata | **Primary content store**; may contain PII from uploaded SOPs, IFU, etc. |
| `hitl_reviews` | `reviewer_name`, `comments`, `modifications_required` (JSON) | Direct identifiers and free text. |
| `bridge_human_reviews` | `reviewer_email`, `reason`, `next_task_assignee`, `next_task_instructions` | Email + narrative. |
| `audit_events` | `actor_id`, `subject_id`, `payload` (JSON), `tenant_id`, `org_id` | Auth flows store **email** as `actor_id` / `subject_id`. |
| `audit_schedules` | `updated_by`, notified body | Names / org text. |
| `skill_findings` | `title`, `description`, `evidence` (JSON) | May echo document content. |
| `quality_observations` | `subject_id`, `payload` (JSON) | Research path stores **full LLM prompt and answer** (see §2). |
| `stakeholder_employee_assignments` | `employee_name`, `created_by` | Names. |
| `risk_templates` / `risk_template_rows` | `created_by`, `product`, `row_data` (JSON) | Product context may be sensitive. |
| `document_locks` | `locked_by` | Often email or actor string from client. |

### 1.2 Auth-related audit payloads (`src/doc_quality/api/routes/auth.py`)

- **`auth.login_success`:** `actor_id` = user email; `payload` includes `roles`, `remember_me`.
- **`auth.recovery.request_ignored`:** `actor_id` = client IP (or `"unknown"`); `subject_id` = **email** (enumeration-hardened response to client, but row still logged).
- **`auth.recovery.rate_limited`:** same pattern with `subject_id` = email.
- **`auth.recovery.requested`:** `actor_id` = email; `payload` has `expires_at`.
- **`auth.recovery.password_reset`:** `actor_id` / `subject_id` = email; `payload` = `revoked_sessions` count.

### 1.3 Application logs (structured)

Representative patterns:

- **`http_request`** (`src/doc_quality/api/main.py`): `method`, `path`, `status`, `duration_ms`, `trace_id` — **not** request bodies; **full path** may include resource IDs.
- **HTTP spans** (when tracing enabled): `http.user_agent`, `http.target` — user-agent is personal data in strict interpretations.
- **Document / skills:** `skill_document_persisted` — `document_id`, `source` only; `skill_text_extracted` includes **`filename`**.
- **Locks:** `document_lock_*` includes **`locked_by`** (caller-supplied `actor_id` from API).
- **Anthropic errors:** `anthropic_ai_suggest_failed` logs `error=str(exc)` — watch for rare cases where exception strings reflect user input.

No systematic logging of `extracted_text` or passwords was observed in the sampled logger calls.

### 1.4 Audit events from Skills API (`LogEventRequest`)

`payload` is an **arbitrary JSON dict** (`src/doc_quality/models/skills.py`). Callers (orchestrator/tools) can embed document excerpts unless policy forbids it.

---

## 2. Subprocessor egress — Anthropic and Perplexity

### 2.1 Perplexity (`src/doc_quality/services/research_service.py`)

**When:** `PERPLEXITY_API_KEY` is non-empty.

**Prompt content:** Built from `ResearchRequest`: `domain`, `description`, `target_market`, and optional `custom_query` (or default research question) via `prompts/research_prompt_v1.txt`.

**When key is empty:** Static fallback; **no** HTTP call to Perplexity (still builds `query` string for `ResearchResult`).

### 2.2 Research API persistence (`src/doc_quality/api/routes/research.py`)

When `result.provider == "perplexity"`, the API calls `create_quality_observation` with `payload` containing:

- `llm_prompt` (full built prompt),
- `llm_output` (full model answer),
- provider metadata and citation counts.

These are stored in **`quality_observations.payload`** (`src/doc_quality/services/quality_service.py`). This duplicates potentially sensitive user text **on disk** in addition to sending it to Perplexity.

### 2.3 Anthropic — risk template AI suggest (`src/doc_quality/api/routes/risk_templates.py`)

**When:** `ANTHROPIC_API_KEY` set; route `ai-suggest`.

**Sent to Anthropic:** System prompt (FMEA vs RMF), optional `request.context` (product/system context), `partial_row` as JSON, and instructions. **Not** full documents unless `context` or row fields contain them.

### 2.4 Anthropic — document analysis agent (`src/doc_quality/agents/doc_check_agent.py`)

**Implementation:** Sends up to **2000 characters** of document `content` plus `document_type` and rule-based `issues` in the user message.

**Wiring:** `DocumentCheckAgent` is **not referenced** elsewhere in the Python tree (only defined in this file). The live **`analyze_document`** path uses **`document_analyzer.analyze_document`** only — **rule-based, no LLM** in current API flows. Treat as dead integration risk if something imports it later.

### 2.5 Compliance agent (`src/doc_quality/agents/compliance_agent.py`)

Creates an Anthropic client when a key exists but **`check_compliance`** delegates to **`compliance_checker`** only (no Anthropic messages observed in `compliance_checker.py`).

### 2.6 Orchestrator service (`services/orchestrator/`)

Separate process; `AnthropicAdapter` is scaffold-style. Boundary review: whatever workflows you enable may forward document fragments to backends — trace per workflow when operating this service.

### 2.7 Subprocessor summary

| Vendor | Trigger | Typical data categories |
| --- | --- | --- |
| **Perplexity** | `/api/v1/research/regulations` with API key | Product domain, description, markets, optional free-text query → **also persisted** in DB as prompt+answer. |
| **Anthropic** | Risk template `ai-suggest` | Free-text context + partial row JSON. |
| **Anthropic** | `DocumentCheckAgent` | First 2k chars of document + issues — **not** used by default document routes today. |

---

## 3. Isolation and access control (tenant / org)

### 3.1 What exists

- **RBAC:** `require_roles(...)` gates API routes (e.g. documents, skills, research).
- **Cookies:** Session cookie is `HttpOnly`, `SameSite=lax`, `Secure` enforced outside development (`session_auth.py`, `config.py`).
- **`AuthenticatedUser`** includes `org` from session (`user_sessions.user_org`).
- **`audit_events`**, **`audit_schedules`**, **`LogEventRequest`**: optional `tenant_id` / `org_id` fields for labeling.

### 3.2 Gap — document and HITL scope

- **`SkillDocumentORM`** has **no** `org_id` or `tenant_id` column.
- **`search_documents`** (`src/doc_quality/services/skills_service.py`) queries **all** `skill_documents` rows (filters: type, optional text search against `extracted_text` / filename), capped by `limit`.
- **`GET /api/v1/documents`** uses `search_documents` with empty query → returns up to 100 documents for **any** authenticated user with an allowed role — **no filter by `user.org`**.
- **HITL** (`hitl_workflow.py`): no org/tenant parameters in queries.

**Conclusion:** The codebase matches a **single-tenant / shared-database** MVP: isolation is **role-based**, not organization-row-level. Multi-customer SaaS would need schema + query changes and consistent propagation of org from JWT/session into every read/write path.

---

## 4. Configuration, telemetry, CI, Docker

### 4.1 Secrets and production gates (`src/doc_quality/core/config.py`)

| Setting | Privacy / security note |
| --- | --- |
| `SECRET_KEY` | Session and recovery token hashing; **startup fails** in production if left as default `"change-me-in-production"`. |
| `AUTH_MVP_*` | Bootstrap credentials; operational risk if reused across environments. |
| `anthropic_api_key` / `perplexity_api_key` | Gate external processing. |
| `auth_recovery_debug_expose_token` | Returns **raw recovery token** in JSON **only** when `environment == "development"` **and** flag true — must stay off in prod. |
| `database_echo` | SQL logging can leak structure/values in dev. |
| `tracing_enabled`, `tracing_exporter`, `tracing_otlp_endpoint` | OTLP sends spans to configured endpoint; spans include **path** and **user-agent** (`main.py`). |
| `tracing_sampling_ratio` | 1.0 default = full sample volume. |

### 4.2 Metrics

Prometheus labels use **normalized paths** (UUIDs and numeric segments redacted) — lower cardinality; still encodes route shape.

### 4.3 Docker (`docker-compose.yml`)

Postgres only; named volume `postgres_data` holds all DB content including `extracted_text` and quality payloads. Default dev password in compose file — replace for real deployments.

### 4.4 CI (`.github/workflows/`)

`browser-e2e-smoke.yml`: no repository secrets for API keys in the sampled workflow; Playwright artifacts may contain UI screenshots (review `if: always()` uploads for accidental data).

---

## 5. Exports, remote upload, MCP / Copilot

### 5.1 Export registry (frontend)

- **Local download** (`frontend/lib/exportRegistryClient.ts`): Creates a **placeholder** text blob (`Export placeholder for …`), not full document content — low risk today; re-audit if replaced with real exports.
- **Remote upload:** `POST` to **user-supplied URL** with `credentials: 'include'` and JSON body `{ export_id, document_id, type }`.
  - **Risks:** Cross-site cookie behavior (third-party URL receives **browser cookies** for that URL’s origin), **no HTTPS enforcement** in code, possible SSRF/trust issue if operators paste internal URLs. Policy and URL validation are product concerns.

### 5.2 IDE / MCP / Copilot (`AGENTS.md`)

Perplexity MCP and Copilot chats are **out-of-band** from the FastAPI DPA boundary. Any paste of regulated content into the IDE is a **separate** processing activity (Microsoft / Perplexity terms).

---

## 6. Recommended follow-ups (remediation-oriented)

1. **Decide tenancy model** and, if multi-org, add `org_id` (or equivalent) to content tables and enforce in all document/skills/HITL queries.
2. **Minimize research persistence:** store hashes or redacted summaries instead of full `llm_prompt` / `llm_output`, or shorten retention with a documented policy.
3. **LogEvent / audit payload policy:** restrict or scan `payload` size and forbidden keys for document bodies.
4. **Remote export URL:** require HTTPS allowlist, warn on `credentials: 'include'`, or remove for untrusted targets.
5. **Document subprocessors** in customer-facing privacy docs (Perplexity, Anthropic, optional OTLP SaaS).
6. **Operator training:** MCP/Copilot vs in-app research boundaries.

---

## Sources

- `src/doc_quality/models/orm.py`, `src/doc_quality/api/routes/auth.py`, `src/doc_quality/api/routes/research.py`, `src/doc_quality/api/routes/documents.py`, `src/doc_quality/api/main.py`
- `src/doc_quality/services/research_service.py`, `skills_service.py`, `quality_service.py`, `document_analyzer.py`
- `src/doc_quality/api/routes/risk_templates.py`, `src/doc_quality/agents/doc_check_agent.py`, `compliance_agent.py`
- `frontend/lib/exportRegistryClient.ts`, `docs/../docker-compose.yml`, `.github/workflows/browser-e2e-smoke.yml`, `AGENTS.md`

## Assumptions

- Production uses PostgreSQL with backups that inherit the same sensitivity as the primary DB.
- Orchestrator is optional; not every deployment runs it.

## Open questions

- Are there environment-specific DPA requirements (EU-only residency) for Anthropic/Perplexity accounts?
- What is the intended retention period for `quality_observations` and `audit_events`?
- Will real export files replace the current placeholder, and will they include full `extracted_text`?

## Audit

- **Timestamp:** 2026-05-02 (UTC implied)
- **Persona:** privacy-audit implementation (plan execution)
- **Action:** Static privacy audit; artifact `docs/PRIVACY_AUDIT_REPORT.md`
