from fastapi import APIRouter
from app.data_base.utils_db import DatabaseUtils
from app.data_base.database import SessionLocal
from fastapi import HTTPException
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError
import logging
router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/api/tasks/{task_id}/status")
async def get_status(task_id: str):
    try:
        async with SessionLocal() as session:
            result = await DatabaseUtils.get_task_by_id(session, UUID(task_id))
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

    if result is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"status": result.status}

