from fastapi import FastAPI
import uvicorn
import logging
from app.api.endpoints.upload import router as upload_router
from app.api.endpoints.tasks import router as task_router
from app.api.endpoints.results import router as results_router
from fastapi.middleware.cors import CORSMiddleware
from app.core.logger_config import setup_logging
from contextlib import asynccontextmanager
from app.core.broker import broker
from app.core.broker import wait_for_rabbitmq
from app.data_base.database import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await wait_for_rabbitmq()
    yield
    await broker.close()

app = FastAPI(lifespan=lifespan)
setup_logging()

origins = [
    "http://localhost:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(upload_router)
app.include_router(task_router)
app.include_router(results_router)

if __name__ == "__main__":
    uvicorn.run("main:app", reload=False, log_config=None)
