"""Knowledge base merger with intelligent deduplication."""

from datetime import datetime, date
from typing import List, Set, Tuple
import logging

from dr_nexus.knowledge_base.kb_schema import KnowledgeBase, Metadata
from dr_nexus.models.condition import Condition
from dr_nexus.models.timeline import TimelineEvent
from dr_nexus.models.symptom import Symptom
from dr_nexus.models.action_item import ActionItem, UnresolvedQuestion


logger = logging.getLogger(__name__)


class KBMerger:
    """Merge knowledge bases while preserving historical data."""

    def __init__(self) -> None:
        """Initialize KB merger."""
        self.logger = logging.getLogger(__name__)

    def merge(
        self,
        existing_kb: KnowledgeBase,
        new_data: dict,
        preserve_all_history: bool = True
    ) -> KnowledgeBase:
        """
        Merge new data into existing knowledge base.

        Args:
            existing_kb: Existing KnowledgeBase object
            new_data: Dictionary containing new data to merge
            preserve_all_history: If True, never delete historical data

        Returns:
            Merged KnowledgeBase object
        """
        start_time = datetime.now()

        self.logger.info("Starting knowledge base merge")

        # Create a copy of existing KB
        merged_kb = existing_kb.model_copy(deep=True)

        # Update metadata
        merged_kb.metadata = self._create_updated_metadata(
            existing_kb.metadata,
            new_data.get('source_files_count', 0)
        )

        # Update patient profile if we have better data
        if 'patient' in new_data and new_data['patient']:
            merged_kb.patient_profile.demographics = self._merge_patient_demographics(
                existing_kb.patient_profile.demographics,
                new_data['patient']
            )

        # Merge conditions
        if 'conditions' in new_data:
            merged_kb.patient_profile.chronic_conditions = self._merge_conditions(
                existing_kb.patient_profile.chronic_conditions,
                new_data['conditions']
            )

        # Merge devices
        if 'devices' in new_data:
            merged_kb.patient_profile.implanted_devices = self._merge_devices(
                existing_kb.patient_profile.implanted_devices,
                new_data['devices']
            )

        # Merge timeline
        if 'timeline_events' in new_data:
            merged_kb.timeline = self._merge_timeline(
                existing_kb.timeline,
                new_data['timeline_events']
            )

        # Merge symptoms
        if 'symptoms' in new_data:
            merged_kb.symptom_registry = self._merge_symptoms(
                existing_kb.symptom_registry,
                new_data['symptoms']
            )

        # Merge action items
        if 'action_items' in new_data:
            merged_kb.action_items = self._merge_action_items(
                existing_kb.action_items,
                new_data['action_items']
            )

        # Merge unresolved questions
        if 'unresolved_questions' in new_data:
            merged_kb.unresolved_questions = self._merge_unresolved_questions(
                existing_kb.unresolved_questions,
                new_data['unresolved_questions']
            )

        # Sort timeline chronologically
        merged_kb.sort_timeline()

        # Update processing duration
        duration = (datetime.now() - start_time).total_seconds()
        merged_kb.metadata.processing_duration_seconds = duration

        self.logger.info(f"Merge completed in {duration:.2f} seconds")

        return merged_kb

    def _create_updated_metadata(self, old_metadata: Metadata, new_files: int) -> Metadata:
        """Create updated metadata for merged KB."""
        return Metadata(
            version=self._increment_version(old_metadata.version),
            generated_at=datetime.now(),
            source_files_count=old_metadata.source_files_count + new_files,
            processing_duration_seconds=0.0,  # Will be updated after merge
            dr_nexus_version=old_metadata.dr_nexus_version,
            previous_version=old_metadata.version,
            changelog=f"Merged {new_files} new files"
        )

    def _increment_version(self, version: str) -> str:
        """Increment semantic version."""
        try:
            major, minor, patch = map(int, version.split('.'))
            return f"{major}.{minor}.{patch + 1}"
        except ValueError:
            return "1.0.0"

    def _merge_patient_demographics(self, existing, new_patient):
        """Merge patient demographics, preferring more complete data."""
        # If existing has unknown values, update from new data
        if existing.patient_id == "unknown" and hasattr(new_patient, 'patient_id'):
            return new_patient

        # Otherwise keep existing (first seen data is authoritative)
        return existing

    def _merge_conditions(
        self,
        existing: List[Condition],
        new_conditions: List[Condition]
    ) -> List[Condition]:
        """
        Merge condition lists, deduplicating by code and onset date.

        Args:
            existing: Existing conditions
            new_conditions: New conditions to merge

        Returns:
            Merged list of conditions
        """
        merged = list(existing)  # Start with existing
        seen_keys: Set[Tuple] = set()

        # Build set of existing condition keys
        for cond in existing:
            key = self._get_condition_key(cond)
            seen_keys.add(key)

        # Add new conditions if not duplicates
        for cond in new_conditions:
            key = self._get_condition_key(cond)
            if key not in seen_keys:
                merged.append(cond)
                seen_keys.add(key)
                self.logger.debug(f"Added new condition: {cond.name}")
            else:
                self.logger.debug(f"Duplicate condition skipped: {cond.name}")

        return merged

    def _get_condition_key(self, condition: Condition) -> Tuple:
        """
        Generate unique key for condition deduplication.

        Uses ICD-10 code or SNOMED code + onset date (rounded to day).
        """
        code = condition.icd10_code or condition.snomed_code or condition.name.lower()
        onset = condition.onset_date if condition.onset_date else date(1900, 1, 1)
        return (code, onset)

    def _merge_devices(self, existing, new_devices):
        """Merge implanted devices, deduplicating by UDI or name."""
        merged = list(existing)
        seen_udis = {d.udi for d in existing if d.udi}
        seen_names = {d.device_name.lower() for d in existing}

        for device in new_devices:
            if device.udi and device.udi in seen_udis:
                continue
            if device.device_name.lower() in seen_names:
                continue

            merged.append(device)
            if device.udi:
                seen_udis.add(device.udi)
            seen_names.add(device.device_name.lower())

        return merged

    def _merge_timeline(
        self,
        existing: List[TimelineEvent],
        new_events: List[TimelineEvent]
    ) -> List[TimelineEvent]:
        """
        Merge timeline events, deduplicating by date+type+summary.

        Args:
            existing: Existing timeline events
            new_events: New events to merge

        Returns:
            Merged and sorted list of events
        """
        merged = list(existing)
        seen_keys: Set[Tuple] = set()

        # Build set of existing event keys
        for event in existing:
            key = self._get_timeline_event_key(event)
            seen_keys.add(key)

        # Add new events if not duplicates
        for event in new_events:
            key = self._get_timeline_event_key(event)
            if key not in seen_keys:
                merged.append(event)
                seen_keys.add(key)
                self.logger.debug(f"Added new event: {event.summary}")
            else:
                self.logger.debug(f"Duplicate event skipped: {event.summary}")

        # Sort chronologically
        merged.sort(key=lambda e: e.date)

        return merged

    def _get_timeline_event_key(self, event: TimelineEvent) -> Tuple:
        """
        Generate unique key for timeline event deduplication.

        Uses date (rounded to hour), type, and first 100 chars of summary.
        """
        date_key = event.date.replace(minute=0, second=0, microsecond=0)
        summary_key = event.summary[:100].lower().strip()
        return (date_key, event.event_type, summary_key)

    def _merge_symptoms(
        self,
        existing: List[Symptom],
        new_symptoms: List[Symptom]
    ) -> List[Symptom]:
        """
        Merge symptoms, updating status if symptom already exists.

        Args:
            existing: Existing symptoms
            new_symptoms: New symptoms to merge

        Returns:
            Merged list of symptoms
        """
        # Create a map of existing symptoms by name
        symptom_map = {s.symptom.lower(): s for s in existing}

        for new_symptom in new_symptoms:
            key = new_symptom.symptom.lower()

            if key in symptom_map:
                # Update existing symptom
                existing_symptom = symptom_map[key]

                # Update last reported date
                if new_symptom.last_reported > existing_symptom.last_reported:
                    existing_symptom.last_reported = new_symptom.last_reported

                # Update status if changed
                if new_symptom.status != existing_symptom.status:
                    existing_symptom.status = new_symptom.status
                    self.logger.info(
                        f"Symptom status updated: {new_symptom.symptom} -> {new_symptom.status}"
                    )

                # Merge severity history
                for hist in new_symptom.severity_history:
                    if hist not in existing_symptom.severity_history:
                        existing_symptom.severity_history.append(hist)

            else:
                # Add new symptom
                symptom_map[key] = new_symptom
                self.logger.debug(f"Added new symptom: {new_symptom.symptom}")

        return list(symptom_map.values())

    def _merge_action_items(
        self,
        existing: List[ActionItem],
        new_items: List[ActionItem]
    ) -> List[ActionItem]:
        """
        Merge action items, deduplicating by item text.

        Args:
            existing: Existing action items
            new_items: New action items to merge

        Returns:
            Merged list of action items
        """
        merged = list(existing)
        seen_items = {item.item.lower() for item in existing}

        for item in new_items:
            key = item.item.lower()
            if key not in seen_items:
                merged.append(item)
                seen_items.add(key)
                self.logger.debug(f"Added new action item: {item.item}")

        return merged

    def _merge_unresolved_questions(
        self,
        existing: List[UnresolvedQuestion],
        new_questions: List[UnresolvedQuestion]
    ) -> List[UnresolvedQuestion]:
        """
        Merge unresolved questions, deduplicating by question text.

        Args:
            existing: Existing questions
            new_questions: New questions to merge

        Returns:
            Merged list of questions
        """
        merged = list(existing)
        seen_questions = {q.question.lower() for q in existing}

        for question in new_questions:
            key = question.question.lower()
            if key not in seen_questions:
                merged.append(question)
                seen_questions.add(key)
                self.logger.debug(f"Added new question: {question.question}")

        return merged
