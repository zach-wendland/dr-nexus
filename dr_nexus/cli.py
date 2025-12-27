"""Command-line interface for Dr. Nexus."""

import sys
import click
from pathlib import Path

from dr_nexus.utils.config import get_config
from dr_nexus.utils.logging_config import setup_logging


@click.group()
@click.option('--log-level', default='INFO', type=click.Choice(['DEBUG', 'INFO', 'WARNING', 'ERROR']))
@click.pass_context
def cli(ctx, log_level):
    """Dr. Nexus - Medical Knowledge Base Builder."""
    config = get_config()
    setup_logging(log_level, config.logs_dir)
    ctx.obj = {'config': config}


@cli.command()
@click.option('--data-dir', type=click.Path(exists=True), help='Data directory')
@click.option('--output', type=click.Path(), default='data/knowledge_base/current.json', help='Output file')
@click.option('--enable-ultrathink/--no-ultrathink', default=True, help='Enable Ultrathink analysis')
@click.pass_context
def build(ctx, data_dir, output, enable_ultrathink):
    """Build initial knowledge base from medical records."""
    click.echo("Building knowledge base...")

    # Import here to avoid circular imports
    from scripts.initial_build import main as build_main
    import sys

    # Construct args for initial_build
    args = ['--output', output, '--log-level', 'INFO', '--no-backup']
    if data_dir:
        args.extend(['--data-dir', data_dir])
    if not enable_ultrathink:
        args.append('--no-ultrathink')

    sys.argv = ['initial_build.py'] + args

    try:
        return build_main()
    except SystemExit as e:
        return e.code


@cli.command()
@click.argument('kb_file', type=click.Path(exists=True))
@click.pass_context
def validate(ctx, kb_file):
    """Validate knowledge base JSON file."""
    from dr_nexus.knowledge_base.kb_loader import KBLoader

    click.echo(f"Validating: {kb_file}")

    is_valid = KBLoader.validate(Path(kb_file))

    if is_valid:
        click.secho("✓ Valid knowledge base", fg='green')
        return 0
    else:
        click.secho("✗ Invalid knowledge base", fg='red')
        return 1


@cli.command()
@click.argument('kb_file', type=click.Path(exists=True))
@click.pass_context
def stats(ctx, kb_file):
    """Show knowledge base statistics."""
    from dr_nexus.knowledge_base.kb_loader import KBLoader

    kb = KBLoader.load(Path(kb_file))
    if not kb:
        click.secho("Failed to load knowledge base", fg='red')
        return 1

    click.echo("\n" + "="*60)
    click.echo("KNOWLEDGE BASE STATISTICS")
    click.echo("="*60)
    click.echo(f"\nVersion: {kb.metadata.version}")
    click.echo(f"Generated: {kb.metadata.generated_at}")
    click.echo(f"Source files: {kb.metadata.source_files_count}")
    click.echo(f"\nPatient: {kb.patient_profile.demographics.name}")
    click.echo(f"Age: {kb.patient_profile.demographics.age}")
    click.echo(f"\nTimeline events: {len(kb.timeline)}")
    click.echo(f"Chronic conditions: {len(kb.patient_profile.chronic_conditions)}")
    click.echo(f"Active symptoms: {len(kb.get_active_symptoms())}")
    click.echo(f"Pending actions: {len(kb.get_pending_actions())}")
    click.echo(f"Unresolved questions: {len(kb.unresolved_questions)}")

    click.echo("\n" + "="*60)
    return 0


def main():
    """Main entry point."""
    cli()


if __name__ == '__main__':
    main()
