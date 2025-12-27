"""Patient demographic and profile models."""

from datetime import date
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class Gender(str, Enum):
    """Patient gender."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"


class ContactInfo(BaseModel):
    """Patient contact information."""
    phone: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = Field(default="USA")


class PatientDemographics(BaseModel):
    """Patient demographic information."""
    patient_id: str = Field(..., description="Unique patient identifier")
    name: str = Field(..., description="Patient full name")
    date_of_birth: date = Field(..., description="Date of birth")
    age: Optional[int] = Field(None, description="Current age in years")
    gender: Gender = Field(..., description="Patient gender")
    contact: ContactInfo = Field(default_factory=ContactInfo)
    mrn: Optional[str] = Field(None, description="Medical Record Number")
    ssn: Optional[str] = Field(None, description="Social Security Number (last 4 digits)")

    @field_validator('age', mode='before')
    @classmethod
    def calculate_age(cls, v: Optional[int], info) -> Optional[int]:
        """Calculate age from date of birth if not provided."""
        if v is not None:
            return v

        dob = info.data.get('date_of_birth')
        if dob:
            from datetime import date
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            return age
        return None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "patient_id": "6b021e33-3cf9-514d-9563-0459c5f01685",
                    "name": "John Doe",
                    "date_of_birth": "1994-06-16",
                    "age": 31,
                    "gender": "male",
                    "contact": {
                        "phone": "+1-555-0100",
                        "address_line1": "123 Main St",
                        "city": "Albany",
                        "state": "GA",
                        "zip_code": "31701"
                    },
                    "mrn": "P0-201508318-0000015570"
                }
            ]
        }
    }
