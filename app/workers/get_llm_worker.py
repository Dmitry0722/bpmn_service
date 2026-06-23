from app.services.call_llm_analyze import call_llm_analyze
from faststream import FastStream
from faststream.rabbit import RabbitBroker
from pydantic import BaseModel, Field
from app.core.broker import wait_for_rabbitmq
from app.data_base.utils_db import DatabaseUtils
from app.data_base.database import SessionLocal
import logging
from uuid import UUID
from dotenv import load_dotenv
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
RABBITMQ_URL = os.getenv('RABBITMQ_URL')
broker = RabbitBroker(RABBITMQ_URL)
app = FastStream(broker)

@app.on_startup
async def startup():
    await wait_for_rabbitmq()


class TaskMessage(BaseModel):
    task_id: UUID = Field(..., description="ID задачи")

@broker.subscriber("task_message")
async def task_message(msg: TaskMessage):
    task_id = msg.task_id
    logger.info(f"Задача получена: {task_id}")

    # Получаем текст
    async with SessionLocal() as session:
        task = await DatabaseUtils.get_task_by_id(session, task_id)
        text = task.extracted_text["text"]
        try:
            # Обновляем статус на processing
            await DatabaseUtils.update_status(session, task_id, "processing")

            # Получаем результаты от llm модуля
            result = await call_llm_analyze(text, "")

            # Сохраняем результат
            if result is not None:
                await DatabaseUtils.update_status(session, task_id, "success")
                await DatabaseUtils.save_results(session, task_id, result)
            else:
                await DatabaseUtils.update_status(session, task_id, "failed")
                logger.info(f"Задача {task_id} не выполнена: llm сервис недоступен")

        except Exception as e:
            await DatabaseUtils.update_status(session, task_id, "failed")
            await DatabaseUtils.add_error_info(session, task_id, str(e))
            logger.exception(f"Задача {task_id} не выполнена")