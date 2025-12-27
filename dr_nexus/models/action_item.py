"""Action item models."""

from datetime import date
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class ActionPriority(str, Enum):
    """Priority level of an action item."""
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ActionCategory(str, Enum):
    """Category of action item."""
    FOLLOW_UP = "follow_up"
    TESTING = "testing"
    MEDICATION_REVIEW = "medication_review"
    SPECIALIST_REFERRAL = "specialist_referral"
    IMAGING = "imaging"
    THERAPY = "therapy"
    LIFESTYLE = "lifestyle"
    OTHER = "other"


class ActionStatus(str, Enum):
    """Status of an action item."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class ActionItem(BaseModel):
    """An actionable task extracted from medical records."""
    item: str = Field(..., description="Action item description")
    priority: ActionPriority = Field(..., description="Priority level")
    category: ActionCategory = Field(..., description="Category of action")
    due_date: Optional[date] = Field(None, description="Due date if specified")
    source: str = Field(..., description="Source document/note")
    source_date: Optional[date] = Field(None, description="Date of source document")
    status: ActionStatus = Field(default=ActionStatus.PENDING, description="Current status")
    completed_date: Optional[date] = Field(None, description="Date completed")
    notes: Optional[str] = Field(None, description="Additional notes")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "item": "Schedule 6-month post-op follow-up with neurosurgery",
                    "priority": "high",
                    "category": "follow_up",
                    "due_date": "2020-11-15",
                    "source": "Operative report 2020-05-15",
                    "source_date": "2020-05-15",
                    "status": "pending",
                    "notes": "Evaluate fusion status and hardware integrity"
                }
            ]
        }
    }


class UnresolvedQuestion(BaseModel):
    """An unresolved question or conflict in medical records."""
    question: str = Field(..., description="The question or conflict")
    context: str = Field(..., description="Context and relevant information")
    identified_date: date = Field(..., description="Date identified")
    requires_clarification_from: Optional[str] = Field(
        None,
        description="Who should clarify (provider, patient, etc.)"
    )
    priority: ActionPriority = Field(
        default=ActionPriority.MEDIUM,
        description="Priority for resolution"
    )
    related_documents: list[str] = Field(
        default_factory=list,
        description="Related source documents"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "question": "Conflicting dates for initial symptom onset",
                    "context": "FHIR record shows 2019-08-01, but clinical note mentions 'symptoms began in late September 2019'",
                    "identified_date": "2025-12-27",
                    "requires_clarification_from": "Primary care provider",
                    "priority": "low",
                    "related_documents": ["FHIR Bundle", "Clinical note 2019-10-15"]
                }
            ]
        }
    }
