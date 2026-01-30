"""Adicionar coluna password_hash na tabela users

Revision ID: 6f8e4c2a1b3d
Revises: 1d076041e0e4
Create Date: 2026-01-30 13:56:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f8e4c2a1b3d'
down_revision: Union[str, None] = '1d076041e0e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=False, server_default=''))
    op.alter_column('users', 'password_hash', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'password_hash')
