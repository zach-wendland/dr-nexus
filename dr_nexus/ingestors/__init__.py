"""Data ingestors for various medical document formats."""

from dr_nexus.ingestors.base import BaseIngestor
from dr_nexus.ingestors.fhir_ingestor import FHIRIngestor

__all__ = [
    "BaseIngestor",
    "FHIRIngestor",
]
