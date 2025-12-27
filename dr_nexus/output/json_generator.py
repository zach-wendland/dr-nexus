"""Generate JSON output for knowledge base."""

import json
from pathlib import Path
from datetime import datetime
import logging

from dr_nexus.knowledge_base.kb_schema import KnowledgeBase


logger = logging.getLogger(__name__)


class JSONGenerator:
    """Generate and save knowledge base as JSON."""

    @staticmethod
    def save(kb: KnowledgeBase, filepath: Path, pretty: bool = True) -> None:
        """
        Save knowledge base to JSON file.

        Args:
            kb: KnowledgeBase object
            filepath: Path to save JSON file
            pretty: If True, use pretty formatting
        """
        logger.info(f"Saving knowledge base to: {filepath}")

        # Ensure directory exists
        filepath.parent.mkdir(parents=True, exist_ok=True)

        # Convert to dict
        kb_dict = kb.model_dump(mode='json')

        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            if pretty:
                json.dump(kb_dict, f, indent=2, ensure_ascii=False, default=str)
            else:
                json.dump(kb_dict, f, ensure_ascii=False, default=str)

        file_size = filepath.stat().st_size
        logger.info(f"Knowledge base saved ({file_size:,} bytes)")

    @staticmethod
    def create_backup(kb: KnowledgeBase, backup_dir: Path) -> Path:
        """
        Create a timestamped backup of the knowledge base.

        Args:
            kb: KnowledgeBase object
            backup_dir: Directory for backups

        Returns:
            Path to backup file
        """
        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        version = kb.metadata.version
        backup_file = backup_dir / f"kb_v{version}_{timestamp}.json"

        JSONGenerator.save(kb, backup_file, pretty=True)

        logger.info(f"Backup created: {backup_file}")
        return backup_file

    @staticmethod
    def validate_json(filepath: Path) -> bool:
        """
        Validate JSON file structure.

        Args:
            filepath: Path to JSON file

        Returns:
            True if valid JSON, False otherwise
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                json.load(f)
            return True
        except (json.JSONDecodeError, FileNotFoundError) as e:
            logger.error(f"JSON validation failed: {e}")
            return False
