"""Build chronological timeline from medical events."""

from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

from dr_nexus.models.timeline import TimelineEvent, EventType, ClinicalSignificance


logger = logging.getLogger(__name__)


class TimelineBuilder:
    """Build and manage chronological medical timeline."""

    def __init__(self) -> None:
        """Initialize timeline builder."""
        self.events: List[TimelineEvent] = []

    def add_event(self, event: TimelineEvent) -> None:
        """
        Add a single event to the timeline.

        Args:
            event: TimelineEvent to add
        """
        self.events.append(event)

    def add_events(self, events: List[TimelineEvent]) -> None:
        """
        Add multiple events to the timeline.

        Args:
            events: List of TimelineEvent objects
        """
        self.events.extend(events)

    def sort_timeline(self) -> List[TimelineEvent]:
        """
        Sort all events chronologically.

        Returns:
            Sorted list of TimelineEvent objects
        """
        self.events.sort(key=lambda e: e.date)
        return self.events

    def deduplicate_events(self, tolerance_hours: int = 24) -> List[TimelineEvent]:
        """
        Remove duplicate events based on date, type, and summary.

        Events are considered duplicates if they occur within tolerance_hours
        of each other and have the same type and similar summary.

        Args:
            tolerance_hours: Hour tolerance for considering events as duplicates

        Returns:
            Deduplicated list of events
        """
        if not self.events:
            return []

        # Sort first
        sorted_events = self.sort_timeline()

        deduplicated = []
        seen = set()

        for event in sorted_events:
            # Create a dedup key based on date (to hour), type, and summary
            date_key = event.date.replace(minute=0, second=0, microsecond=0)
            summary_key = event.summary.lower().strip()[:100]  # First 100 chars
            key = (date_key, event.event_type, summary_key)

            if key not in seen:
                seen.add(key)
                deduplicated.append(event)
            else:
                logger.debug(f"Duplicate event removed: {event.summary} on {event.date}")

        self.events = deduplicated
        return deduplicated

    def merge_timelines(self, other_events: List[TimelineEvent]) -> List[TimelineEvent]:
        """
        Merge another timeline into this one, removing duplicates.

        Args:
            other_events: List of events from another timeline

        Returns:
            Merged and deduplicated timeline
        """
        self.add_events(other_events)
        return self.deduplicate_events()

    def get_events_by_type(self, event_type: EventType) -> List[TimelineEvent]:
        """
        Get all events of a specific type.

        Args:
            event_type: EventType to filter by

        Returns:
            List of events matching the type
        """
        return [e for e in self.events if e.event_type == event_type]

    def get_events_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[TimelineEvent]:
        """
        Get events within a date range.

        Args:
            start_date: Start of date range (inclusive)
            end_date: End of date range (inclusive)

        Returns:
            List of events within the range
        """
        return [
            e for e in self.events
            if start_date <= e.date <= end_date
        ]

    def get_critical_events(self) -> List[TimelineEvent]:
        """
        Get all critical significance events.

        Returns:
            List of critical events
        """
        return [
            e for e in self.events
            if e.clinical_significance == ClinicalSignificance.CRITICAL
        ]

    def create_event_from_fhir_procedure(self, proc_data: Dict[str, Any]) -> TimelineEvent:
        """
        Create a TimelineEvent from FHIR procedure data.

        Args:
            proc_data: Dictionary containing FHIR procedure data

        Returns:
            TimelineEvent object
        """
        # This is already handled by FHIR ingestor
        pass

    def create_event_from_encounter(
        self,
        encounter_data: Dict[str, Any],
        source: str = None
    ) -> TimelineEvent:
        """
        Create a TimelineEvent from encounter data.

        Args:
            encounter_data: Dictionary containing encounter data
            source: Source document name

        Returns:
            TimelineEvent object
        """
        date = encounter_data.get('date', datetime.now())
        if isinstance(date, str):
            date = datetime.fromisoformat(date.replace('Z', '+00:00'))

        return TimelineEvent(
            date=date,
            event_type=EventType.ENCOUNTER,
            summary=encounter_data.get('type', 'Medical encounter'),
            details=encounter_data,
            source_document=source,
            clinical_significance=ClinicalSignificance.MEDIUM
        )

    def create_event_from_diagnosis(
        self,
        diagnosis_data: Dict[str, Any],
        source: str = None
    ) -> TimelineEvent:
        """
        Create a TimelineEvent from diagnosis data.

        Args:
            diagnosis_data: Dictionary containing diagnosis data
            source: Source document name

        Returns:
            TimelineEvent object
        """
        onset_date = diagnosis_data.get('onset_date')
        if isinstance(onset_date, str):
            # If only date, add time
            if len(onset_date) == 10:  # YYYY-MM-DD
                onset_date = onset_date + 'T00:00:00'
            date = datetime.fromisoformat(onset_date)
        else:
            date = onset_date or datetime.now()

        return TimelineEvent(
            date=date,
            event_type=EventType.DIAGNOSIS,
            summary=diagnosis_data.get('name', 'New diagnosis'),
            details=diagnosis_data,
            source_document=source,
            clinical_significance=ClinicalSignificance.HIGH,
            codes={
                'icd10': diagnosis_data.get('icd10_code', ''),
                'snomed': diagnosis_data.get('snomed_code', '')
            }
        )

    def create_event_from_lab_result(
        self,
        result_data: Dict[str, Any],
        source: str = None
    ) -> TimelineEvent:
        """
        Create a TimelineEvent from lab result data.

        Args:
            result_data: Dictionary containing lab result data
            source: Source document name

        Returns:
            TimelineEvent object
        """
        date = result_data.get('date', datetime.now())
        if isinstance(date, str):
            date = datetime.fromisoformat(date.replace('Z', '+00:00'))

        name = result_data.get('name', 'Lab result')
        value = result_data.get('value', '')
        unit = result_data.get('unit', '')

        summary = f"{name}: {value} {unit}".strip()

        return TimelineEvent(
            date=date,
            event_type=EventType.LAB_RESULT,
            summary=summary,
            details=result_data,
            source_document=source,
            clinical_significance=ClinicalSignificance.MEDIUM
        )

    def build_from_fhir_data(self, fhir_data: Dict[str, Any]) -> List[TimelineEvent]:
        """
        Build timeline from FHIR ingested data.

        Args:
            fhir_data: Dictionary from FHIRIngestor.ingest()

        Returns:
            List of TimelineEvent objects
        """
        source = fhir_data.get('source_file', 'FHIR Bundle')

        # Add procedures (already TimelineEvents from ingestor)
        procedures = fhir_data.get('procedures', [])
        for proc in procedures:
            if isinstance(proc, TimelineEvent):
                self.add_event(proc)

        # Add encounters (already TimelineEvents from ingestor)
        encounters = fhir_data.get('encounters', [])
        for enc in encounters:
            if isinstance(enc, TimelineEvent):
                self.add_event(enc)

        # Convert conditions to diagnosis events
        conditions = fhir_data.get('conditions', [])
        for cond in conditions:
            if hasattr(cond, 'onset_date') and cond.onset_date:
                event = self.create_event_from_diagnosis({
                    'name': cond.name,
                    'onset_date': cond.onset_date.isoformat() if cond.onset_date else None,
                    'icd10_code': cond.icd10_code,
                    'snomed_code': cond.snomed_code,
                    'status': cond.status.value
                }, source)
                self.add_event(event)

        # Convert observations to lab result events
        observations = fhir_data.get('observations', [])
        for obs in observations:
            if obs.get('date'):
                event = self.create_event_from_lab_result(obs, source)
                self.add_event(event)

        return self.sort_timeline()

    def build_from_ccda_data(self, ccda_data: Dict[str, Any]) -> List[TimelineEvent]:
        """
        Build timeline from C-CDA ingested data.

        Args:
            ccda_data: Dictionary from CCDAIngestor.ingest()

        Returns:
            List of TimelineEvent objects
        """
        source = ccda_data.get('source_file', 'C-CDA Document')

        # Add problems as diagnosis events
        problems = ccda_data.get('problems', [])
        for problem in problems:
            if problem.get('onset_date'):
                event = self.create_event_from_diagnosis(problem, source)
                self.add_event(event)

        # Add procedures
        procedures = ccda_data.get('procedures', [])
        for proc in procedures:
            if proc.get('date'):
                date = proc['date']
                if isinstance(date, str):
                    date = datetime.fromisoformat(date.replace('Z', '+00:00'))

                event = TimelineEvent(
                    date=date,
                    event_type=EventType.PROCEDURE,
                    summary=proc.get('name', 'Procedure'),
                    details=proc,
                    source_document=source,
                    clinical_significance=ClinicalSignificance.HIGH,
                    codes={'cpt': proc.get('code', '')}
                )
                self.add_event(event)

        # Add results
        results = ccda_data.get('results', [])
        for result in results:
            if result.get('date'):
                event = self.create_event_from_lab_result(result, source)
                self.add_event(event)

        # Add encounters
        encounters = ccda_data.get('encounters', [])
        for enc in encounters:
            if enc.get('date'):
                event = self.create_event_from_encounter(enc, source)
                self.add_event(event)

        return self.sort_timeline()

    def get_timeline(self) -> List[TimelineEvent]:
        """
        Get the current timeline.

        Returns:
            List of TimelineEvent objects
        """
        return self.events

    def clear(self) -> None:
        """Clear all events from the timeline."""
        self.events = []

    def __len__(self) -> int:
        """Get number of events in timeline."""
        return len(self.events)

    def __repr__(self) -> str:
        """String representation of timeline."""
        return f"TimelineBuilder(events={len(self.events)})"
