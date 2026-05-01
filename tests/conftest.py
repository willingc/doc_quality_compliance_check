"""Pytest configuration and shared fixtures."""
from pathlib import Path
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session


def _overlay_env_from_file(env_path: Path) -> None:
    """Set os.environ entries from KEY=value lines so imports see them before pydantic reads .env."""
    content = env_path.read_text(encoding="utf-8")
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        key, sep, rest = line.partition("=")
        if not sep:
            continue
        key = key.strip()
        val = rest.strip().strip('"').strip("'")
        os.environ[key] = val


# Repo root /.env.test — applied before any app/database import so DATABASE_URL reflects tests.
_REPO_ROOT = Path(__file__).resolve().parents[1]
_env_test_path = _REPO_ROOT / ".env.test"
if _env_test_path.is_file():
    _overlay_env_from_file(_env_test_path)


from src.doc_quality.api.main import app  # noqa: E402 — after .env.test overlay for DB/url settings
from src.doc_quality.core.database import Base, SessionLocal, get_db  # noqa: E402
from src.doc_quality.models.orm import ReviewRecordORM  # noqa: E402
from src.doc_quality.tools.route_coverage_audit import RouteAudit  # noqa: E402

# Use explicit API key in tests for route authentication.
os.environ.setdefault("SECRET_KEY", "test-api-key")
# AUTH_MVP_EMAIL and AUTH_MVP_PASSWORD must be set via environment variables or .env in real runs.
# The sentinel fallbacks below are intentionally invalid to prevent accidental login with defaults.  # noqa: S105
os.environ.setdefault("AUTH_MVP_EMAIL", "mvp-user@example.invalid")  # nosec B105
os.environ.setdefault("AUTH_MVP_PASSWORD", "CHANGE_ME_BEFORE_USE")  # nosec B105

# Use in-memory SQLite for testing
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


def pytest_configure(config):
    """Run route-to-test drift audit at test collection time.
    
    This hook runs before test collection to ensure all FastAPI routes
    are mapped to at least one test. Fails early if drift is detected.
    """
    try:
        audit = RouteAudit()
        audit.run()
    except Exception as e:
        pytest.exit(f"Route-to-test drift audit failed: {e}", 1)

    if not audit.all_routes_mapped:
        print("\n" + audit.report(verbose=False))
        pytest.exit(f"Route-to-test drift detected: {len(audit.unmapped_routes)} route(s) unmapped", 1)

    if config.option.verbose > 0:
        print(f"\n[route-coverage] {len(audit.routes)} routes verified - all mapped to tests")


@pytest.fixture(scope="function")
def test_db_engine():
    """Create test database engine."""
    engine = create_engine(
        TEST_SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_db_session(test_db_engine) -> Session:
    """Create test database session."""
    connection = test_db_engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(test_db_session) -> TestClient:
    """Return a FastAPI test client with database dependency override."""
    
    def override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        login = test_client.post(
            "/api/v1/auth/login",
            json={
                "email": os.environ.get("AUTH_MVP_EMAIL", "mvp-user@example.invalid"),
                "password": os.environ.get("AUTH_MVP_PASSWORD", "CHANGE_ME_BEFORE_USE"),
            },
        )
        if login.status_code != 200:
            raise RuntimeError(f"Failed to create authenticated test client: {login.text}")

        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def sample_arc42_content() -> str:
    return """
# Architecture Documentation (arc42)

## Introduction and Goals
This document describes the architecture.

## Constraints
Technical constraints apply.

## Context and Scope
System context is defined here.

## Solution Strategy
The solution strategy involves microservices.

## Building Block View
Components are described here.

## Runtime View
Runtime scenarios are documented.

## Deployment View
Deployment is done via containers.

## Concepts
Cross-cutting concepts include logging and security.

## Architecture Decisions
Key decisions are recorded here.

## Quality Requirements
Quality goals: performance, security, maintainability.

## Risks and Technical Debt
Known risks are listed here.

## Glossary
| Term | Definition |
|------|-----------|
| API  | Application Programming Interface |

### System Context Diagram
```
[User] -> [System] -> [Database]
```

### Component Diagram
```
[API Layer] -> [Service Layer] -> [Data Layer]
```

### Sequence Diagram
```
User -> API: Request
API -> Service: Process
Service -> DB: Query
```
"""


@pytest.fixture
def sample_model_card_content() -> str:
    return """
# Model Card

## Model Details
Name: MyModel v1.0

## Intended Use
Primary use: document classification

## Factors
Key factors: text length, language

## Metrics
Accuracy: 0.92

## Evaluation Data
Test set of 1000 documents

## Training Data
50000 labeled documents

## Quantitative Analyses
Performance breakdown by category

## Ethical Considerations
Bias assessment completed

## Caveats and Recommendations
Recommended for English documents only
"""
