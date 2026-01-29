"""criar tabela applications

Revision ID: 96ce19e011b3
Revises: 4dcff14409e6
Create Date: 2026-01-29 00:45:18.639224

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96ce19e011b3'
down_revision: Union[str, None] = '4dcff14409e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'applications',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), server_default=sa.func.gen_random_uuid(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('owner_team', sa.String(255)),
        sa.Column('repo_url', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.Index('ix_applications_name', 'name')
    )


def downgrade() -> None:
    op.drop_table('applications')
