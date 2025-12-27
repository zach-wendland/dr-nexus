"""FHIR Bundle ingestor."""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from dr_nexus.ingestors.base import BaseIngestor
from dr_nexus.models.patient import PatientDemographics, ContactInfo, Gender
from dr_nexus.models.condition import Condition, ConditionStatus, ImplantedDevice
from dr_nexus.models.timeline import TimelineEvent, EventType, ClinicalSignificance
from dr_nexus.models.document import DocumentType


class FHIRIngestor(BaseIngestor):
    """Ingest FHIR R4 Bundle documents."""

    def can_ingest(self, filepath: Path) -> bool:
        """Check if file is a FHIR Bundle JSON."""
        if filepath.suffix.lower() != '.json':
            return False

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('resourceType') == 'Bundle'
        except (json.JSONDecodeError, UnicodeDecodeError):
            return False

    def ingest(self, filepath: Path) -> Dict[str, Any]:
        """
        Ingest FHIR Bundle and extract all resources.

        Args:
            filepath: Path to FHIR Bundle JSON

        Returns:
            Dictionary with extracted data
        """
        self.validate_file_exists(filepath)
        self.validate_file_readable(filepath)

        with open(filepath, 'r', encoding='utf-8') as f:
            bundle = json.load(f)

        if bundle.get('resourceType') != 'Bundle':
            raise ValueError(f"Not a FHIR Bundle: {filepath}")

        self.logger.info(f"Processing FHIR Bundle: {filepath.name}")

        # Extract all resources
        entries = bundle.get('entry', [])
        resources_by_type: Dict[str, List[Dict]] = {}

        for entry in entries:
            resource = entry.get('resource', {})
            resource_type = resource.get('resourceType')
            if resource_type:
                if resource_type not in resources_by_type:
                    resources_by_type[resource_type] = []
                resources_by_type[resource_type].append(resource)

        self.logger.info(f"Found {len(entries)} resources in bundle")
        for rtype, resources in resources_by_type.items():
            self.logger.info(f"  {rtype}: {len(resources)}")

        # Extract structured data
        result = {
            'source_file': str(filepath),
            'patient': self._extract_patient(resources_by_type.get('Patient', [])),
            'conditions': self._extract_conditions(resources_by_type.get('Condition', [])),
            'devices': self._extract_devices(resources_by_type.get('Device', [])),
            'procedures': self._extract_procedures(resources_by_type.get('Procedure', [])),
            'medications': self._extract_medications(resources_by_type.get('MedicationRequest', [])),
            'observations': self._extract_observations(resources_by_type.get('Observation', [])),
            'encounters': self._extract_encounters(resources_by_type.get('Encounter', [])),
            'document_references': resources_by_type.get('DocumentReference', []),
            'organizations': resources_by_type.get('Organization', []),
            'practitioners': resources_by_type.get('Practitioner', []),
            'care_teams': resources_by_type.get('CareTeam', []),
        }

        return result

    def _extract_patient(self, patients: List[Dict]) -> Optional[PatientDemographics]:
        """Extract patient demographics from Patient resource."""
        if not patients:
            return None

        patient = patients[0]  # Should only be one patient

        # Extract name
        names = patient.get('name', [])
        full_name = "Unknown"
        if names:
            name = names[0]
            given = name.get('given', [])
            family = name.get('family', '')
            full_name = f"{' '.join(given)} {family}".strip()

        # Extract birth date
        birth_date_str = patient.get('birthDate')
        birth_date = None
        if birth_date_str:
            try:
                birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
            except ValueError:
                self.logger.warning(f"Invalid birth date format: {birth_date_str}")

        # Extract gender
        gender_str = patient.get('gender', 'unknown')
        try:
            gender = Gender(gender_str.lower())
        except ValueError:
            gender = Gender.UNKNOWN

        # Extract contact info
        contact = ContactInfo()
        telecoms = patient.get('telecom', [])
        for telecom in telecoms:
            system = telecom.get('system')
            value = telecom.get('value')
            if system == 'phone':
                contact.phone = value
            elif system == 'email':
                contact.email = value

        # Extract address
        addresses = patient.get('address', [])
        if addresses:
            addr = addresses[0]
            lines = addr.get('line', [])
            contact.address_line1 = lines[0] if len(lines) > 0 else None
            contact.address_line2 = lines[1] if len(lines) > 1 else None
            contact.city = addr.get('city')
            contact.state = addr.get('state')
            contact.zip_code = addr.get('postalCode')
            contact.country = addr.get('country', 'USA')

        # Extract identifiers
        patient_id = patient.get('id', 'unknown')
        mrn = None
        identifiers = patient.get('identifier', [])
        for identifier in identifiers:
            if identifier.get('system', '').endswith('medical-record-number'):
                mrn = identifier.get('value')
                break

        return PatientDemographics(
            patient_id=patient_id,
            name=full_name,
            date_of_birth=birth_date,
            gender=gender,
            contact=contact,
            mrn=mrn
        )

    def _extract_conditions(self, conditions: List[Dict]) -> List[Condition]:
        """Extract conditions/diagnoses from Condition resources."""
        result = []

        for cond in conditions:
            # Extract condition name
            coding = cond.get('code', {}).get('coding', [])
            name = cond.get('code', {}).get('text', 'Unknown condition')

            # Extract codes
            icd10 = None
            snomed = None
            for code in coding:
                system = code.get('system', '')
                if 'icd-10' in system.lower():
                    icd10 = code.get('code')
                elif 'snomed' in system.lower():
                    snomed = code.get('code')

            # Extract status
            clinical_status = cond.get('clinicalStatus', {}).get('coding', [{}])[0].get('code')
            status = ConditionStatus.ACTIVE
            if clinical_status == 'resolved':
                status = ConditionStatus.RESOLVED
            elif clinical_status == 'inactive':
                status = ConditionStatus.RESOLVED

            # Extract dates
            onset_date = None
            onset_str = cond.get('onsetDateTime')
            if onset_str:
                try:
                    onset_date = datetime.fromisoformat(onset_str.replace('Z', '+00:00')).date()
                except (ValueError, AttributeError):
                    pass

            result.append(Condition(
                name=name,
                icd10_code=icd10,
                snomed_code=snomed,
                status=status,
                onset_date=onset_date,
                clinical_status=clinical_status,
                verification_status=cond.get('verificationStatus', {}).get('coding', [{}])[0].get('code')
            ))

        return result

    def _extract_devices(self, devices: List[Dict]) -> List[ImplantedDevice]:
        """Extract implanted devices from Device resources."""
        result = []

        for device in devices:
            # Extract device info
            device_name = device.get('deviceName', [{}])[0].get('name', 'Unknown device')
            device_type = device.get('type', {}).get('text', 'Unknown type')

            # Extract UDI
            udi_carrier = device.get('udiCarrier', [{}])
            udi = udi_carrier[0].get('deviceIdentifier') if udi_carrier else None

            # Extract manufacturer
            manufacturer = device.get('manufacturer')

            # Extract lot number
            lot_number = device.get('lotNumber')

            result.append(ImplantedDevice(
                device_type=device_type,
                device_name=device_name,
                udi=udi,
                manufacturer=manufacturer,
                lot_number=lot_number,
                status="active"
            ))

        return result

    def _extract_procedures(self, procedures: List[Dict]) -> List[TimelineEvent]:
        """Extract procedures as timeline events."""
        events = []

        for proc in procedures:
            # Extract procedure name
            name = proc.get('code', {}).get('text', 'Unknown procedure')

            # Extract date
            performed = proc.get('performedDateTime') or proc.get('performedPeriod', {}).get('start')
            event_date = datetime.now()
            if performed:
                try:
                    event_date = datetime.fromisoformat(performed.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    pass

            # Extract codes
            codes = {}
            for coding in proc.get('code', {}).get('coding', []):
                system = coding.get('system', '')
                if 'cpt' in system.lower():
                    codes['cpt'] = coding.get('code')
                elif 'snomed' in system.lower():
                    codes['snomed'] = coding.get('code')

            events.append(TimelineEvent(
                date=event_date,
                event_type=EventType.PROCEDURE,
                summary=name,
                details={'procedure_resource': proc},
                clinical_significance=ClinicalSignificance.HIGH,
                codes=codes
            ))

        return events

    def _extract_medications(self, medications: List[Dict]) -> List[Dict]:
        """Extract medication requests."""
        result = []

        for med in medications:
            medication_name = med.get('medicationCodeableConcept', {}).get('text', 'Unknown medication')

            # Extract dosage
            dosage_instruction = med.get('dosageInstruction', [{}])[0]
            dosage_text = dosage_instruction.get('text', '')

            # Extract dates
            authored_on = med.get('authoredOn')
            authored_date = None
            if authored_on:
                try:
                    authored_date = datetime.fromisoformat(authored_on.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    pass

            result.append({
                'medication': medication_name,
                'dosage': dosage_text,
                'status': med.get('status'),
                'intent': med.get('intent'),
                'authored_on': authored_date,
                'raw': med
            })

        return result

    def _extract_observations(self, observations: List[Dict]) -> List[Dict]:
        """Extract observations (lab results, vitals, etc.)."""
        result = []

        for obs in observations:
            # Extract observation name
            name = obs.get('code', {}).get('text', 'Unknown observation')

            # Extract value
            value_quantity = obs.get('valueQuantity', {})
            value = value_quantity.get('value')
            unit = value_quantity.get('unit')

            # Extract date
            effective = obs.get('effectiveDateTime')
            obs_date = None
            if effective:
                try:
                    obs_date = datetime.fromisoformat(effective.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    pass

            result.append({
                'name': name,
                'value': value,
                'unit': unit,
                'date': obs_date,
                'status': obs.get('status'),
                'category': obs.get('category', [{}])[0].get('coding', [{}])[0].get('code'),
                'raw': obs
            })

        return result

    def _extract_encounters(self, encounters: List[Dict]) -> List[TimelineEvent]:
        """Extract encounters as timeline events."""
        events = []

        for enc in encounters:
            # Extract encounter type
            enc_type = enc.get('type', [{}])[0].get('text', 'Unknown encounter')

            # Extract period
            period = enc.get('period', {})
            start_str = period.get('start')
            event_date = datetime.now()
            if start_str:
                try:
                    event_date = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    pass

            events.append(TimelineEvent(
                date=event_date,
                event_type=EventType.ENCOUNTER,
                summary=enc_type,
                details={'encounter_resource': enc},
                clinical_significance=ClinicalSignificance.MEDIUM
            ))

        return events
