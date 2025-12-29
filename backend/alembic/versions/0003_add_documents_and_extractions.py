"""add documents and extractions

Revision ID: 0003_add_documents_and_extractions
Revises: 0002_add_chain_fields
Create Date: 2025-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0003_add_documents_and_extractions"
down_revision = "0002_add_chain_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("batch_id", sa.String(length=64), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=127), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column("fingerprint", sa.String(length=66), nullable=False),
        sa.PrimaryKeyConstraint("document_id"),
    )
    op.create_index("ix_documents_batch_id", "documents", ["batch_id"], unique=False)

    op.create_table(
        "extractions",
        sa.Column("batch_id", sa.String(length=64), nullable=False),
        sa.Column("extracted_fields", sa.JSON(), nullable=False),
        sa.Column("model_info", sa.JSON(), nullable=False),
        sa.Column("extracted_at", sa.DateTime(), nullable=False),
        sa.Column("document_fingerprint", sa.String(length=66), nullable=False),
        sa.PrimaryKeyConstraint("batch_id"),
    )


def downgrade() -> None:
    op.drop_table("extractions")
    op.drop_index("ix_documents_batch_id", table_name="documents")
    op.drop_table("documents")
