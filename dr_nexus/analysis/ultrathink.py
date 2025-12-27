"""Ultrathink analyzer using Claude API for deep medical analysis."""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, date

import anthropic

from dr_nexus.knowledge_base.kb_schema import KnowledgeBase
from dr_nexus.models.action_item import ActionItem, ActionPriority, ActionCategory, ActionStatus
from dr_nexus.models.action_item import UnresolvedQuestion
from dr_nexus.models.symptom import Symptom, SymptomStatus


logger = logging.getLogger(__name__)


class UltrathinkAnalyzer:
    """Deep medical analysis using Claude's extended thinking capabilities."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-5-20250929") -> None:
        """
        Initialize Ultrathink analyzer.

        Args:
            api_key: Anthropic API key
            model: Claude model to use
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model
        self.logger = logging.getLogger(__name__)

    def analyze_knowledge_base(
        self,
        kb: KnowledgeBase,
        new_documents: List[str] = None
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of knowledge base.

        Args:
            kb: Knowledge base to analyze
            new_documents: List of new document names processed

        Returns:
            Dictionary with analysis results including:
            - patterns: Medical patterns identified
            - insights: Clinical insights
            - action_items: Extracted action items
            - unresolved_questions: Questions needing clarification
        """
        self.logger.info("Starting Ultrathink analysis")

        # Prepare context for Claude
        context = self._prepare_kb_context(kb, new_documents)

        # Run analysis in stages
        results = {
            'patterns': self._analyze_patterns(context),
            'symptom_progression': self._analyze_symptoms(kb, context),
            'action_items': self._extract_action_items(context),
            'unresolved_questions': self._identify_questions(context),
            'clinical_insights': self._generate_insights(context)
        }

        self.logger.info("Ultrathink analysis complete")
        return results

    def _prepare_kb_context(
        self,
        kb: KnowledgeBase,
        new_documents: List[str] = None
    ) -> str:
        """
        Prepare knowledge base context for Claude analysis.

        Args:
            kb: Knowledge base
            new_documents: New documents to highlight

        Returns:
            Formatted context string
        """
        # Get recent timeline events (last 50)
        recent_events = sorted(kb.timeline, key=lambda e: e.date, reverse=True)[:50]

        context_parts = [
            "# PATIENT MEDICAL KNOWLEDGE BASE",
            "",
            "## Patient Profile",
            f"- Name: {kb.patient_profile.demographics.name}",
            f"- Age: {kb.patient_profile.demographics.age}",
            f"- Gender: {kb.patient_profile.demographics.gender.value}",
            "",
            "## Active Conditions",
        ]

        for cond in kb.get_active_conditions():
            context_parts.append(
                f"- {cond.name} (ICD-10: {cond.icd10_code or 'N/A'}) "
                f"- Onset: {cond.onset_date or 'Unknown'}"
            )

        context_parts.extend([
            "",
            "## Active Symptoms",
        ])

        for symptom in kb.get_active_symptoms():
            context_parts.append(
                f"- {symptom.symptom} (Status: {symptom.status.value}) "
                f"- First reported: {symptom.first_reported}, Last: {symptom.last_reported}"
            )

        context_parts.extend([
            "",
            "## Recent Timeline (Last 50 Events)",
        ])

        for event in recent_events:
            context_parts.append(
                f"- {event.date.strftime('%Y-%m-%d')}: [{event.event_type.value}] {event.summary}"
            )

        if kb.action_items:
            context_parts.extend([
                "",
                "## Existing Action Items",
            ])
            for item in kb.action_items:
                context_parts.append(f"- [{item.status.value}] {item.item}")

        if new_documents:
            context_parts.extend([
                "",
                "## Newly Processed Documents",
                *[f"- {doc}" for doc in new_documents]
            ])

        return "\n".join(context_parts)

    def _analyze_patterns(self, context: str) -> List[str]:
        """
        Identify medical patterns across the timeline.

        Args:
            context: Formatted KB context

        Returns:
            List of identified patterns
        """
        self.logger.info("Analyzing medical patterns")

        prompt = f"""You are a medical data analyst specializing in longitudinal patient records.

Review this patient's medical knowledge base and identify significant patterns:

{context}

Identify:
1. Disease progression patterns
2. Treatment efficacy trends
3. Symptom correlations
4. Temporal patterns (seasonal, time-based)
5. Concerning trends requiring attention

Provide a JSON list of patterns found:
```json
[
  {{
    "pattern": "Pattern description",
    "evidence": "Supporting evidence from timeline",
    "significance": "high|medium|low"
  }}
]
```"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            # Extract JSON from response
            content = response.content[0].text
            patterns = self._extract_json_from_response(content, [])

            self.logger.info(f"Identified {len(patterns)} patterns")
            return patterns

        except Exception as e:
            self.logger.error(f"Pattern analysis failed: {e}")
            return []

    def _analyze_symptoms(self, kb: KnowledgeBase, context: str) -> Dict[str, Any]:
        """
        Analyze symptom progression and status.

        Args:
            kb: Knowledge base
            context: Formatted context

        Returns:
            Symptom analysis results
        """
        self.logger.info("Analyzing symptom progression")

        if not kb.symptom_registry:
            return {"symptoms_updated": 0, "new_symptoms": []}

        symptom_summary = "\n".join([
            f"- {s.symptom}: {s.status.value} (First: {s.first_reported}, Last: {s.last_reported})"
            for s in kb.symptom_registry
        ])

        prompt = f"""Analyze symptom progression for this patient:

{context}

Current Symptoms:
{symptom_summary}

Based on the timeline, determine:
1. Which symptoms should be marked as "resolved" (no mention in recent events)
2. Which symptoms are "worsening" vs "improving"
3. Any new symptoms that should be tracked

Respond with JSON:
```json
{{
  "symptom_updates": [
    {{
      "symptom": "symptom name",
      "new_status": "active|resolved|improving|worsening",
      "reason": "explanation"
    }}
  ],
  "new_symptoms": [
    {{
      "symptom": "symptom description",
      "first_reported": "YYYY-MM-DD",
      "status": "active"
    }}
  ]
}}
```"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text
            result = self._extract_json_from_response(content, {})

            self.logger.info(f"Symptom analysis complete: {len(result.get('symptom_updates', []))} updates")
            return result

        except Exception as e:
            self.logger.error(f"Symptom analysis failed: {e}")
            return {"symptom_updates": [], "new_symptoms": []}

    def _extract_action_items(self, context: str) -> List[ActionItem]:
        """
        Extract actionable items from medical records.

        Args:
            context: Formatted KB context

        Returns:
            List of ActionItem objects
        """
        self.logger.info("Extracting action items")

        prompt = f"""Review this patient's medical records and extract ALL actionable items:

{context}

Look for:
1. Recommended follow-up appointments
2. Tests/imaging ordered but not completed
3. Medication reviews needed
4. Specialist referrals mentioned
5. Therapy or rehabilitation recommendations
6. Lifestyle modifications suggested

For each action item, provide:
```json
[
  {{
    "item": "Detailed description of action",
    "priority": "urgent|high|medium|low",
    "category": "follow_up|testing|medication_review|specialist_referral|imaging|therapy|lifestyle|other",
    "due_date": "YYYY-MM-DD or null",
    "source": "Source document/note",
    "notes": "Additional context"
  }}
]
```"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text
            action_data = self._extract_json_from_response(content, [])

            # Convert to ActionItem objects
            action_items = []
            for data in action_data:
                try:
                    # Parse due date
                    due_date = None
                    if data.get('due_date'):
                        due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()

                    action_items.append(ActionItem(
                        item=data['item'],
                        priority=ActionPriority(data['priority']),
                        category=ActionCategory(data['category']),
                        due_date=due_date,
                        source=data.get('source', 'Unknown'),
                        status=ActionStatus.PENDING,
                        notes=data.get('notes')
                    ))
                except (ValueError, KeyError) as e:
                    self.logger.warning(f"Failed to parse action item: {e}")
                    continue

            self.logger.info(f"Extracted {len(action_items)} action items")
            return action_items

        except Exception as e:
            self.logger.error(f"Action item extraction failed: {e}")
            return []

    def _identify_questions(self, context: str) -> List[UnresolvedQuestion]:
        """
        Identify unresolved questions and conflicts.

        Args:
            context: Formatted KB context

        Returns:
            List of UnresolvedQuestion objects
        """
        self.logger.info("Identifying unresolved questions")

        prompt = f"""Review this patient's medical records for inconsistencies and gaps:

{context}

Identify:
1. Conflicting information between documents
2. Missing critical information
3. Unclear diagnoses or ambiguous findings
4. Treatment outcomes that are unclear
5. Timeline gaps that need clarification

For each issue:
```json
[
  {{
    "question": "What is unclear or conflicting?",
    "context": "Detailed explanation of the issue",
    "priority": "urgent|high|medium|low",
    "requires_clarification_from": "provider|patient|medical_records"
  }}
]
```"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text
            question_data = self._extract_json_from_response(content, [])

            # Convert to UnresolvedQuestion objects
            questions = []
            for data in question_data:
                try:
                    questions.append(UnresolvedQuestion(
                        question=data['question'],
                        context=data['context'],
                        identified_date=date.today(),
                        requires_clarification_from=data.get('requires_clarification_from'),
                        priority=ActionPriority(data.get('priority', 'medium'))
                    ))
                except (ValueError, KeyError) as e:
                    self.logger.warning(f"Failed to parse question: {e}")
                    continue

            self.logger.info(f"Identified {len(questions)} unresolved questions")
            return questions

        except Exception as e:
            self.logger.error(f"Question identification failed: {e}")
            return []

    def _generate_insights(self, context: str) -> List[str]:
        """
        Generate clinical insights from the knowledge base.

        Args:
            context: Formatted KB context

        Returns:
            List of clinical insights
        """
        self.logger.info("Generating clinical insights")

        prompt = f"""As a medical AI, provide 5-10 key clinical insights about this patient:

{context}

Focus on:
1. Overall health trajectory
2. Risk factors
3. Treatment efficacy
4. Areas needing attention
5. Positive developments

Provide insights as a JSON list:
```json
[
  {{
    "insight": "Insight description",
    "evidence": "Supporting evidence",
    "clinical_relevance": "Why this matters"
  }}
]
```"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text
            insights = self._extract_json_from_response(content, [])

            self.logger.info(f"Generated {len(insights)} insights")
            return insights

        except Exception as e:
            self.logger.error(f"Insight generation failed: {e}")
            return []

    def _extract_json_from_response(self, text: str, default: Any) -> Any:
        """
        Extract JSON from Claude response.

        Args:
            text: Response text
            default: Default value if extraction fails

        Returns:
            Parsed JSON or default
        """
        try:
            # Look for JSON code block
            if "```json" in text:
                start = text.index("```json") + 7
                end = text.index("```", start)
                json_str = text[start:end].strip()
            elif "```" in text:
                start = text.index("```") + 3
                end = text.index("```", start)
                json_str = text[start:end].strip()
            else:
                # Try to find JSON array or object
                json_str = text.strip()

            return json.loads(json_str)

        except (json.JSONDecodeError, ValueError) as e:
            self.logger.warning(f"Failed to extract JSON: {e}")
            return default
