"""Document metadata models."""

from datetime import datetime
from typing import Optional
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    """Type of medical document."""
    FHIR_BUNDLE = "fhir_bundle"
    CCDA = "ccda"
    PDF = "pdf"
    NDJSON = "ndjson"
    IMAGE = "image"
    HTML = "html"
    OTHER = "other"


class DocumentMetadata(BaseModel):
    """Metadata for a medical document."""
    filename: str = Field(..., description="Document filename")
    filepath: str = Field(..., description="Full file path")
    document_type: DocumentType = Field(..., description="Type of document")
    file_size_bytes: int = Field(..., description="File size in bytes")
    created_date: Optional[datetime] = Field(None, description="Document creation date")
    modified_date: Optional[datetime] = Field(None, description="Last modified date")
    processed_date: Optional[datetime] = Field(None, description="Date processed by Dr. Nexus")
    content_date: Optional[datetime] = Field(None, description="Date of medical content")
    author: Optional[str] = Field(None, description="Document author")
    organization: Optional[str] = Field(None, description="Healthcare organization")
    patient_id: Optional[str] = Field(None, description="Patient identifier in document")
    encounter_id: Optional[str] = Field(None, description="Encounter identifier")
    document_id: Optional[str] = Field(None, description="Unique document identifier")
    processing_status: str = Field(default="pending", description="Processing status")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")

    @classmethod
    def from_file(cls, filepath: Path, document_type: DocumentType) -> "DocumentMetadata":
        """Create metadata from a file path."""
        import os
        stat = os.stat(filepath)

        return cls(
            filename=filepath.name,
            filepath=str(filepath),
            document_type=document_type,
            file_size_bytes=stat.st_size,
            created_date=datetime.fromtimestamp(stat.st_ctime),
            modified_date=datetime.fromtimestamp(stat.st_mtime),
        )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "filename": "US Core FHIR Resources.json",
                    "filepath": "C:/Users/lyyud/projects/health/MedicalRecord_ZacharyWendland/US Core FHIR Resources.json",
                    "document_type": "fhir_bundle",
                    "file_size_bytes": 112640,
                    "modified_date": "2025-12-23T10:30:00",
                    "organization": "Phoebe Putney Health Systems",
                    "patient_id": "6b021e33-3cf9-514d-9563-0459c5f01685",
                    "processing_status": "completed"
                }
            ]
        }
    }
