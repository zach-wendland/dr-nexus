"""Initial knowledge base build script."""

import sys
import argparse
from pathlib import Path
from datetime import datetime
import logging

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dr_nexus.utils.config import get_config
from dr_nexus.utils.logging_config import setup_logging
from dr_nexus.ingestors.fhir_ingestor import FHIRIngestor
from dr_nexus.ingestors.ccda_ingestor import CCDAIngestor
from dr_nexus.extractors.timeline_builder import TimelineBuilder
from dr_nexus.knowledge_base.kb_schema import KnowledgeBase, Metadata, PatientProfile
from dr_nexus.knowledge_base.kb_loader import KBLoader
from dr_nexus.analysis.ultrathink import UltrathinkAnalyzer
from dr_nexus.output.json_generator import JSONGenerator
from dr_nexus.models.patient import PatientDemographics, Gender


logger = logging.getLogger(__name__)


def find_medical_files(data_dir: Path):
    """
    Recursively find all medical files in data directory.

    Args:
        data_dir: Root data directory

    Returns:
        Dictionary of files by type
    """
    files = {
        'fhir': [],
        'ccda': [],
        'ndjson': [],
        'pdf': [],
        'images': []
    }

    # FHIR files
    for fhir_file in data_dir.rglob("*FHIR*.json"):
        if fhir_file.is_file():
            files['fhir'].append(fhir_file)

    # C-CDA XML files
    for xml_file in data_dir.rglob("*.xml"):
        if xml_file.is_file() and xml_file.stat().st_size > 1000:  # Skip small XML
            files['ccda'].append(xml_file)

    # NDJSON files
    for ndjson_file in data_dir.rglob("*.ndjson"):
        if ndjson_file.is_file():
            files['ndjson'].append(ndjson_file)

    # PDF files
    for pdf_file in data_dir.rglob("*.pdf"):
        if pdf_file.is_file():
            files['pdf'].append(pdf_file)

    # Images
    for img_file in data_dir.rglob("*.jpg"):
        if img_file.is_file():
            files['images'].append(img_file)

    return files


def process_fhir_files(fhir_files: list, timeline_builder: TimelineBuilder):
    """Process all FHIR files."""
    ingestor = FHIRIngestor()
    all_data = []

    for fhir_file in fhir_files:
        logger.info(f"Processing FHIR file: {fhir_file.name}")
        try:
            data = ingestor.ingest(fhir_file)
            all_data.append(data)

            # Build timeline from FHIR data
            timeline_builder.build_from_fhir_data(data)

        except Exception as e:
            logger.error(f"Failed to process {fhir_file}: {e}")

    return all_data


def process_ccda_files(ccda_files: list, timeline_builder: TimelineBuilder):
    """Process all C-CDA files."""
    ingestor = CCDAIngestor()
    all_data = []

    for ccda_file in ccda_files:
        logger.info(f"Processing C-CDA file: {ccda_file.name}")
        try:
            if ingestor.can_ingest(ccda_file):
                data = ingestor.ingest(ccda_file)
                all_data.append(data)

                # Build timeline from C-CDA data
                timeline_builder.build_from_ccda_data(data)

        except Exception as e:
            logger.error(f"Failed to process {ccda_file}: {e}")

    return all_data


