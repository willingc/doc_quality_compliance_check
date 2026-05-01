# Contributing

This document describes how to set up a working local development environment using [uv](https://docs.astral.sh/uv/) for Python and optionally Docker Compose for PostgreSQL.

For product context, architecture, and testing strategy, see the root `README.md`, `TESTING_README.md`, and `DATABASE_README.md`.

## Prerequisites

- Git
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (manages Python 3.12+ and the project virtualenv)
- Docker with the Compose plugin (only if you run PostgreSQL via the repo compose file)
- Node.js (current LTS is fine) if you work on the Next.js frontend in `frontend/`

## 1. Clone and install Python dependencies

From the repository root:

```bash
cd doc_quality_compliance_check
uv sync --extra dev
```

This creates `.venv`, pins dependencies from `uv.lock`, and installs runtime + dev tools (`pytest`, `ruff`, `mypy`, etc.).

Optional: pin a Python version explicitly:

```bash
uv python install 3.12
uv sync --extra dev --python 3.12
```

Useful commands:

- Run anything in the venv: `uv run <command>`
- Activate manually (optional): `source .venv/bin/activate` (Unix) or `.venv\Scripts\activate` (Windows)

## 2. Environment variables and running locally

### Env files you will touch

| File | Purpose |
| ----- | ------- |
| `.env.example` | Template committed to the repo; copy when creating your dev `.env`. |
| `.env` | Your local backend config (**gitignored**). Create with `cp .env.example .env` and edit. |
| `.env.postgresql.example` | Ready-made `DATABASE_URL` and Postgres-oriented defaults; useful as a second reference. |
| `.env.test` | Committed overrides used **only during pytest** (loaded by `tests/conftest.py` before imports). Keeps SQLite and stable test credentials; does **not** affect `uvicorn` unless you manually `source` it. |
| `frontend/.env.local` | Frontend (Next.js) variables; copy from `frontend/.env.local.example`. |

Backend settings (`src/doc_quality/core/config.py`) read environment variables first and merge with a `.env` file in the repo root when the API process starts—not when pytest runs pytest-only overrides described above.

### Backend: variables that matter for local runs

Minimal set:

- **`SECRET_KEY`** — signing key for sessions; use a long random string in development (never commit real secrets).
- **`ENVIRONMENT`** — use `development` locally so cookie and validation behavior matches dev defaults.
- **`DATABASE_URL`** — SQLAlchemy URL. Typical local Docker Postgres (see `docker-compose.yml`):  
  `postgresql+psycopg2://postgres:postgres@localhost:5432/doc_quality`
- **`AUTH_MVP_EMAIL`**, **`AUTH_MVP_PASSWORD`**, **`AUTH_MVP_ROLES`**, **`AUTH_MVP_ORG`** — seeded MVP user for login and smoke flows (`AUTH_MVP_PASSWORD` must satisfy server password rules, e.g. length ≥12).
- **`DATABASE_ECHO`** — optional; `true` to log SQL locally.

Optional integrations (fine to leave empty unless you exercise those routes):

- **`ANTHROPIC_API_KEY`**, **`PERPLEXITY_API_KEY`** — LLM / research enrichment and live regulation lookup.

Logging and telemetry defaults (`LOG_LEVEL`, `METRICS_ENABLED`, `TRACING_*`, etc.) are usually fine as documented in `.env.example`.

Starting point:

```bash
cp .env.example .env
# Edit .env: SECRET_KEY, DATABASE_URL for your Postgres, AUTH_MVP_*
```

### Frontend: variables for running the UI locally

```bash
cp frontend/.env.local.example frontend/.env.local
```

For local development, **`NEXT_PUBLIC_API_ORIGIN` should stay empty** so the Next.js app proxies `/api/*` to the FastAPI backend and session cookies remain same-origin (`localhost:3000`). Setting a direct backend URL breaks `SameSite=lax` cookie behavior and breaks login redirects. Details: root `README.md` (Getting Started).

Optional: **`NEXT_PUBLIC_ENABLE_AUTH_HEALTH_CHECK`** and **`NEXT_PUBLIC_HEALTH_ORIGIN`** for the login-page health badge (see `README.md`).

### Typical flow: run the stack on your machine

Use separate terminals. From the **repository root**:

1. **PostgreSQL**

   ```bash
   docker compose up -d
   ```

   Default: `postgres` / `postgres` / DB `doc_quality` on **localhost:5432** (`docker-compose.yml`).

2. **Migrate / initialize schema**

   ```bash
   uv run python init_postgres.py
   ```

   Uses **`DATABASE_URL`** from your `.env`.

3. **Backend API**

   ```bash
   uv run python -m uvicorn src.doc_quality.api.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   Health check: **http://127.0.0.1:8000/health**

   On Windows you can alternatively use **`scripts/start_backend.ps1`** (see root `README.md`).

4. **Frontend**

   ```bash
   cd frontend && npm install && npm run dev
   ```

   Open **http://localhost:3000/login**

5. **Quick checks**

   - Backend direct: http://127.0.0.1:8000/health  
   - Through frontend proxy: http://localhost:3000/health  
   - Log in using the credentials from **`AUTH_MVP_EMAIL`** / **`AUTH_MVP_PASSWORD`** in `.env`.

6. **(Optional) CrewAI orchestrator**

   Skip this if you only need login, dashboard, and document-hub flows—the FastAPI backend is the system of record and exposes the Skills API the orchestrator calls. From **`services/orchestrator/`**:

   ```bash
   cd services/orchestrator && uv run python -m doc_quality_orchestrator
   ```

   Health check: http://localhost:8010/health

   Background: root `README.md` (“Optional: start the orchestrator service”).

If you prefer a host-installed PostgreSQL instead of Docker, point **`DATABASE_URL`** at it and run `init_postgres.py` the same way. More options: **`DATABASE_README.md`**.

## 3. Stop PostgreSQL when done

```bash
docker compose down
```

To wipe container data (**destructive**):

```bash
docker compose down -v
```

## 4. Run tests and linters

Backend tests (includes coverage settings from `pyproject.toml`):

```bash
uv run pytest
```

The committed **`.env.test`** is loaded automatically by `tests/conftest.py` before the app imports so pytest typically does **not** need Postgres for the suite and uses stable `AUTH_MVP_*` / `SECRET_KEY` values aligned with tests. Customize by editing `.env.test`, or delete/rename it to fall back to `.env` plus conftest defaults only.

Single file:

```bash
uv run pytest tests/test_auth_session_api.py -v
```

Lint / type-check:

```bash
uv run ruff check src tests
uv run mypy src
```

## Troubleshooting

- Prefer `uv run ...` so commands use the project `.venv`; plain `python` on PATH may differ.
- If port 5432 is busy, stop another Postgres/container or adjust compose port mapping and `DATABASE_URL`.
- If DB connection fails right after `docker compose up`, wait for healthcheck then rerun `uv run python init_postgres.py`.

## Related docs

- `DATABASE_README.md` — full DB options and troubleshooting
- `POSTGRES_SETUP_QUICKSTART.md` — command-oriented setup
- `AUTHENTICATION_AUTHORIZATION_README.md` — auth and RBAC
- `TESTING_README.md` — test layers and CI expectations
