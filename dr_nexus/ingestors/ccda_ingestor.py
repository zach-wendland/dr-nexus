"""HL7 C-CDA XML document ingestor."""

from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import xml.etree.ElementTree as ET

from dr_nexus.ingestors.base import BaseIngestor
from dr_nexus.models.timeline import TimelineEvent, EventType, ClinicalSignificance


class CCDAIngestor(BaseIngestor):
    """Ingest HL7 Clinical Document Architecture (C-CDA) XML documents."""

    # HL7 v3 namespace
    NS = {
        'hl7': 'urn:hl7-org:v3',
        'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    }

    def can_ingest(self, filepath: Path) -> bool:
        """Check if file is a C-CDA XML document."""
        if filepath.suffix.lower() != '.xml':
            return False

        try:
            tree = ET.parse(filepath)
            root = tree.getroot()
            # Check for C-CDA namespace and ClinicalDocument root
            return (
                root.tag.endswith('ClinicalDocument') or
                'urn:hl7-org:v3' in root.tag
            )
        except ET.ParseError:
            return False

    def ingest(self, filepath: Path) -> Dict[str, Any]:
        """
        Ingest C-CDA XML document and extract structured data.

        Args:
            filepath: Path to C-CDA XML file

        Returns:
            Dictionary with extracted data
        """
        self.validate_file_exists(filepath)
        self.validate_file_readable(filepath)

        tree = ET.parse(filepath)
        root = tree.getroot()

        self.logger.info(f"Processing C-CDA document: {filepath.name}")

        # Extract document metadata
        metadata = self._extract_metadata(root)

        # Extract patient information
        patient = self._extract_patient_from_record_target(root)

        # Extract sections
        sections = self._extract_sections(root)

        result = {
            'source_file': str(filepath),
            'document_type': 'C-CDA',
            'metadata': metadata,
            'patient': patient,
            'problems': self._extract_problems(sections.get('problems', [])),
            'medications': self._extract_medications_from_section(sections.get('medications', [])),
            'allergies': self._extract_allergies(sections.get('allergies', [])),
            'procedures': self._extract_procedures_from_section(sections.get('procedures', [])),
            'results': self._extract_results(sections.get('results', [])),
            'vitals': self._extract_vitals(sections.get('vitals', [])),
            'encounters': self._extract_encounters_from_section(sections.get('encounters', [])),
            'immunizations': self._extract_immunizations(sections.get('immunizations', [])),
            'sections': sections
        }

        return result

    def _extract_metadata(self, root: ET.Element) -> Dict[str, Any]:
        """Extract document metadata."""
        metadata = {}

        # Document ID
        id_elem = root.find('.//hl7:id', self.NS)
        if id_elem is not None:
            metadata['document_id'] = id_elem.get('root', '') + '.' + id_elem.get('extension', '')

        # Document title
        title_elem = root.find('.//hl7:title', self.NS)
        if title_elem is not None:
            metadata['title'] = title_elem.text

        # Effective time
        effective_time = root.find('.//hl7:effectiveTime', self.NS)
        if effective_time is not None:
            time_value = effective_time.get('value')
            if time_value:
                metadata['effective_time'] = self._parse_hl7_datetime(time_value)

        # Author
        author_elem = root.find('.//hl7:author/hl7:assignedAuthor', self.NS)
        if author_elem is not None:
            author_name_elem = author_elem.find('.//hl7:name', self.NS)
            if author_name_elem is not None:
                metadata['author'] = self._extract_name(author_name_elem)

        # Custodian (organization)
        custodian_elem = root.find('.//hl7:custodian/hl7:assignedCustodian/hl7:representedCustodianOrganization', self.NS)
        if custodian_elem is not None:
            org_name = custodian_elem.find('.//hl7:name', self.NS)
            if org_name is not None:
                metadata['organization'] = org_name.text

        return metadata

    def _extract_patient_from_record_target(self, root: ET.Element) -> Optional[Dict]:
        """Extract patient information from recordTarget."""
        record_target = root.find('.//hl7:recordTarget/hl7:patientRole', self.NS)
        if record_target is None:
            return None

        patient_data = {}

        # Patient ID
        id_elem = record_target.find('.//hl7:id', self.NS)
        if id_elem is not None:
            patient_data['id'] = id_elem.get('extension', '')

        # Patient name
        patient_elem = record_target.find('.//hl7:patient', self.NS)
        if patient_elem is not None:
            name_elem = patient_elem.find('.//hl7:name', self.NS)
            if name_elem is not None:
                patient_data['name'] = self._extract_name(name_elem)

            # Birth time
            birth_elem = patient_elem.find('.//hl7:birthTime', self.NS)
            if birth_elem is not None:
                birth_value = birth_elem.get('value')
                if birth_value:
                    patient_data['birth_date'] = self._parse_hl7_date(birth_value)

            # Gender
            gender_elem = patient_elem.find('.//hl7:administrativeGenderCode', self.NS)
            if gender_elem is not None:
                patient_data['gender'] = gender_elem.get('code')

        # Address
        addr_elem = record_target.find('.//hl7:addr', self.NS)
        if addr_elem is not None:
            patient_data['address'] = self._extract_address(addr_elem)

        # Telecom
        telecom_elems = record_target.findall('.//hl7:telecom', self.NS)
        telecoms = []
        for tel in telecom_elems:
            telecoms.append({
                'system': tel.get('use', ''),
                'value': tel.get('value', '')
            })
        if telecoms:
            patient_data['telecoms'] = telecoms

        return patient_data

    def _extract_sections(self, root: ET.Element) -> Dict[str, List[ET.Element]]:
        """Extract all structured body sections."""
        sections = {}

        component = root.find('.//hl7:component/hl7:structuredBody', self.NS)
        if component is None:
            return sections

        section_mappings = {
            '11450-4': 'problems',  # Problem List
            '10160-0': 'medications',  # Medications
            '48765-2': 'allergies',  # Allergies
            '47519-4': 'procedures',  # Procedures
            '30954-2': 'results',  # Results
            '8716-3': 'vitals',  # Vital Signs
            '46240-8': 'encounters',  # Encounters
            '11369-6': 'immunizations',  # Immunizations
        }

        for section in component.findall('.//hl7:section', self.NS):
            code_elem = section.find('.//hl7:code', self.NS)
            if code_elem is not None:
                code = code_elem.get('code', '')
                if code in section_mappings:
                    section_name = section_mappings[code]
                    if section_name not in sections:
                        sections[section_name] = []
                    sections[section_name].append(section)

        return sections

    def _extract_problems(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract problems/conditions from problem list sections."""
        problems = []

        for section in sections:
            entries = section.findall('.//hl7:entry', self.NS)
            for entry in entries:
                obs = entry.find('.//hl7:observation', self.NS)
                if obs is None:
                    continue

                problem = {}

                # Problem name
                value_elem = obs.find('.//hl7:value', self.NS)
                if value_elem is not None:
                    problem['name'] = value_elem.get('displayName', 'Unknown condition')
                    problem['code'] = value_elem.get('code')
                    problem['code_system'] = value_elem.get('codeSystem')

                # Status
                status_elem = obs.find('.//hl7:statusCode', self.NS)
                if status_elem is not None:
                    problem['status'] = status_elem.get('code')

                # Effective time (onset)
                effective_time = obs.find('.//hl7:effectiveTime/hl7:low', self.NS)
                if effective_time is not None:
                    time_value = effective_time.get('value')
                    if time_value:
                        problem['onset_date'] = self._parse_hl7_date(time_value)

                problems.append(problem)

        return problems

    def _extract_medications_from_section(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract medications from medication sections."""
        medications = []

        for section in sections:
            entries = section.findall('.//hl7:entry', self.NS)
            for entry in entries:
                subst_admin = entry.find('.//hl7:substanceAdministration', self.NS)
                if subst_admin is None:
                    continue

                med = {}

                # Medication name
                material = subst_admin.find('.//hl7:manufacturedMaterial', self.NS)
                if material is not None:
                    code_elem = material.find('.//hl7:code', self.NS)
                    if code_elem is not None:
                        med['name'] = code_elem.get('displayName', 'Unknown medication')
                        med['code'] = code_elem.get('code')

                # Dosage
                dose_elem = subst_admin.find('.//hl7:doseQuantity', self.NS)
                if dose_elem is not None:
                    med['dose'] = dose_elem.get('value')
                    med['dose_unit'] = dose_elem.get('unit')

                # Route
                route_elem = subst_admin.find('.//hl7:routeCode', self.NS)
                if route_elem is not None:
                    med['route'] = route_elem.get('displayName')

                # Frequency
                freq_elem = subst_admin.find('.//hl7:effectiveTime[@operator="A"]', self.NS)
                if freq_elem is not None:
                    period = freq_elem.find('.//hl7:period', self.NS)
                    if period is not None:
                        med['frequency'] = f"Every {period.get('value')} {period.get('unit')}"

                medications.append(med)

        return medications

    def _extract_allergies(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract allergies from allergy sections."""
        allergies = []

        for section in sections:
            entries = section.findall('.//hl7:entry', self.NS)
            for entry in entries:
                obs = entry.find('.//hl7:observation', self.NS)
                if obs is None:
                    continue

                allergy = {}

                # Allergen
                participant = obs.find('.//hl7:participant/hl7:participantRole', self.NS)
                if participant is not None:
                    code_elem = participant.find('.//hl7:code', self.NS)
                    if code_elem is not None:
                        allergy['allergen'] = code_elem.get('displayName', 'Unknown allergen')

                # Reaction
                reaction_obs = obs.find('.//hl7:entryRelationship/hl7:observation', self.NS)
                if reaction_obs is not None:
                    value_elem = reaction_obs.find('.//hl7:value', self.NS)
                    if value_elem is not None:
                        allergy['reaction'] = value_elem.get('displayName')

                allergies.append(allergy)

        return allergies

    def _extract_procedures_from_section(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract procedures from procedure sections."""
        procedures = []

        for section in sections:
            entries = section.findall('.//hl7:entry', self.NS)
            for entry in entries:
                procedure_elem = entry.find('.//hl7:procedure', self.NS)
                if procedure_elem is None:
                    continue

                proc = {}

                # Procedure name
                code_elem = procedure_elem.find('.//hl7:code', self.NS)
                if code_elem is not None:
                    proc['name'] = code_elem.get('displayName', 'Unknown procedure')
                    proc['code'] = code_elem.get('code')
                    proc['code_system'] = code_elem.get('codeSystem')

                # Date
                time_elem = procedure_elem.find('.//hl7:effectiveTime', self.NS)
                if time_elem is not None:
                    time_value = time_elem.get('value')
                    if time_value:
                        proc['date'] = self._parse_hl7_datetime(time_value)

                procedures.append(proc)

        return procedures

    def _extract_results(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract lab results from results sections."""
        results = []

        for section in sections:
            organizers = section.findall('.//hl7:organizer', self.NS)
            for organizer in organizers:
                observations = organizer.findall('.//hl7:observation', self.NS)
                for obs in observations:
                    result = {}

                    # Result name
                    code_elem = obs.find('.//hl7:code', self.NS)
                    if code_elem is not None:
                        result['name'] = code_elem.get('displayName', 'Unknown test')
                        result['code'] = code_elem.get('code')

                    # Value
                    value_elem = obs.find('.//hl7:value', self.NS)
                    if value_elem is not None:
                        result['value'] = value_elem.get('value')
                        result['unit'] = value_elem.get('unit')

                    # Reference range
                    ref_range = obs.find('.//hl7:referenceRange/hl7:observationRange', self.NS)
                    if ref_range is not None:
                        low = ref_range.find('.//hl7:value/hl7:low', self.NS)
                        high = ref_range.find('.//hl7:value/hl7:high', self.NS)
                        if low is not None and high is not None:
                            result['reference_range'] = f"{low.get('value')}-{high.get('value')}"

                    # Date
                    time_elem = obs.find('.//hl7:effectiveTime', self.NS)
                    if time_elem is not None:
                        time_value = time_elem.get('value')
                        if time_value:
                            result['date'] = self._parse_hl7_datetime(time_value)

                    results.append(result)

        return results

    def _extract_vitals(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract vital signs from vitals sections."""
        vitals = []

        for section in sections:
            observations = section.findall('.//hl7:observation', self.NS)
            for obs in observations:
                vital = {}

                # Vital name
                code_elem = obs.find('.//hl7:code', self.NS)
                if code_elem is not None:
                    vital['name'] = code_elem.get('displayName', 'Unknown vital')

                # Value
                value_elem = obs.find('.//hl7:value', self.NS)
                if value_elem is not None:
                    vital['value'] = value_elem.get('value')
                    vital['unit'] = value_elem.get('unit')

                # Date
                time_elem = obs.find('.//hl7:effectiveTime', self.NS)
                if time_elem is not None:
                    time_value = time_elem.get('value')
                    if time_value:
                        vital['date'] = self._parse_hl7_datetime(time_value)

                vitals.append(vital)

        return vitals

    def _extract_encounters_from_section(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract encounters from encounter sections."""
        encounters = []

        for section in sections:
            entries = section.findall('.//hl7:entry', self.NS)
            for entry in entries:
                enc_elem = entry.find('.//hl7:encounter', self.NS)
                if enc_elem is None:
                    continue

                encounter = {}

                # Encounter type
                code_elem = enc_elem.find('.//hl7:code', self.NS)
                if code_elem is not None:
                    encounter['type'] = code_elem.get('displayName', 'Unknown encounter')

                # Date
                time_elem = enc_elem.find('.//hl7:effectiveTime', self.NS)
                if time_elem is not None:
                    low = time_elem.find('.//hl7:low', self.NS)
                    if low is not None:
                        time_value = low.get('value')
                        if time_value:
                            encounter['date'] = self._parse_hl7_datetime(time_value)

                encounters.append(encounter)

        return encounters

    def _extract_immunizations(self, sections: List[ET.Element]) -> List[Dict]:
        """Extract immunizations from immunization sections."""
        immunizations = []

        for section in sections:
            entries = section.findall('.//hl7:entry', self.NS)
            for entry in entries:
                subst_admin = entry.find('.//hl7:substanceAdministration', self.NS)
                if subst_admin is None:
                    continue

                immunization = {}

                # Vaccine name
                material = subst_admin.find('.//hl7:manufacturedMaterial', self.NS)
                if material is not None:
                    code_elem = material.find('.//hl7:code', self.NS)
                    if code_elem is not None:
                        immunization['vaccine'] = code_elem.get('displayName', 'Unknown vaccine')

                # Date
                time_elem = subst_admin.find('.//hl7:effectiveTime', self.NS)
                if time_elem is not None:
                    time_value = time_elem.get('value')
                    if time_value:
                        immunization['date'] = self._parse_hl7_datetime(time_value)

                immunizations.append(immunization)

        return immunizations

    def _extract_name(self, name_elem: ET.Element) -> str:
        """Extract full name from HL7 name element."""
        parts = []
        for given in name_elem.findall('.//hl7:given', self.NS):
            if given.text:
                parts.append(given.text)
        family = name_elem.find('.//hl7:family', self.NS)
        if family is not None and family.text:
            parts.append(family.text)
        return ' '.join(parts) if parts else 'Unknown'

    def _extract_address(self, addr_elem: ET.Element) -> Dict[str, str]:
        """Extract address from HL7 addr element."""
        address = {}
        street_lines = addr_elem.findall('.//hl7:streetAddressLine', self.NS)
        if street_lines:
            address['street'] = ' '.join([s.text for s in street_lines if s.text])

        city = addr_elem.find('.//hl7:city', self.NS)
        if city is not None:
            address['city'] = city.text

        state = addr_elem.find('.//hl7:state', self.NS)
        if state is not None:
            address['state'] = state.text

        postal = addr_elem.find('.//hl7:postalCode', self.NS)
        if postal is not None:
            address['postal_code'] = postal.text

        return address

    def _parse_hl7_datetime(self, hl7_time: str) -> Optional[datetime]:
        """Parse HL7 datetime format (YYYYMMDDHHmmss+/-ZZZZ)."""
        try:
            # Remove timezone for simplicity
            clean_time = hl7_time[:14]  # YYYYMMDDHHmmss
            return datetime.strptime(clean_time, '%Y%m%d%H%M%S')
        except (ValueError, IndexError):
            return None

    def _parse_hl7_date(self, hl7_date: str) -> Optional[str]:
        """Parse HL7 date format (YYYYMMDD) to ISO format."""
        try:
            clean_date = hl7_date[:8]  # YYYYMMDD
            dt = datetime.strptime(clean_date, '%Y%m%d')
            return dt.date().isoformat()
        except (ValueError, IndexError):
            return None
