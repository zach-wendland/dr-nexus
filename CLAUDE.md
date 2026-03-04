# CLAUDE.md — Dr. Nexus

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

**Dr. Nexus** is a dual-stack medical data processing system for longitudinal patient record analysis. It has two distinct subsystems:

1. **Python backend** (`dr_nexus/`) — ingests FHIR R4 and HL7 C-CDA medical records, builds a structured JSON knowledge base, and performs AI-powered analysis via the Anthropic Claude API.
2. **Next.js frontend** (`app/`) — a React dashboard that visualizes patient data using D3.js and Recharts.

---

## Repository Structure

```
dr-nexus/
├── app/                        # Next.js 14 pages (App Router)
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Dashboard home
│   ├── timeline/page.tsx
│   ├── conditions/page.tsx
│   ├── labs/page.tsx
│   ├── medications/page.tsx
│   ├── devices/page.tsx
│   ├── actions/page.tsx
│   └── documents/page.tsx
├── components/
│   ├── layout/DashboardLayout.tsx   # Navigation, sidebar, theme toggle
│   ├── search/GlobalSearch.tsx      # Medical data search
│   ├── ui/                          # Shadcn UI primitives (badge, button, card, tabs)
│   └── visualizations/             # Medical chart components (D3 + Recharts)
├── config/
│   └── schema.json             # JSON Schema for knowledge base validation
├── dr_nexus/                   # Python package (pip install -e .)
│   ├── models/                 # Pydantic data models
│   ├── ingestors/              # FHIR and C-CDA parsers
│   ├── extractors/             # Timeline builder
│   ├── knowledge_base/         # KB loader, merger, schema
│   ├── analysis/               # Claude AI integration (ultrathink.py)
│   ├── output/                 # JSON generator
│   ├── utils/                  # Config (Pydantic Settings) + logging
│   └── cli.py                  # Click CLI entry point
├── scripts/
│   └── initial_build.py        # Build KB from medical files
├── supabase/
│   └── schema.sql              # PostgreSQL schema for Supabase
├── tests/
│   ├── conftest.py             # Shared pytest fixtures
│   ├── unit/                   # Unit tests (kb_loader, kb_merger, timeline_builder)
│   └── integration/            # End-to-end pipeline test
├── .github/workflows/          # CI/CD (nextjs-ci, python-ci, deploy, codeql, release)
├── pyproject.toml              # Poetry config + pytest/black/ruff/mypy settings
├── package.json                # npm scripts + frontend dependencies
├── next.config.js              # Next.js config (standalone output, ignores TS/ESLint errors on build)
├── tailwind.config.ts          # Tailwind with HSL CSS variable theming
└── tsconfig.json               # TypeScript strict mode, path alias @/* → ./*
```

---

## Technology Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 14.2 | React framework (App Router) |
| React | 18.3 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | various | Unstyled accessible primitives |
| D3.js | 7.9 | Custom interactive visualizations |
| Recharts | 2.13 | Declarative React charts |
| Zustand | 4.5 | Client-side state management |
| TanStack Query | 5.59 | Server-state / data fetching |
| Framer Motion | 11.11 | Animations |
| Lucide React | 0.460 | Icon set |

### Backend (Python ≥ 3.11)
| Tool | Version | Purpose |
|------|---------|---------|
| Pydantic v2 | 2.5 | Data models and validation |
| pydantic-settings | 2.1 | Config from environment |
| fhir-resources | 7.1 | FHIR R4 parsing |
| lxml | 5.1 | C-CDA XML parsing |
| pdfplumber | 0.10 | PDF extraction |
| anthropic | ≥0.39 | Claude API integration |
| click | 8.1 | CLI |
| rich | 13.7 | Terminal output formatting |
| pandas | 2.1 | Data processing |

### Infrastructure
- **Deployment:** Vercel (frontend)
- **Database:** Supabase (PostgreSQL)
- **CI/CD:** GitHub Actions
- **Security scanning:** CodeQL

---

## Development Setup

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- Poetry (Python dependency management)

### Frontend
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Python Backend
```bash
# Install dependencies
pip install -r requirements.txt
# or with Poetry:
poetry install

# Run the CLI
dr-nexus --help
dr-nexus build --data-dir /path/to/medical/files --output data/knowledge_base/current.json
dr-nexus validate data/knowledge_base/current.json
dr-nexus stats data/knowledge_base/current.json
```

### Environment Variables
Copy `.env.example` to `.env` and fill in values:

```bash
ANTHROPIC_API_KEY=your_key_here          # Required for AI analysis
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
DATA_DIR=/path/to/data
RAW_DATA_DIR=/path/to/medical/records
KNOWLEDGE_BASE_DIR=/path/to/kb/output
LOGS_DIR=/path/to/logs
ENABLE_ULTRATHINK=true
BATCH_SIZE=10
MAX_WORKERS=4
LOG_LEVEL=INFO
```

The frontend also uses `.env.local` for Supabase and other Next.js-specific variables.

---

## Running Tests

```bash
# Run all Python tests with coverage
pytest

# Run only unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/

# With specific verbosity
pytest -v --cov=dr_nexus --cov-report=term-missing
```

- Coverage target: **90%+**
- Coverage reports output to `htmlcov/`
- Fixtures are in `tests/conftest.py`

---

## Code Quality

### Python
```bash
black .              # Format (100 char line length)
ruff check .         # Lint (100 char line length)
mypy dr_nexus/       # Type checking (strict mode)
isort .              # Import sorting
```

Configuration is in `pyproject.toml`:
- `[tool.black]` — line-length = 100, target-version = py311
- `[tool.ruff]` — line-length = 100
- `[tool.mypy]` — strict: `disallow_untyped_defs = true`, `warn_return_any = true`

