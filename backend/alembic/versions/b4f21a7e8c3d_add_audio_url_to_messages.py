"""Add audio_url column to messages table

Revision ID: b4f21a7e8c3d
Revises: 9c7ade3d9a58
Create Date: 2026-10-22 14:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4f21a7e8c3d'
down_revision: Union[str, Sequence[str], None] = '9c7ade3d9a58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add audio_url to messages for per-message TTS audio stream links."""
    op.add_column('messages', sa.Column('audio_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Remove audio_url from messages."""
    op.drop_column('messages', 'audio_url')
