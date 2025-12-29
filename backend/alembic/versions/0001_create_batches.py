"""create batches table

Revision ID: 0001_create_batches
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0001_create_batches"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "batches",
        sa.Column("batch_id", sa.String(length=64), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("supplement_type", sa.String(length=255), nullable=False),
        sa.Column("manufacturer", sa.String(length=255), nullable=False),
        sa.Column("production_date", sa.Date(), nullable=False),
        sa.Column("expires_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("DRAFT", "READY", "PUBLISHED", name="batchstatus"),
            nullable=False,
            server_default="DRAFT",
        ),
        sa.PrimaryKeyConstraint("batch_id"),
    )


def downgrade() -> None:
    op.drop_table("batches")
    op.execute("DROP TYPE IF EXISTS batchstatus")
