"""Unit tests for TimelineBuilder."""

import pytest
from datetime import datetime

from dr_nexus.extractors.timeline_builder import TimelineBuilder
from dr_nexus.models.timeline import TimelineEvent, EventType, ClinicalSignificance


class TestTimelineBuilder:
    """Test suite for TimelineBuilder."""

    def test_add_event(self, sample_timeline_event):
        """Test adding a single event."""
        builder = TimelineBuilder()
        builder.add_event(sample_timeline_event)

        assert len(builder) == 1
        assert builder.events[0] == sample_timeline_event

    def test_add_events(self, sample_timeline_event):
        """Test adding multiple events."""
        builder = TimelineBuilder()
        events = [sample_timeline_event] * 3

        builder.add_events(events)

        assert len(builder) == 3

    def test_sort_timeline(self):
        """Test chronological sorting of events."""
        builder = TimelineBuilder()

        # Add events out of order
        event1 = TimelineEvent(
            date=datetime(2020, 3, 15),
            event_type=EventType.ENCOUNTER,
            summary="Event 1"
        )
        event2 = TimelineEvent(
            date=datetime(2020, 1, 10),
            event_type=EventType.ENCOUNTER,
            summary="Event 2"
        )
        event3 = TimelineEvent(
            date=datetime(2020, 2, 20),
            event_type=EventType.ENCOUNTER,
            summary="Event 3"
        )

        builder.add_events([event1, event2, event3])
        sorted_events = builder.sort_timeline()

        # Verify chronological order
        assert sorted_events[0] == event2  # Jan
        assert sorted_events[1] == event3  # Feb
        assert sorted_events[2] == event1  # Mar

    def test_deduplicate_events(self):
        """Test deduplication of similar events."""
        builder = TimelineBuilder()

        # Add duplicate events (same date/time, type, summary)
        event1 = TimelineEvent(
            date=datetime(2020, 1, 15, 10, 0),
            event_type=EventType.ENCOUNTER,
            summary="Routine checkup"
        )
        event2 = TimelineEvent(
            date=datetime(2020, 1, 15, 10, 30),  # Within tolerance
            event_type=EventType.ENCOUNTER,
            summary="Routine checkup"
        )
        event3 = TimelineEvent(
            date=datetime(2020, 2, 15, 10, 0),  # Different date
            event_type=EventType.ENCOUNTER,
            summary="Routine checkup"
        )

        builder.add_events([event1, event2, event3])
        deduplicated = builder.deduplicate_events()

        # Should keep event1 and event3, remove event2 as duplicate
        assert len(deduplicated) == 2

    def test_get_events_by_type(self):
        """Test filtering events by type."""
        builder = TimelineBuilder()

        procedure = TimelineEvent(
            date=datetime.now(),
            event_type=EventType.PROCEDURE,
            summary="Surgery"
        )
        encounter = TimelineEvent(
            date=datetime.now(),
            event_type=EventType.ENCOUNTER,
            summary="Visit"
        )

        builder.add_events([procedure, encounter, procedure])

        procedures = builder.get_events_by_type(EventType.PROCEDURE)
        assert len(procedures) == 2

    def test_get_events_by_date_range(self):
        """Test filtering events by date range."""
        builder = TimelineBuilder()

        event1 = TimelineEvent(
            date=datetime(2020, 1, 1),
            event_type=EventType.ENCOUNTER,
            summary="Event 1"
        )
        event2 = TimelineEvent(
            date=datetime(2020, 6, 15),
            event_type=EventType.ENCOUNTER,
            summary="Event 2"
        )
        event3 = TimelineEvent(
            date=datetime(2020, 12, 31),
            event_type=EventType.ENCOUNTER,
            summary="Event 3"
        )

        builder.add_events([event1, event2, event3])

        # Get events in middle half of year
        events = builder.get_events_by_date_range(
            datetime(2020, 4, 1),
            datetime(2020, 9, 30)
        )

        assert len(events) == 1
        assert events[0] == event2

    def test_get_critical_events(self):
        """Test filtering critical significance events."""
        builder = TimelineBuilder()

        critical = TimelineEvent(
            date=datetime.now(),
            event_type=EventType.PROCEDURE,
            summary="Emergency surgery",
            clinical_significance=ClinicalSignificance.CRITICAL
        )
        routine = TimelineEvent(
            date=datetime.now(),
            event_type=EventType.ENCOUNTER,
            summary="Routine visit",
            clinical_significance=ClinicalSignificance.LOW
        )

        builder.add_events([critical, routine, critical])

        critical_events = builder.get_critical_events()
        assert len(critical_events) == 2

    def test_clear(self, sample_timeline_event):
        """Test clearing all events."""
        builder = TimelineBuilder()
        builder.add_events([sample_timeline_event] * 5)

        assert len(builder) == 5

        builder.clear()

        assert len(builder) == 0
        assert builder.events == []
