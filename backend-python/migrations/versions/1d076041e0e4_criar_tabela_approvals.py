"""criar tabela approvals

Revision ID: 1d076041e0e4
Revises: a70940eaa7b3
Create Date: 2026-01-29 00:45:19.027173

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d076041e0e4'
down_revision: Union[str, None] = 'a70940eaa7b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'approvals',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), server_default=sa.func.gen_random_uuid(), nullable=False),
        sa.Column('release_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('approver_email', sa.String(255), nullable=False),
        sa.Column('outcome', sa.String(50), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['release_id'], ['releases.id'], ondelete='CASCADE'),
        sa.CheckConstraint("outcome IN ('APPROVED', 'REJECTED')", name='ck_approval_outcome'),
        sa.Index('ix_approvals_release_id', 'release_id'),
        sa.Index('ix_approvals_approver_email', 'approver_email'),
    )


def downgrade() -> None:
    op.drop_table('approvals')
