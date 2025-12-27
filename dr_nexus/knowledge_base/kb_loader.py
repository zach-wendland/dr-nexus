"""Knowledge base loader."""

import json
from pathlib import Path
from typing import Optional
import logging

from pydantic import ValidationError

from dr_nexus.knowledge_base.kb_schema import KnowledgeBase


logger = logging.getLogger(__name__)


class KBLoader:
    """Load and validate knowledge base from JSON files."""

    @staticmethod
    def load(filepath: Path) -> Optional[KnowledgeBase]:
        """
        Load knowledge base from JSON file.

        Args:
            filepath: Path to knowledge base JSON file

        Returns:
            KnowledgeBase object or None if file doesn't exist

        Raises:
            ValidationError: If JSON doesn't match schema
            json.JSONDecodeError: If JSON is malformed
        """
        if not filepath.exists():
            logger.warning(f"Knowledge base file not found: {filepath}")
            return None

        logger.info(f"Loading knowledge base from: {filepath}")

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        try:
            kb = KnowledgeBase(**data)
            logger.info(f"Loaded KB with {len(kb.timeline)} timeline events")
            return kb
        except ValidationError as e:
            logger.error(f"Knowledge base validation failed: {e}")
            raise

    @staticmethod
    def load_or_create_new(filepath: Path) -> KnowledgeBase:
        """
        Load existing KB or create a new empty one.

        Args:
            filepath: Path to knowledge base JSON file

        Returns:
            KnowledgeBase object (loaded or new)
        """
        kb = KBLoader.load(filepath)
        if kb is None:
            logger.info("Creating new knowledge base")
            from datetime import datetime
            from dr_nexus.knowledge_base.kb_schema import Metadata, PatientProfile
            from dr_nexus.models.patient import PatientDemographics, Gender
            from datetime import date

            kb = KnowledgeBase(
                metadata=Metadata(
                    version="0.0.0",
                    generated_at=datetime.now(),
                    source_files_count=0,
                    processing_duration_seconds=0.0
                ),
                patient_profile=PatientProfile(
                    demographics=PatientDemographics(
                        patient_id="unknown",
                        name="Unknown Patient",
                        date_of_birth=date(1900, 1, 1),
                        gender=Gender.UNKNOWN
                    )
                )
            )
        return kb

    @staticmethod
    def validate(filepath: Path) -> bool:
        """
        Validate knowledge base JSON without loading.

        Args:
            filepath: Path to knowledge base JSON file

        Returns:
            True if valid, False otherwise
        """
        try:
            kb = KBLoader.load(filepath)
            return kb is not None
        except (ValidationError, json.JSONDecodeError) as e:
            logger.error(f"Validation failed: {e}")
            return False
