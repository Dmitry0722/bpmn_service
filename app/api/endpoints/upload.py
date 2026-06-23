from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.validation import ValidationService
from app.core.broker import broker
from app.data_base.utils_db import DatabaseUtils
from app.data_base.database import SessionLocal
from app.services.parsing import TextParser
from app.workers.get_llm_worker import TaskMessage
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/api/generate")
async def upload_file(file: UploadFile = File(...)):
    logger.info(f"Получен файл: {file.filename}, размер: {file.size} байт")
    try:
        # Валидация файла
        valid_result = await ValidationService.validate_file(file)
        if not valid_result["valid"]:
            logger.warning(f"Файл {file.filename} не прошел валидацию: {valid_result['message']}")
            raise HTTPException(status_code=400, detail=valid_result["message"])

        task_id = uuid.uuid4()
        logger.info(f"Файл {file.filename} успешно прошёл валидацию")

        # Сохранение файла
        text, file_type, filename, file_size = await TextParser.parsing(file)
        async with SessionLocal() as session:
            await DatabaseUtils.create_processing_task(session, task_id, filename, file_size, file_type, text)
        logger.info(f"Файл {filename} успешно загружен в базу данных")

        # Отправка сообщения в брокер
        await broker.publish(TaskMessage(task_id=task_id), queue="task_message")
        logger.info(f"Задача {str(task_id)} добавлена в очередь")

        return {
            "task_id": str(task_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Ошибка при обработке загрузки файла")
        raise HTTPException(status_code=500, detail="Internal server error")
