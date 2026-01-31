"""fazer outcome nullable em approvals

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-01-31 02:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop check constraint
    op.drop_constraint('ck_approval_outcome', 'approvals', type_='check')
    # Make outcome nullable
    op.alter_column('approvals', 'outcome', 
        existing_type=sa.String(50),
        nullable=True)


def downgrade() -> None:
    # Make outcome not nullable
    op.alter_column('approvals', 'outcome',
        existing_type=sa.String(50),
        nullable=False)
    # Add check constraint back
    op.create_check_constraint(
        'ck_approval_outcome',
        'approvals',
        "outcome IN ('APPROVED', 'REJECTED')"
    )
