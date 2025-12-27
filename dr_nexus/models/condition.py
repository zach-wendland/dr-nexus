"""Medical condition and diagnosis models."""

from datetime import date
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class ConditionStatus(str, Enum):
    """Status of a medical condition."""
    ACTIVE = "active"
    RESOLVED = "resolved"
    IN_REMISSION = "in_remission"
    RECURRENCE = "recurrence"


class Condition(BaseModel):
    """Medical condition or diagnosis."""
    name: str = Field(..., description="Condition name")
    icd10_code: Optional[str] = Field(None, description="ICD-10 diagnosis code")
    snomed_code: Optional[str] = Field(None, description="SNOMED CT code")
    status: ConditionStatus = Field(..., description="Current status")
    onset_date: Optional[date] = Field(None, description="Date of onset")
    resolution_date: Optional[date] = Field(None, description="Date of resolution")
    clinical_status: Optional[str] = Field(None, description="Clinical status from source")
    verification_status: Optional[str] = Field(None, description="Verification status")
    severity: Optional[str] = Field(None, description="Condition severity")
    notes: Optional[str] = Field(None, description="Additional notes")
    source_document: Optional[str] = Field(None, description="Source document reference")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Cerebrovascular accident",
                    "icd10_code": "I63.9",
                    "snomed_code": "230690007",
                    "status": "active",
                    "onset_date": "2016-08-12",
                    "clinical_status": "active",
                    "verification_status": "confirmed",
                    "severity": "severe",
                    "notes": "Left-sided weakness, speech difficulty"
                }
            ]
        }
    }


class ImplantedDevice(BaseModel):
    """Implanted medical device."""
    device_type: str = Field(..., description="Type of device")
    device_name: str = Field(..., description="Device name/model")
    udi: Optional[str] = Field(None, description="Unique Device Identifier")
    implant_date: Optional[date] = Field(None, description="Date of implantation")
    manufacturer: Optional[str] = Field(None, description="Device manufacturer")
    lot_number: Optional[str] = Field(None, description="Lot/serial number")
    status: str = Field(default="active", description="Device status")
    notes: Optional[str] = Field(None, description="Additional notes")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "device_type": "Spinal fusion implant",
                    "device_name": "Cervical cage with plate system",
                    "implant_date": "2020-05-15",
                    "manufacturer": "Medtronic",
                    "status": "active"
                }
            ]
        }
    }


class Allergy(BaseModel):
    """Patient allergy information."""
    allergen: str = Field(..., description="Substance causing allergy")
    reaction: Optional[str] = Field(None, description="Type of reaction")
    severity: Optional[str] = Field(None, description="Severity of reaction")
    onset_date: Optional[date] = Field(None, description="Date first identified")
    status: str = Field(default="active", description="Allergy status")
    notes: Optional[str] = Field(None, description="Additional notes")
