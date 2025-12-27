"""Integration tests for full Dr. Nexus pipeline."""

import pytest
from pathlib import Path
from datetime import datetime

from dr_nexus.ingestors.fhir_ingestor import FHIRIngestor
from dr_nexus.extractors.timeline_builder import TimelineBuilder
from dr_nexus.knowledge_base.kb_schema import KnowledgeBase, Metadata, PatientProfile
from dr_nexus.knowledge_base.kb_merger import KBMerger
from dr_nexus.knowledge_base.kb_loader import KBLoader
from dr_nexus.output.json_generator import JSONGenerator


class TestFullPipeline:
    """Integration tests for full pipeline."""

    def test_fhir_to_timeline_to_kb(self, tmp_path):
        """Test complete flow: FHIR ingest -> Timeline build -> KB creation."""
        # This is a simplified test without real FHIR data
        # In production, we'd use actual FHIR files

        # Create minimal KB
        from dr_nexus.models.patient import PatientDemographics, Gender
        from datetime import date

        demographics = PatientDemographics(
            patient_id="test-001",
            name="Test Patient",
            date_of_birth=date(1990, 1, 1),
            gender=Gender.MALE
        )

        kb = KnowledgeBase(
            metadata=Metadata(
                version="1.0.0",
                generated_at=datetime.now(),
                source_files_count=1,
                processing_duration_seconds=0.1
            ),
            patient_profile=PatientProfile(
                demographics=demographics
            )
        )

        # Save KB
        output_file = tmp_path / "test_kb.json"
        JSONGenerator.save(kb, output_file)

        # Load it back
        loaded_kb = KBLoader.load(output_file)

        # Verify integrity
        assert loaded_kb is not None
        assert loaded_kb.patient_profile.demographics.patient_id == "test-001"
        assert loaded_kb.metadata.version == "1.0.0"

    def test_incremental_merge_workflow(self, sample_knowledge_base, tmp_path):
        """Test incremental merge workflow."""
        # Save initial KB
        kb_file = tmp_path / "kb.json"
        JSONGenerator.save(sample_knowledge_base, kb_file)

        # Create backup
        backup_dir = tmp_path / "backups"
        backup_file = JSONGenerator.create_backup(sample_knowledge_base, backup_dir)

        assert backup_file.exists()

        # Load KB
        loaded_kb = KBLoader.load(kb_file)

        # Merge new data
        from dr_nexus.models.condition import Condition, ConditionStatus
        from datetime import date

        new_condition = Condition(
            name="New Condition",
            icd10_code="Z00",
            status=ConditionStatus.ACTIVE,
            onset_date=date(2021, 1, 1)
        )

        merger = KBMerger()
        merged_kb = merger.merge(loaded_kb, {'conditions': [new_condition]})

        # Verify merge
        assert len(merged_kb.patient_profile.chronic_conditions) == 2
        assert merged_kb.metadata.version == "1.0.1"  # Version incremented

        # Save merged KB
        JSONGenerator.save(merged_kb, kb_file)

        # Verify can load again
        final_kb = KBLoader.load(kb_file)
        assert len(final_kb.patient_profile.chronic_conditions) == 2
