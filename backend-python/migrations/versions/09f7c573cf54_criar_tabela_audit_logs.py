"""criar tabela audit_logs

Revision ID: 09f7c573cf54
Revises: 1d076041e0e4
Create Date: 2026-01-29 00:45:19.219419

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09f7c573cf54'
down_revision: Union[str, None] = '1d076041e0e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), server_default=sa.func.gen_random_uuid(), nullable=False),
        sa.Column('actor', sa.String(255), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity', sa.String(100), nullable=False),
        sa.Column('entity_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('request_id', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_audit_logs_actor', 'actor'),
        sa.Index('ix_audit_logs_action', 'action'),
        sa.Index('ix_audit_logs_entity_id', 'entity_id'),
        sa.Index('ix_audit_logs_created_at', 'created_at'),
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
