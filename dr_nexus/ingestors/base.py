"""Base ingestor abstract class."""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List
import logging

from dr_nexus.models.document import DocumentMetadata


logger = logging.getLogger(__name__)


class BaseIngestor(ABC):
    """Base class for all data ingestors."""

    def __init__(self) -> None:
        """Initialize the ingestor."""
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def can_ingest(self, filepath: Path) -> bool:
        """
        Check if this ingestor can handle the given file.

        Args:
            filepath: Path to the file

        Returns:
            True if this ingestor can process the file
        """
        pass

    @abstractmethod
    def ingest(self, filepath: Path) -> Dict[str, Any]:
        """
        Ingest a medical document and extract structured data.

        Args:
            filepath: Path to the file to ingest

        Returns:
            Dictionary containing extracted data

        Raises:
            ValueError: If the file cannot be processed
        """
        pass

    def get_metadata(self, filepath: Path) -> DocumentMetadata:
        """
        Get metadata for a document.

        Args:
            filepath: Path to the file

        Returns:
            DocumentMetadata object
        """
        from dr_nexus.models.document import DocumentType
        return DocumentMetadata.from_file(filepath, DocumentType.OTHER)

    def validate_file_exists(self, filepath: Path) -> None:
        """
        Validate that a file exists.

        Args:
            filepath: Path to check

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")

    def validate_file_readable(self, filepath: Path) -> None:
        """
        Validate that a file is readable.

        Args:
            filepath: Path to check

        Raises:
            PermissionError: If file is not readable
        """
        if not filepath.is_file():
            raise ValueError(f"Not a file: {filepath}")

        try:
            with open(filepath, 'rb'):
                pass
        except PermissionError as e:
            raise PermissionError(f"Cannot read file: {filepath}") from e
