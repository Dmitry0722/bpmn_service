from fastapi import APIRouter
import logging
from app.data_base.utils_db import DatabaseUtils
from app.data_base.database import SessionLocal
from fastapi import HTTPException
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/api/tasks/{task_id}/result")
async def get_result(task_id: str):
    async with SessionLocal() as session:
        try:
            result = await DatabaseUtils.get_llm_results(session, UUID(task_id))
            if result is None:
                logger.info(f"Результаты не найдены:: {task_id}")
                raise HTTPException(status_code=404, detail="results not found")

            result['mermaidCode'] = result['mermaidCode'].replace("'", '"')
            return result

        except SQLAlchemyError as e:
            logger.error(f"Ошибка при получении результатов из базы данных: {e}")
            raise HTTPException(status_code=500, detail="Database error")
        except Exception as e:
            logger.error(f"Неожиданная ошибка: task_id {task_id}, детали: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")



