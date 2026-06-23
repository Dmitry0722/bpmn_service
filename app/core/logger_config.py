import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path


LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logging():
    root_logger = logging.getLogger()

    if root_logger.handlers:
        return

    root_logger.setLevel(logging.INFO)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    file_handler = RotatingFileHandler(
        str(LOG_DIR / "app.log"),
        maxBytes=10 * 1024 * 1024,  # 10 МБ
        backupCount=0,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)

    uvicorn_error = logging.getLogger("uvicorn.error")
    uvicorn_error_file = RotatingFileHandler(
        str(LOG_DIR / "uvicorn.log"),
        maxBytes=10 * 1024 * 1024,  # 10 МБ
        backupCount=0,
        encoding="utf-8"
    )
    uvicorn_error_file.setLevel(logging.INFO)
    uvicorn_error_file.setFormatter(file_formatter)
    uvicorn_error.addHandler(uvicorn_error_file)
    uvicorn_error.propagate = False

    uvicorn_access = logging.getLogger("uvicorn.access")
    access_file_handler = RotatingFileHandler(
        str(LOG_DIR / "access.log"),
        maxBytes=10 * 1024 * 1024,  # 10 МБ
        backupCount=0,
        encoding="utf-8"
    )
    access_file_handler.setLevel(logging.INFO)
    access_file_handler.setFormatter(file_formatter)
    uvicorn_access.addHandler(access_file_handler)
    uvicorn_access.propagate = False

