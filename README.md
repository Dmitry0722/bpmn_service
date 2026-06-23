# App Backend (FastAPI + RabbitMQ + PostgreSQL)
Сервис для автоматической генерации архитектурных артефактов (BPMN, UML, SRS, инфографика) из текстовых документов. 
Сервис принимает документы, извлекает из них текст, ставит задачу в очередь и сохраняет результат LLM-анализа в базу данных.

## Технологии

- FastAPI API (`app/main.py`)
- RabbitMQ брокер очередей (`task_message`)
- FastStream фрйемворк для работы с брокером (`app/workers/get_llm_worker.py`)
- PostgreSQL + SQLAlchemy async (`app/data_base/*`)
- Парсинг файлов (`app/services/parsing.py`)

## Переменные окружения
Создайте файл .env в корне проекта:
-POSTGRES_USER
-POSTGRES_PASSWORD
-POSTGRES_DB
-DATABASE_URL=postgresql+asyncpg://...
-RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

## Быстрый запуск через Docker

Запуск выполняется из корня проекта `D:\project`, так как `docker-compose.yml` лежит там.

1. Убедитесь, что Docker Desktop запущен.
2. Проверьте `.env` в `D:\project`.
3. Поднимите сервисы:

```bash
docker compose up --build
```

После запуска будут доступны:

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- RabbitMQ UI: `http://localhost:15672` (`guest/guest`)
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Сервисы в compose

- `fastapi` - HTTP API
- `worker` - асинхронный обработчик задач из RabbitMQ
- `rabbitmq` - очередь сообщений
- `postgres` - хранилище задач и результатов
- `frontend` - UI-клиент

## API эндпоинты

### 1) Загрузка документа и создание задачи

`POST /api/generate`

`multipart/form-data`:
- `file` - файл (`.txt`, `.pdf`, `.doc`, `.docx`)

Пример:

```bash
curl -X POST "http://localhost:8000/api/generate" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@Example.json"
```

Ответ:

```json
{
  "task_id": "b3f4bbdc-5c55-49d8-b20d-649d304a978f"
}
```

Ошибки:
- `400` - невалидный тип/формат файла
- `500` - внутренняя ошибка

### 2) Проверка статуса задачи

`GET /api/tasks/{task_id}/status`

Пример:

```bash
curl "http://localhost:8000/api/tasks/b3f4bbdc-5c55-49d8-b20d-649d304a978f/status"
```

Ответ:

```json
{
  "status": "processing"
}
```

Ошибки:
- `404` - задача не найдена
- `500` - ошибка БД/сервера

### 3) Получение результата задачи

`GET /api/tasks/{task_id}/result`

Пример:

```bash
curl "http://localhost:8000/api/tasks/b3f4bbdc-5c55-49d8-b20d-649d304a978f/result"
```

**Пример успешного ответа (статус `success`):**

```json
{
  "steps": [...],
  "title": "Управление контрагентами",
  "description": "Внедрение единого реестра контрагентов...",
  "mermaidCode": "flowchart LR\n  start['Создать заявку'] --> check{'Проверить'}..."
}
```

Ошибки:
- `404` - результат еще не готов или отсутствует
- `500` - ошибка БД/сервера

## Жизненный цикл задачи

1. Клиент отправляет файл на `/api/generate`.
2. API валидирует файл и извлекает текст.
3. API создает запись в `processing_tasks` со статусом `uploaded`.
4. API отправляет `task_id` в очередь `task_message`.
5. Воркер получает задачу, ставит статус `processing`.
6. Воркер вызывает LLM-сервис и сохраняет `bpmn_result`.
7. Статус обновляется на `success` или `failed`.
8. Клиент запрашивает статус и результат через API.

## Поддерживаемые форматы и ограничения

Поддерживаемые расширения:
- `.txt`
- `.pdf`
- `.doc`
- `.docx`

Проверка идет по:
- расширению файла
- MIME-типу

## База данных

Таблица: `processing_tasks`  
Ключевые поля:

- `task_id` (UUID)
- `status` (String)
- `created_at` (DateTime)
- `original_filename`, `original_file_type`, `original_file_size` (String)
- `extracted_text` (JSONB)
- `result_uml` (JSONB)
- `result_bpmn` (JSONB)
- `result_srs` (JSONB)
- `result_infographic` (JSONB)
- `error_info` (JSONB)

Создание таблиц:
- автоматически при старте API (`init_db()` в `lifespan`)

## Логи

Логи сохраняются в `app/logs`:

- `app.log` - общее приложение
- `uvicorn.log` - ошибки uvicorn
- `access.log` - access-лог запросов
