# Dr. Nexus - Quick Start Guide

Get Dr. Nexus running in 5 minutes!

---

## 🚀 Installation

### Option 1: Using pip (Recommended)
```bash
cd C:/Users/lyyud/projects/health
pip install -r requirements.txt
```

### Option 2: Using Poetry
```bash
cd C:/Users/lyyud/projects/health
poetry install
poetry shell
```

---

## ⚙️ Configuration (Optional)

Create `.env` file for API integration:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

**Note:** API key is optional. The system works without it (Ultrathink analysis will be skipped).

---

## 📦 Build Your Knowledge Base

### Quick Build
```bash
python scripts/initial_build.py \
    --data-dir "C:/Users/lyyud/projects/health" \
    --output "data/knowledge_base/current.json"
```

This will:
- Scan for medical files (FHIR, C-CDA, PDFs)
- Extract patient data, conditions, timeline
- Generate `data/knowledge_base/current.json`

### Expected Output
```
============================================================
Dr. Nexus - Initial Knowledge Base Build
============================================================
Found files:
  - FHIR: 1
  - C-CDA: 58
  - PDF: 308
  - Images: 307

Processing...
Knowledge base created:
  - 166 timeline events
  - 10 conditions
  - 10 devices

Duration: 2.21 seconds
Output: data/knowledge_base/current.json
============================================================
```

---

## 🔍 Verify Your Build

### Check the output file
```bash
ls -lh data/knowledge_base/current.json
```

Should show ~96KB file.

### View statistics
```bash
python -c "from dr_nexus.knowledge_base import KBLoader; kb = KBLoader.load('data/knowledge_base/current.json'); print(f'Events: {len(kb.timeline)}, Conditions: {len(kb.patient_profile.chronic_conditions)}')"
```

---

## 📊 View Your Knowledge Base

### Option 1: JSON Viewer
Open `data/knowledge_base/current.json` in any JSON viewer or VS Code.

### Option 2: Pretty Print
```bash
python -c "import json; print(json.dumps(json.load(open('data/knowledge_base/current.json')), indent=2))" | head -100
```

### Option 3: Python
```python
from dr_nexus.knowledge_base import KBLoader

kb = KBLoader.load('data/knowledge_base/current.json')

print(f"Patient: {kb.patient_profile.demographics.name}")
print(f"Age: {kb.patient_profile.demographics.age}")
print(f"Timeline events: {len(kb.timeline)}")
print(f"Active conditions: {len(kb.get_active_conditions())}")
```

---

## 🧪 Run Tests

### Quick test
```bash
pytest tests/unit/test_timeline_builder.py -v
```

### Full test suite
```bash
pytest
```

### With coverage
```bash
pytest --cov=dr_nexus --cov-report=term-missing
```

---

## 🔄 Incremental Updates

When you have new medical files:

```python
from pathlib import Path
from dr_nexus.knowledge_base import KBLoader, KBMerger
from dr_nexus.ingestors.fhir_ingestor import FHIRIngestor
from dr_nexus.extractors.timeline_builder import TimelineBuilder
from dr_nexus.output import JSONGenerator

# Load existing KB
kb = KBLoader.load(Path('data/knowledge_base/current.json'))

# Process new files
ingestor = FHIRIngestor()
new_data = ingestor.ingest(Path('new_medical_record.json'))

timeline = TimelineBuilder()
timeline.build_from_fhir_data(new_data)

# Merge
merger = KBMerger()
merged_kb = merger.merge(kb, {
    'conditions': new_data.get('conditions', []),
    'timeline_events': timeline.get_timeline()
})

# Save
JSONGenerator.save(merged_kb, Path('data/knowledge_base/current.json'))
```

---

## 🎯 Common Tasks

### 1. Extract Patient Name
```python
from dr_nexus.knowledge_base import KBLoader
kb = KBLoader.load('data/knowledge_base/current.json')
print(kb.patient_profile.demographics.name)
```

### 2. Get Recent Timeline Events
```python
from dr_nexus.knowledge_base import KBLoader
kb = KBLoader.load('data/knowledge_base/current.json')
recent = sorted(kb.timeline, key=lambda e: e.date, reverse=True)[:10]
for event in recent:
    print(f"{event.date.strftime('%Y-%m-%d')}: {event.summary}")
```

### 3. List Active Conditions
```python
from dr_nexus.knowledge_base import KBLoader
kb = KBLoader.load('data/knowledge_base/current.json')
for condition in kb.get_active_conditions():
    print(f"- {condition.name} (ICD-10: {condition.icd10_code})")
```

### 4. Find Procedures
```python
from dr_nexus.knowledge_base import KBLoader
from dr_nexus.models.timeline import EventType

kb = KBLoader.load('data/knowledge_base/current.json')
procedures = [e for e in kb.timeline if e.event_type == EventType.PROCEDURE]
for proc in procedures:
    print(f"{proc.date.strftime('%Y-%m-%d')}: {proc.summary}")
```

---

## 🐛 Troubleshooting

### Issue: "Module not found"
**Solution:** Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: "File not found"
**Solution:** Use absolute paths
```bash
python scripts/initial_build.py --data-dir "C:/Users/lyyud/projects/health"
```

### Issue: "Pydantic validation error"
**Solution:** Check Python version (needs 3.11+)
```bash
python --version
```

### Issue: "No medical files found"
**Solution:** Verify data directory path
```bash
ls "C:/Users/lyyud/projects/health/MedicalRecord_ZacharyWendland"
```

---

## 📚 Next Steps

### Learn More
- Read `README.md` for detailed architecture
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Browse `dr_nexus/models/` for data schemas

### Extend Functionality
1. Add PDF parsing (see `dr_nexus/ingestors/pdf_ingestor.py`)
2. Enable Ultrathink with API key
3. Create custom analysis scripts
4. Build a web UI

### Customize
- Modify `config/schema.json` for custom fields
- Add new ingestors in `dr_nexus/ingestors/`
- Extend models in `dr_nexus/models/`

---

## 💡 Tips

1. **Always backup before major changes**
   ```bash
   cp data/knowledge_base/current.json data/knowledge_base/backup.json
   ```

2. **Use version control**
   - Git tracks code changes
   - Dr. Nexus tracks KB versions automatically

3. **Check logs for debugging**
   ```bash
   tail -f data/logs/dr_nexus_*.log
   ```

4. **Validate after changes**
   ```bash
   python -c "from dr_nexus.knowledge_base import KBLoader; print('✓ Valid' if KBLoader.validate('data/knowledge_base/current.json') else '✗ Invalid')"
   ```

---

## 🎉 Success!

You now have a working medical knowledge base system!

**Your KB is at:** `data/knowledge_base/current.json`

**Next:** Open it in a JSON viewer to explore your medical timeline!

---

**Need help?** Check the logs in `data/logs/` or run tests with `pytest -v`

*Dr. Nexus v1.0.0*
