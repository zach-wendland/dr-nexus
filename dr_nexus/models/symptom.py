"""Symptom tracking models."""

from datetime import date
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, Field


class SymptomStatus(str, Enum):
    """Status of a symptom."""
    ACTIVE = "active"
    RESOLVED = "resolved"
    INTERMITTENT = "intermittent"
    WORSENING = "worsening"
    IMPROVING = "improving"


class SeverityLevel(str, Enum):
    """Severity level of a symptom."""
    NONE = "none"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class SeverityHistory(BaseModel):
    """Historical record of symptom severity."""
    assessment_date: date = Field(..., description="Date of assessment")
    severity: SeverityLevel = Field(..., description="Severity level")
    notes: Optional[str] = Field(None, description="Additional notes")


class Symptom(BaseModel):
    """Patient symptom information."""
    symptom: str = Field(..., description="Symptom description")
    status: SymptomStatus = Field(..., description="Current status")
    first_reported: date = Field(..., description="Date first reported")
    last_reported: date = Field(..., description="Date last reported")
    current_severity: Optional[SeverityLevel] = Field(None, description="Current severity")
    severity_history: List[SeverityHistory] = Field(
        default_factory=list,
        description="History of severity changes"
    )
    associated_conditions: List[str] = Field(
        default_factory=list,
        description="Associated medical conditions"
    )
    triggers: List[str] = Field(
        default_factory=list,
        description="Known triggers"
    )
    treatments: List[str] = Field(
        default_factory=list,
        description="Treatments tried"
    )
    notes: Optional[str] = Field(None, description="Additional notes")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "symptom": "Neck pain with radiation to left arm",
                    "status": "improving",
                    "first_reported": "2019-09-01",
                    "last_reported": "2025-12-15",
                    "current_severity": "mild",
                    "severity_history": [
                        {
                            "assessment_date": "2019-09-01",
                            "severity": "severe",
                            "notes": "Initial presentation"
                        },
                        {
                            "assessment_date": "2020-06-01",
                            "severity": "moderate",
                            "notes": "Post-surgery improvement"
                        },
                        {
                            "assessment_date": "2025-12-15",
                            "severity": "mild",
                            "notes": "Continued improvement with PT"
                        }
                    ],
                    "associated_conditions": ["Cervical cord compression", "Post-fusion"],
                    "triggers": ["Prolonged sitting", "Poor posture"],
                    "treatments": ["Physical therapy", "NSAIDs", "Surgical fusion"]
                }
            ]
        }
    }
