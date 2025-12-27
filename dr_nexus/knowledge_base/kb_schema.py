"""Knowledge Base schema definitions."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from dr_nexus.models.patient import PatientDemographics
from dr_nexus.models.condition import Condition, ImplantedDevice, Allergy
from dr_nexus.models.timeline import TimelineEvent
from dr_nexus.models.symptom import Symptom
from dr_nexus.models.action_item import ActionItem, UnresolvedQuestion


class Metadata(BaseModel):
    """Metadata for the knowledge base."""
    version: str = Field(..., description="Knowledge base version")
    generated_at: datetime = Field(..., description="Generation timestamp")
    source_files_count: int = Field(..., description="Number of source files processed")
    processing_duration_seconds: float = Field(..., description="Processing duration")
    dr_nexus_version: str = Field(default="1.0.0", description="Dr. Nexus version")
    previous_version: Optional[str] = Field(None, description="Previous KB version")
    changelog: Optional[str] = Field(None, description="Changes from previous version")


class CareTeamMember(BaseModel):
    """Member of the patient care team."""
    name: str = Field(..., description="Provider name")
    role: str = Field(..., description="Role/specialty")
    organization: Optional[str] = Field(None, description="Organization")
    phone: Optional[str] = Field(None, description="Contact phone")
    email: Optional[str] = Field(None, description="Contact email")


class PatientProfile(BaseModel):
    """Comprehensive patient profile."""
    demographics: PatientDemographics = Field(..., description="Patient demographics")
    chronic_conditions: List[Condition] = Field(
        default_factory=list,
        description="Chronic medical conditions"
    )
    implanted_devices: List[ImplantedDevice] = Field(
        default_factory=list,
        description="Implanted medical devices"
    )
    allergies: List[Allergy] = Field(
        default_factory=list,
        description="Known allergies"
    )
    primary_care_team: List[CareTeamMember] = Field(
        default_factory=list,
        description="Primary care team members"
    )


class KnowledgeBase(BaseModel):
    """Complete medical knowledge base for a patient."""
    metadata: Metadata = Field(..., description="Knowledge base metadata")
    patient_profile: PatientProfile = Field(..., description="Patient profile")
    timeline: List[TimelineEvent] = Field(
        default_factory=list,
        description="Chronological timeline of medical events"
    )
    symptom_registry: List[Symptom] = Field(
        default_factory=list,
        description="Registry of symptoms and their progression"
    )
    action_items: List[ActionItem] = Field(
        default_factory=list,
        description="Actionable items from medical records"
    )
    unresolved_questions: List[UnresolvedQuestion] = Field(
        default_factory=list,
        description="Unresolved questions and conflicts"
    )

    def sort_timeline(self) -> None:
        """Sort timeline events chronologically."""
        self.timeline.sort(key=lambda e: e.date)

    def get_active_conditions(self) -> List[Condition]:
        """Get list of active conditions."""
        return [c for c in self.patient_profile.chronic_conditions if c.status.value == "active"]

    def get_active_symptoms(self) -> List[Symptom]:
        """Get list of active symptoms."""
        return [s for s in self.symptom_registry if s.status.value == "active"]

    def get_pending_actions(self) -> List[ActionItem]:
        """Get list of pending action items."""
        return [a for a in self.action_items if a.status.value == "pending"]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "metadata": {
                        "version": "1.0.0",
                        "generated_at": "2025-12-27T12:00:00",
                        "source_files_count": 634,
                        "processing_duration_seconds": 120.5,
                        "dr_nexus_version": "1.0.0"
                    },
                    "patient_profile": {
                        "demographics": {
                            "patient_id": "6b021e33-3cf9-514d-9563-0459c5f01685",
                            "name": "John Doe",
                            "date_of_birth": "1994-06-16",
                            "age": 31,
                            "gender": "male"
                        },
                        "chronic_conditions": [],
                        "implanted_devices": [],
                        "allergies": [],
                        "primary_care_team": []
                    },
                    "timeline": [],
                    "symptom_registry": [],
                    "action_items": [],
                    "unresolved_questions": []
                }
            ]
        }
    }
