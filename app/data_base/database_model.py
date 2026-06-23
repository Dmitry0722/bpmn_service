from app.data_base.database import Base
from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid, asyncpg
from datetime import datetime


class ProcessingTask(Base):
    __tablename__ = "processing_tasks"

    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String(50), default='uploaded', index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    '''Данные файла'''
    original_filename = Column(String(500), nullable=False)
    original_file_type = Column(String(100))
    original_file_size = Column(Integer)
    extracted_text = Column(JSONB)

    '''Результаты сгенерированной инфографики'''
    result_uml = Column(JSONB)
    result_bpmn = Column(JSONB)
    result_srs = Column(JSONB)
    result_infographic = Column(JSONB)

    error_info = Column(JSONB)


def __repr__(self):
    return f"<Task {self.id}: {self.original_filename} ({self.status})>"
