import httpx
import logging
import time

logger = logging.getLogger(__name__)

async def call_llm_analyze(document_text: str, context_text: str = ""):
    async with httpx.AsyncClient(timeout=600.0) as client:
        try:
            response = await client.post(
                "http://llm_service:8000/api/analyze",
                json={"document_text": document_text, "context_text": ""}
            )
            response.raise_for_status()
            logger.info(f"Ответ от llm сервиса успешно получен")
            return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP ошибка при запросе к llm сервису: {e}")

        except Exception as e:
            logger.error(f"Неожиданная ошибка при запросе к llm сервису")

    logger.error("Ошибка получения ответа от llm сервиса, ответ не получен")
    return None

