"""add chain fields to batches

Revision ID: 0002_add_chain_fields
Revises: 0001_create_batches
Create Date: 2025-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0002_add_chain_fields"
down_revision = "0001_create_batches"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("batches") as batch_op:
        batch_op.add_column(sa.Column("chain", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("tx_hash", sa.String(length=66), nullable=True))
        batch_op.add_column(sa.Column("publisher_address", sa.String(length=42), nullable=True))
        batch_op.add_column(sa.Column("published_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("batches") as batch_op:
        batch_op.drop_column("published_at")
        batch_op.drop_column("publisher_address")
        batch_op.drop_column("tx_hash")
        batch_op.drop_column("chain")
