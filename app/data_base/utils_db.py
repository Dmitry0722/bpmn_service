from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database_model import ProcessingTask  # модель
import uuid
import json
from typing import Optional


class DatabaseUtils:
    @staticmethod
    async def create_processing_task(session: AsyncSession,
                                     task_id: uuid.UUID,
                                     filename: str,
                                     file_size: int = None,
                                     file_type: str = None,
                                     extracted_text: str = None,
                                     status: str = "uploaded"
                                     ) -> ProcessingTask:
        task = ProcessingTask(
            task_id=task_id,
            status=status,
            original_filename=filename,
            original_file_size=file_size,
            original_file_type=file_type,
            extracted_text={"text": extracted_text}
        )

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return task

    @staticmethod
    async def get_task_by_id(session: AsyncSession,
                             task_id: uuid.UUID
                             ) -> Optional[ProcessingTask]:
        result = await session.execute(select(ProcessingTask).where(ProcessingTask.task_id == task_id))

        return result.scalar_one_or_none()

    @staticmethod
    async def update_status(session: AsyncSession,
                            task_id: uuid.UUID,
                            status: str) -> Optional[ProcessingTask]:
        task = await DatabaseUtils.get_task_by_id(session, task_id)
        if not task:
            return None

        task.status = status

        await session.commit()
        await session.refresh(task)

        return task

    @staticmethod
    async def delete_task(session: AsyncSession,
                          task_id: uuid.UUID) -> bool:

        task = await DatabaseUtils.get_task_by_id(session, task_id)

        if not task:
            return False

        await session.delete(task)
        await session.commit()

        return True

    @staticmethod
    async def save_results(session: AsyncSession,
                           task_id: uuid.UUID,
                           result_bpmn: Optional[dict] = None,
                           result_uml: Optional[dict] = None,
                           result_srs: Optional[dict] = None,
                           result_infographic: Optional[dict] = None,
                           ) -> Optional[ProcessingTask]:
        task = await DatabaseUtils.get_task_by_id(session, task_id)
        if not task:
            return None

        if result_uml is not None:
            task.result_uml = result_uml
        if result_bpmn is not None:
            task.result_bpmn = result_bpmn
        if result_srs is not None:
            task.result_srs = result_srs
        if result_infographic is not None:
            task.result_infographic = result_infographic

        await session.commit()
        await session.refresh(task)
        return task

    @staticmethod
    async def add_error_info(session: AsyncSession,
                             task_id: uuid.UUID,
                             error_info: str) -> Optional[ProcessingTask]:

        task = await DatabaseUtils.get_task_by_id(session, task_id)

        if not task:
            return None

        task.error_info = error_info

        await session.commit()
        await session.refresh(task)

        return task


    @staticmethod
    async def get_llm_results(session: AsyncSession,
                             task_id: uuid.UUID) -> Optional[json]:

        task = await DatabaseUtils.get_task_by_id(session, task_id)

        if not task:
            return None

        result = task.result_bpmn

        return result
