from fastapi import File, UploadFile
from pydantic import BaseModel


class ValidationService:
    async def validate_file(file: UploadFile) -> dict:
        allowed_mime_types = [
            "text/plain",  # TXT файлы
            "application/pdf",  # PDF файлы
            "application/msword",  # DOC файлы
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"  # DOCX
        ]

        allowed_extensions = {'.txt', '.pdf', '.doc', '.docx'}
        file_extension = '.' + file.filename.split('.')[-1].lower()

        if file_extension not in allowed_extensions:
            return {
                "valid": False,
                "message": f"Неподдерживаемый тип файла: {file.filename}"
            }

        if file.content_type not in allowed_mime_types:
            return {
                "valid": False,
                "message": f"Неподдерживаемый MIME-тип файла: {file.filename}"
            }

        return {
            "valid": True,
            "message": "Файл успешно прошел валидацию"
        }
