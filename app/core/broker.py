import asyncio
from faststream.rabbit import RabbitBroker, Channel
from aio_pika.exceptions import AMQPConnectionError
import logging
import os

logger = logging.getLogger(__name__)

custom_channel = Channel(prefetch_count=5)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
broker = RabbitBroker(RABBITMQ_URL, default_channel=custom_channel)

async def wait_for_rabbitmq(retries=12, delay=5):
    for attempt in range(retries):
        try:
            await broker.connect()
            logger.info("Подключено к RabbitMQ")
            return
        except AMQPConnectionError as e:
            if attempt == retries - 1:
                logger.info("Подключение к RabbitMQ не удалось")
                raise
            logger.warning(f"RabbitMQ не подключен, попытка {attempt+1}/{retries}")
            await asyncio.sleep(delay)