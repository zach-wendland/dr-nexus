"""Unit tests for KBMerger."""

import pytest
from datetime import datetime, date

from dr_nexus.knowledge_base.kb_merger import KBMerger
from dr_nexus.models.condition import Condition, ConditionStatus
from dr_nexus.models.timeline import TimelineEvent, EventType


class TestKBMerger:
    """Test suite for KBMerger."""

    def test_merge_conditions_no_duplicates(self, sample_knowledge_base):
        """Test merging conditions with no duplicates."""
        merger = KBMerger()

        new_condition = Condition(
            name="Diabetes",
            icd10_code="E11",
            status=ConditionStatus.ACTIVE,
            onset_date=date(2021, 1, 1)
        )

        new_data = {
            'conditions': [new_condition],
            'timeline_events': []
        }

        merged = merger.merge(sample_knowledge_base, new_data)

        # Should have original condition + new one
        assert len(merged.patient_profile.chronic_conditions) == 2

    def test_merge_conditions_with_duplicates(self, sample_knowledge_base, sample_condition):
        """Test merging conditions with duplicates."""
        merger = KBMerger()

        # Try to add the same condition again
        new_data = {
            'conditions': [sample_condition],
            'timeline_events': []
        }

        merged = merger.merge(sample_knowledge_base, new_data)

        # Should still have only 1 condition (deduplication)
        assert len(merged.patient_profile.chronic_conditions) == 1

    def test_merge_timeline_events(self, sample_knowledge_base):
        """Test merging timeline events."""
        merger = KBMerger()

        # Add initial events
        event1 = TimelineEvent(
            date=datetime(2020, 1, 1),
            event_type=EventType.ENCOUNTER,
            summary="Visit 1"
        )
        sample_knowledge_base.timeline.append(event1)

        # Merge new event
        event2 = TimelineEvent(
            date=datetime(2020, 2, 1),
            event_type=EventType.ENCOUNTER,
            summary="Visit 2"
        )

        new_data = {
            'timeline_events': [event2]
        }

        merged = merger.merge(sample_knowledge_base, new_data)

        assert len(merged.timeline) == 2

        # Verify chronological order
        assert merged.timeline[0].date < merged.timeline[1].date

    def test_merge_timeline_deduplication(self, sample_knowledge_base):
        """Test timeline event deduplication."""
        merger = KBMerger()

        # Add event
        event = TimelineEvent(
            date=datetime(2020, 1, 1, 10, 0),
            event_type=EventType.ENCOUNTER,
            summary="Visit"
        )
        sample_knowledge_base.timeline.append(event)

        # Try to merge duplicate (same date rounded to hour, type, summary)
        duplicate_event = TimelineEvent(
            date=datetime(2020, 1, 1, 10, 30),
            event_type=EventType.ENCOUNTER,
            summary="Visit"
        )

        new_data = {
            'timeline_events': [duplicate_event]
        }

        merged = merger.merge(sample_knowledge_base, new_data)

        # Should still have only 1 event
        assert len(merged.timeline) == 1

    def test_version_increment(self, sample_knowledge_base):
        """Test version incrementing."""
        merger = KBMerger()

        assert sample_knowledge_base.metadata.version == "1.0.0"

        new_data = {}
        merged = merger.merge(sample_knowledge_base, new_data)

        # Version should increment patch number
        assert merged.metadata.version == "1.0.1"
        assert merged.metadata.previous_version == "1.0.0"

    def test_preserve_history(self, sample_knowledge_base):
        """Test that historical data is preserved."""
        merger = KBMerger()

        original_condition = sample_knowledge_base.patient_profile.chronic_conditions[0]

        # Merge with empty data
        new_data = {
            'conditions': []
        }

        merged = merger.merge(sample_knowledge_base, new_data, preserve_all_history=True)

        # Original condition should still be there
        assert len(merged.patient_profile.chronic_conditions) == 1
        assert merged.patient_profile.chronic_conditions[0] == original_condition
