# Dr. Nexus - Medical Knowledge Base Builder

[![Python Backend CI](https://github.com/zach-wendland/dr-nexus/actions/workflows/python-ci.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/python-ci.yml)
[![Next.js Frontend CI](https://github.com/zach-wendland/dr-nexus/actions/workflows/nextjs-ci.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/nextjs-ci.yml)
[![Deploy to Vercel](https://github.com/zach-wendland/dr-nexus/actions/workflows/deploy.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/zach-wendland/dr-nexus/actions/workflows/codeql.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/codeql.yml)

A comprehensive system for analyzing longitudinal patient medical records and building a structured medical knowledge base.

**Live Demo:** [https://dr-nexus.vercel.app](https://dr-nexus.vercel.app)

## Overview

Dr. Nexus processes complex medical records from multiple formats (FHIR, HL7 C-CDA, PDFs, images) and constructs a comprehensive, chronologically-ordered knowledge base that preserves all historical medical information.

## Features

- **Multi-Format Ingestion**: FHIR Bundles, HL7 C-CDA XML, PDFs, NDJSON, medical images
- **Intelligent Merging**: Combines data from multiple sources without losing historical information
- **Timeline Building**: Chronological event ordering with clinical significance scoring
- **Symptom Tracking**: Monitors symptom onset, progression, and resolution
- **Ultrathink Analysis**: Deep medical insights using Claude AI
- **Version Control**: Full history preservation with rollback capability
- **Comprehensive Testing**: 90%+ code coverage with unit, integration, and property-based tests

## Project Structure

```
health/
├── dr_nexus/              # Main application package
│   ├── ingestors/         # Data ingestion (FHIR, C-CDA, PDF)
│   ├── extractors/        # Entity extraction & timeline building
│   ├── knowledge_base/    # KB management & merging
│   ├── analysis/          # Ultrathink AI analysis
│   ├── models/            # Pydantic data models
│   └── utils/             # Utilities & helpers
├── tests/                 # Comprehensive test suite
├── scripts/               # CLI scripts for processing
├── data/                  # Data directories
└── config/                # Configuration files
```

## Installation

### Using Poetry (Recommended)

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Activate virtual environment
poetry shell
```

### Using pip

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

## Usage

### Initial Knowledge Base Build

Process all available medical records to create the initial knowledge base:

```bash
python scripts/initial_build.py \
    --data-dir "C:/Users/lyyud/projects/health" \
    --output "data/knowledge_base/current.json" \
    --enable-ultrathink
```

### Incremental Update

Add new medical records to existing knowledge base:

```bash
python scripts/incremental_update.py \
    --existing-kb "data/knowledge_base/current.json" \
    --new-files "path/to/new/records/" \
    --output "data/knowledge_base/current.json"
```

### Validate Knowledge Base

Check knowledge base integrity:

```bash
python scripts/validate_kb.py \
    --kb-path "data/knowledge_base/current.json" \
    --schema "config/schema.json"
```

## Knowledge Base Schema

The output JSON follows this structure:

```json
{
  "metadata": {
    "version": "1.0.0",
    "generated_at": "2025-12-27T12:00:00Z",
    "source_files_count": 634
  },
  "patient_profile": {
    "demographics": { ... },
    "chronic_conditions": [ ... ],
    "implanted_devices": [ ... ]
  },
  "timeline": [
    {
      "date": "2020-05-15",
      "event_type": "procedure",
      "summary": "Cervical spine fusion surgery",
      "details": { ... }
    }
  ],
  "symptom_registry": [ ... ],
  "action_items": [ ... ],
  "unresolved_questions": [ ... ]
}
```

## Testing

Run the full test suite:

```bash
# Run all tests with coverage
pytest

# Run specific test file
pytest tests/unit/test_fhir_ingestor.py

# Run with verbose output
pytest -v

# Generate HTML coverage report
pytest --cov-report=html
```

## Development

### Code Quality

```bash
# Format code
black dr_nexus/

# Lint code
ruff check dr_nexus/

# Type checking
mypy dr_nexus/
```

### Adding New Ingestors

1. Create new file in `dr_nexus/ingestors/`
2. Inherit from `BaseIngestor`
3. Implement `ingest()` method
4. Add tests in `tests/unit/`

## Architecture

Dr. Nexus follows a layered architecture:

1. **Ingestion Layer**: Reads raw medical data files
2. **Extraction Layer**: Extracts medical entities and events
3. **Knowledge Base Layer**: Merges and deduplicates data
4. **Analysis Layer**: Applies AI-powered insights
5. **Output Layer**: Generates validated JSON knowledge base

## Safety & Privacy

- All medical data stays local (no external transmission except to Claude API)
- API calls use encrypted HTTPS
- Version control enables rollback of any changes
- Comprehensive validation prevents data corruption
- Detailed logging for audit trails

## License

Private medical data processing system. Not for redistribution.

## Support

For issues or questions, please contact the development team.