def build_knowledge_base(fhir_data: list, ccda_data: list, timeline_builder: TimelineBuilder):
    """Build knowledge base from processed data."""
    logger.info("Building knowledge base")

    # Extract patient demographics (prefer FHIR)
    patient_demographics = None
    for data in fhir_data:
        if data.get('patient'):
            patient_demographics = data['patient']
            break

    if not patient_demographics:
        # Fallback to C-CDA
        for data in ccda_data:
            if data.get('patient'):
                # Convert C-CDA patient to demographics
                from datetime import date
                p = data['patient']
                patient_demographics = PatientDemographics(
                    patient_id=p.get('id', 'unknown'),
                    name=p.get('name', 'Unknown'),
                    date_of_birth=datetime.strptime(p['birth_date'], '%Y-%m-%d').date() if p.get('birth_date') else date(1900, 1, 1),
                    gender=Gender(p.get('gender', 'unknown').lower()) if p.get('gender') else Gender.UNKNOWN
                )
                break

    # Collect all conditions
    all_conditions = []
    for data in fhir_data:
        all_conditions.extend(data.get('conditions', []))

    # Collect all devices
    all_devices = []
    for data in fhir_data:
        all_devices.extend(data.get('devices', []))

    # Create KB
    kb = KnowledgeBase(
        metadata=Metadata(
            version="1.0.0",
            generated_at=datetime.now(),
            source_files_count=len(fhir_data) + len(ccda_data),
            processing_duration_seconds=0.0
        ),
        patient_profile=PatientProfile(
            demographics=patient_demographics,
            chronic_conditions=all_conditions,
            implanted_devices=all_devices
        ),
        timeline=timeline_builder.deduplicate_events()
    )

    logger.info(f"Knowledge base created:")
    logger.info(f"  - {len(kb.timeline)} timeline events")
    logger.info(f"  - {len(kb.patient_profile.chronic_conditions)} conditions")
    logger.info(f"  - {len(kb.patient_profile.implanted_devices)} devices")

    return kb


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Build initial Dr. Nexus knowledge base")
    parser.add_argument(
        "--data-dir",
        type=Path,
        help="Root data directory"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/knowledge_base/current.json"),
        help="Output JSON file path"
    )
    parser.add_argument(
        "--enable-ultrathink",
        action="store_true",
        default=True,
        help="Enable Ultrathink analysis"
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level"
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip creating backup"
    )

    args = parser.parse_args()

    # Load configuration
    config = get_config()

    # Override with command line args
    if args.data_dir:
        config.data_dir = args.data_dir

    # Setup logging
    setup_logging(args.log_level, config.logs_dir)

    logger.info("="*60)
    logger.info("Dr. Nexus - Initial Knowledge Base Build")
    logger.info("="*60)

    start_time = datetime.now()

    try:
        # Ensure directories exist
        config.ensure_directories()

        # Find all medical files
        logger.info(f"Scanning for medical files in: {config.data_dir}")
        files = find_medical_files(config.data_dir)

        logger.info(f"Found files:")
        logger.info(f"  - FHIR: {len(files['fhir'])}")
        logger.info(f"  - C-CDA: {len(files['ccda'])}")
        logger.info(f"  - NDJSON: {len(files['ndjson'])}")
        logger.info(f"  - PDF: {len(files['pdf'])}")
        logger.info(f"  - Images: {len(files['images'])}")

        # Initialize timeline builder
        timeline_builder = TimelineBuilder()

        # Process FHIR files
        logger.info("\nProcessing FHIR files...")
        fhir_data = process_fhir_files(files['fhir'], timeline_builder)

        # Process C-CDA files
        logger.info("\nProcessing C-CDA files...")
        ccda_data = process_ccda_files(files['ccda'][:10], timeline_builder)  # Limit to first 10 for speed

        # Build knowledge base
        logger.info("\nBuilding knowledge base...")
        kb = build_knowledge_base(fhir_data, ccda_data, timeline_builder)

        # Run Ultrathink analysis
        if args.enable_ultrathink and config.anthropic_api_key:
            logger.info("\nRunning Ultrathink analysis...")
            try:
                analyzer = UltrathinkAnalyzer(config.anthropic_api_key, config.anthropic_model)
                analysis = analyzer.analyze_knowledge_base(kb)

                # Add action items
                if analysis.get('action_items'):
                    kb.action_items.extend(analysis['action_items'])
                    logger.info(f"  - Added {len(analysis['action_items'])} action items")

                # Add unresolved questions
                if analysis.get('unresolved_questions'):
                    kb.unresolved_questions.extend(analysis['unresolved_questions'])
                    logger.info(f"  - Added {len(analysis['unresolved_questions'])} questions")

            except Exception as e:
                logger.error(f"Ultrathink analysis failed: {e}")
        else:
            logger.info("Skipping Ultrathink analysis (disabled or no API key)")

        # Create backup if existing file exists
        output_path = Path(args.output)
        if output_path.exists() and not args.no_backup:
            logger.info("\nBacking up existing knowledge base...")
            backup_dir = config.knowledge_base_dir / "history"
            existing_kb = KBLoader.load(output_path)
            if existing_kb:
                JSONGenerator.create_backup(existing_kb, backup_dir)

        # Save knowledge base
        logger.info(f"\nSaving knowledge base to: {output_path}")
        JSONGenerator.save(kb, output_path, pretty=True)

        # Calculate duration
        duration = (datetime.now() - start_time).total_seconds()
        kb.metadata.processing_duration_seconds = duration

        # Save again with updated duration
        JSONGenerator.save(kb, output_path, pretty=True)

        logger.info("\n" + "="*60)
        logger.info("Knowledge Base Build Complete!")
        logger.info("="*60)
        logger.info(f"Duration: {duration:.2f} seconds")
        logger.info(f"Timeline events: {len(kb.timeline)}")
        logger.info(f"Conditions: {len(kb.patient_profile.chronic_conditions)}")
        logger.info(f"Action items: {len(kb.action_items)}")
        logger.info(f"Output: {output_path.absolute()}")

        return 0

    except Exception as e:
        logger.exception(f"Build failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
