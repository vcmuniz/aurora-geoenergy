"""criar tabela releases

Revision ID: a70940eaa7b3
Revises: 96ce19e011b3
Create Date: 2026-01-29 00:45:18.829201

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a70940eaa7b3'
down_revision: Union[str, None] = '96ce19e011b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'releases',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), server_default=sa.func.gen_random_uuid(), nullable=False),
        sa.Column('application_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('version', sa.String(100), nullable=False),
        sa.Column('env', sa.String(50), nullable=False, server_default='DEV'),
        sa.Column('status', sa.String(50), nullable=False, server_default='PENDING'),
        sa.Column('evidence_url', sa.String(500)),
        sa.Column('evidence_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('version_row', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('deployed_at', sa.DateTime()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.CheckConstraint("env IN ('DEV', 'PRE_PROD', 'PROD')", name='ck_release_env'),
        sa.CheckConstraint("status IN ('PENDING', 'APPROVED', 'DEPLOYED', 'REJECTED')", name='ck_release_status'),
        sa.CheckConstraint('evidence_score >= 0 AND evidence_score <= 100', name='ck_release_score'),
        sa.UniqueConstraint('application_id', 'version', 'env', name='uq_app_version_env'),
        sa.Index('ix_releases_application_id', 'application_id'),
        sa.Index('ix_releases_env', 'env'),
        sa.Index('ix_releases_created_at', 'created_at'),
    )


def downgrade() -> None:
    op.drop_table('releases')
