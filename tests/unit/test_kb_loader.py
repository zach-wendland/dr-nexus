"""Unit tests for KBLoader."""

import pytest
import json

from dr_nexus.knowledge_base.kb_loader import KBLoader
from dr_nexus.output.json_generator import JSONGenerator


class TestKBLoader:
    """Test suite for KBLoader."""

    def test_load_existing_kb(self, sample_knowledge_base, temp_json_file):
        """Test loading an existing knowledge base."""
        # Save KB to file
        JSONGenerator.save(sample_knowledge_base, temp_json_file)

        # Load it back
        loaded_kb = KBLoader.load(temp_json_file)

        assert loaded_kb is not None
        assert loaded_kb.metadata.version == sample_knowledge_base.metadata.version
        assert loaded_kb.patient_profile.demographics.name == sample_knowledge_base.patient_profile.demographics.name

    def test_load_nonexistent_kb(self, tmp_path):
        """Test loading a nonexistent file returns None."""
        nonexistent_file = tmp_path / "does_not_exist.json"

        loaded_kb = KBLoader.load(nonexistent_file)

        assert loaded_kb is None

    def test_load_or_create_new_existing(self, sample_knowledge_base, temp_json_file):
        """Test load_or_create_new with existing file."""
        JSONGenerator.save(sample_knowledge_base, temp_json_file)

        kb = KBLoader.load_or_create_new(temp_json_file)

        assert kb.metadata.version == "1.0.0"  # Loaded version

    def test_load_or_create_new_nonexistent(self, tmp_path):
        """Test load_or_create_new with nonexistent file creates new."""
        nonexistent_file = tmp_path / "new_kb.json"

        kb = KBLoader.load_or_create_new(nonexistent_file)

        assert kb is not None
        assert kb.metadata.version == "0.0.0"  # New KB version
        assert kb.patient_profile.demographics.patient_id == "unknown"

    def test_validate_valid_kb(self, sample_knowledge_base, temp_json_file):
        """Test validation of valid KB."""
        JSONGenerator.save(sample_knowledge_base, temp_json_file)

        is_valid = KBLoader.validate(temp_json_file)

        assert is_valid is True

    def test_validate_invalid_kb(self, tmp_path):
        """Test validation of invalid KB."""
        invalid_file = tmp_path / "invalid.json"

        # Write invalid JSON
        with open(invalid_file, 'w') as f:
            f.write('{"invalid": "structure"}')

        is_valid = KBLoader.validate(invalid_file)

        assert is_valid is False
