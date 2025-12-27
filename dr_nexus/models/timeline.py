"""Timeline event models."""

from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field


class EventType(str, Enum):
    """Type of timeline event."""
    ENCOUNTER = "encounter"
    PROCEDURE = "procedure"
    DIAGNOSIS = "diagnosis"
    MEDICATION = "medication"
    LAB_RESULT = "lab_result"
    IMAGING = "imaging"
    SYMPTOM = "symptom"
    VITAL_SIGNS = "vital_signs"
    DEVICE_IMPLANT = "device_implant"
    REFERRAL = "referral"
    OTHER = "other"


class ClinicalSignificance(str, Enum):
    """Clinical significance level of an event."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TimelineEvent(BaseModel):
    """A single event in the patient timeline."""
    date: datetime = Field(..., description="Event date and time")
    event_type: EventType = Field(..., description="Type of event")
    summary: str = Field(..., description="Brief summary of the event")
    details: Dict[str, Any] = Field(default_factory=dict, description="Detailed information")
    source_document: Optional[str] = Field(None, description="Source document filename")
    clinical_significance: ClinicalSignificance = Field(
        default=ClinicalSignificance.MEDIUM,
        description="Clinical significance"
    )
    location: Optional[str] = Field(None, description="Location of event (hospital, clinic)")
    provider: Optional[str] = Field(None, description="Healthcare provider")
    codes: Dict[str, str] = Field(
        default_factory=dict,
        description="Medical codes (ICD-10, CPT, SNOMED, etc.)"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "date": "2020-05-15T08:30:00",
                    "event_type": "procedure",
                    "summary": "Anterior cervical discectomy and fusion C5-C6",
                    "details": {
                        "procedure_name": "ACDF C5-C6",
                        "approach": "anterior",
                        "levels": ["C5-C6"],
                        "hardware": "cage and plate system",
                        "anesthesia": "general"
                    },
                    "source_document": "operative_report_2020-05-15.pdf",
                    "clinical_significance": "critical",
                    "location": "Phoebe Putney Memorial Hospital",
                    "provider": "Dr. Smith (Neurosurgery)",
                    "codes": {
                        "cpt": "22551",
                        "icd10_pcs": "0RG10J0"
                    }
                }
            ]
        }
    }
