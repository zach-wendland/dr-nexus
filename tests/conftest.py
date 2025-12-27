"""Pytest configuration and fixtures."""

import pytest
from pathlib import Path
from datetime import datetime, date

from dr_nexus.models.patient import PatientDemographics, ContactInfo, Gender
from dr_nexus.models.condition import Condition, ConditionStatus
from dr_nexus.models.timeline import TimelineEvent, EventType, ClinicalSignificance
from dr_nexus.models.symptom import Symptom, SymptomStatus
from dr_nexus.knowledge_base.kb_schema import KnowledgeBase, Metadata, PatientProfile


@pytest.fixture
def sample_patient_demographics():
    """Sample patient demographics for testing."""
    return PatientDemographics(
        patient_id="test-patient-001",
        name="John Doe",
        date_of_birth=date(1990, 1, 1),
        age=35,
        gender=Gender.MALE,
        contact=ContactInfo(
            phone="+1-555-0100",
            city="Albany",
            state="GA",
            zip_code="31701"
        ),
        mrn="MRN-12345"
    )


@pytest.fixture
def sample_condition():
    """Sample medical condition for testing."""
    return Condition(
        name="Hypertension",
        icd10_code="I10",
        snomed_code="38341003",
        status=ConditionStatus.ACTIVE,
        onset_date=date(2020, 1, 1),
        clinical_status="active",
        verification_status="confirmed"
    )


@pytest.fixture
def sample_timeline_event():
    """Sample timeline event for testing."""
    return TimelineEvent(
        date=datetime(2020, 5, 15, 10, 30),
        event_type=EventType.PROCEDURE,
        summary="Routine checkup",
        details={"provider": "Dr. Smith"},
        source_document="encounter_2020-05-15.xml",
        clinical_significance=ClinicalSignificance.MEDIUM
    )


@pytest.fixture
def sample_symptom():
    """Sample symptom for testing."""
    return Symptom(
        symptom="Headache",
        status=SymptomStatus.ACTIVE,
        first_reported=date(2020, 1, 1),
        last_reported=date(2020, 12, 31),
        associated_conditions=["Hypertension"]
    )


@pytest.fixture
def sample_knowledge_base(sample_patient_demographics, sample_condition):
    """Sample knowledge base for testing."""
    return KnowledgeBase(
        metadata=Metadata(
            version="1.0.0",
            generated_at=datetime.now(),
            source_files_count=10,
            processing_duration_seconds=5.0
        ),
        patient_profile=PatientProfile(
            demographics=sample_patient_demographics,
            chronic_conditions=[sample_condition]
        )
    )


@pytest.fixture
def temp_json_file(tmp_path):
    """Temporary JSON file path for testing."""
    return tmp_path / "test_kb.json"
