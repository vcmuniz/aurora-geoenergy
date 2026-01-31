"""criar tabela release_events

Revision ID: a7b8c9d0e1f2
Revises: 09f7c573cf54
Create Date: 2026-01-31 02:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = '09f7c573cf54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'release_events',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), server_default=sa.func.gen_random_uuid(), nullable=False),
        sa.Column('release_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('actor_email', sa.String(255)),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['release_id'], ['releases.id'], ondelete='CASCADE'),
        sa.Index('ix_release_events_release_id', 'release_id'),
    )


def downgrade() -> None:
    op.drop_table('release_events')