### TypeScript / Frontend
```bash
npm run lint         # ESLint via Next.js
```

Note: `next.config.js` has `ignoreBuildErrors: true` for TypeScript and ESLint. This keeps builds green but means type errors won't block `next build`. Always fix type errors regardless.

---

## Architecture: Python Backend

Data flows through a strict layered pipeline:

```
Raw Files (FHIR/C-CDA/PDF)
    → Ingestors (fhir_ingestor.py, ccda_ingestor.py)
    → Extractors (timeline_builder.py)
    → Knowledge Base (kb_loader.py, kb_merger.py)
    → Analysis (ultrathink.py — Claude API)
    → Output (json_generator.py)
```

### Key Patterns

- **All data models use Pydantic v2 `BaseModel`** — no plain dataclasses.
- **Enums use `str` base** for JSON serialization (e.g., `EventType`, `ActionPriority`).
- **`BaseIngestor`** is the abstract base class; concrete ingestors implement the ingestion contract.
- **`KBMerger`** deduplicates records when merging multiple knowledge bases.
- **Configuration** via `dr_nexus/utils/config.py` using `pydantic-settings` — all settings come from environment variables, never hardcoded.
- **Logging** is initialized in `dr_nexus/utils/logging_config.py`; use the standard `logging` module, not `print()`.

### Adding a New Ingestor
1. Subclass `BaseIngestor` from `dr_nexus/ingestors/base.py`.
2. Implement the required abstract methods.
3. Register in `dr_nexus/cli.py` or `scripts/initial_build.py` as needed.
4. Add unit tests in `tests/unit/`.

---

## Architecture: Next.js Frontend

- Uses the **App Router** (`app/` directory), not Pages Router.
- All interactive components are **client components** (`'use client'` directive at top).
- **Shadcn UI pattern:** UI primitives in `components/ui/` are thin wrappers around Radix UI with Tailwind variants via `class-variance-authority`.
- **Theming:** CSS HSL variables defined in `app/globals.css` and consumed by Tailwind. Use `tailwind-merge` (`cn()` helper) to merge class names.
- **State:** Zustand store (`useMedicalStore`) for global client state; TanStack Query for async data.
- **Icons:** Always use `lucide-react` — do not add other icon libraries.
- **Path alias:** `@/` maps to the project root (e.g., `@/components/ui/button`).

---

## Naming Conventions

### Python
- Classes: `PascalCase` (e.g., `TimelineEvent`, `FHIRIngestor`)
- Functions/variables: `snake_case`
- Constants: `SCREAMING_SNAKE_CASE`
- Test files: `test_<module>.py`; test functions: `test_<what_it_tests>`

### TypeScript / React
- Components: `PascalCase` files and exports (e.g., `DashboardLayout.tsx`)
- Hooks: `camelCase` prefixed with `use` (e.g., `useMedicalStore`)
- Utility functions: `camelCase`
- CSS: Tailwind utility classes; custom classes only when Tailwind cannot express the style

---

## CI/CD Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `python-ci.yml` | push/PR touching Python files | pytest (matrix 3.11 + 3.12), black, isort, radon |
| `nextjs-ci.yml` | push/PR touching frontend files | ESLint, tsc, next build, bundle analysis, Lighthouse |
| `deploy.yml` | push to `main` or manual | Vercel deployment with health check |
| `codeql.yml` | scheduled + push | CodeQL security analysis |
| `release.yml` | manual | Release management |

Secrets required: `ANTHROPIC_API_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. See `.github/SETUP_SECRETS.md`.

---

## Knowledge Base Schema

The knowledge base is a versioned JSON file validated against `config/schema.json`. Key top-level fields:

```json
{
  "metadata": { "version": "...", "generated_at": "...", "source_files_count": 0 },
  "patient_profile": {
    "demographics": {},
    "chronic_conditions": [],
    "care_team": []
  },
  "timeline": [],
  "unresolved_questions": []
}
```

Use `dr-nexus validate <file>` to check a KB file against the schema.

---

## Important Files for Orientation

| File | Why it matters |
|------|---------------|
| `dr_nexus/models/__init__.py` | All Pydantic model exports |
| `dr_nexus/knowledge_base/kb_schema.py` | `KnowledgeBase` root model |
| `dr_nexus/analysis/ultrathink.py` | Claude API integration |
| `dr_nexus/utils/config.py` | All environment-driven config |
| `app/layout.tsx` | Next.js root layout |
| `components/layout/DashboardLayout.tsx` | Main navigation shell |
| `config/schema.json` | KB JSON Schema |
| `supabase/schema.sql` | Database schema |
| `pyproject.toml` | Python project config + tool settings |
| `package.json` | npm scripts + frontend dependencies |

---

## Data Privacy

This codebase handles Protected Health Information (PHI). Observe these rules:

- **Never commit** actual medical records, `.env` files, or files matching the patterns in `.gitignore`.
- Raw data directories (`data/`, `RAW_DATA_DIR`) are git-ignored.
- All PHI paths are configured via environment variables — no hardcoded patient data in source code.
- When writing tests, use synthetic fixture data from `tests/conftest.py`, not real records.

---

## Common Tasks

```bash
# Build a new knowledge base from medical files
dr-nexus build --data-dir /path/to/records

# Validate an existing KB
dr-nexus validate data/knowledge_base/current.json

# Show KB statistics
dr-nexus stats data/knowledge_base/current.json

# Start the frontend dev server
npm run dev

# Run full Python test suite
pytest

# Format and lint Python
black . && ruff check . && mypy dr_nexus/

# Seed frontend demo data
npm run seed
```
