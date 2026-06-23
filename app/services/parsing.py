import PyPDF2
import docx2txt
import io
import os
import tempfile
import textract
import logging
from fastapi import UploadFile

logger = logging.getLogger(__name__)

async def pdf_parser(file: UploadFile):
    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        logger.exception(f"Parsing error PDF: {str(e)}")
        raise Exception(f"Parsing error PDF: {str(e)}")


async def docx_parser(file: UploadFile):
    try:
        content = await file.read()
        docx_file = io.BytesIO(content)
        text = docx2txt.process(docx_file)
        return text
    except Exception as e:
        logger.exception(f"Parsing error Doc: {str(e)}")
        raise Exception(f"Parsing error Docx: {str(e)}")


async def doc_parser(file: UploadFile):
    try:
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix="doc") as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        text = textract.process(temp_path).decode('utf-8')
        os.unlink(temp_path)
        return text
    except Exception as e:
        logger.exception(f"Parsing error Doc: {str(e)}")
        raise Exception(f"Parsing error Doc: {str(e)}")


async def txt_parser(file: UploadFile):
    try:
        content = await file.read()
        text = content.decode('utf-8')
        return text
    except Exception as e:
        logger.exception(f"Parsing error TXT: {str(e)}")
        raise Exception(f"Parsing error txt: {str(e)}")


class TextParser:
    async def parsing(file: UploadFile):
        file_type = '.' + file.filename.split('.')[-1].lower()
        filename = file.filename
        file_size = file.size

        match file_type:
            case ".pdf":
                text = await pdf_parser(file)
                return text, file_type, filename, file_size
            case ".docx":
                text = await docx_parser(file)
                return text, file_type, filename, file_size
            case ".doc":
                text = await doc_parser(file)
                return text, file_type, filename, file_size
            case ".txt":
                text = await txt_parser(file)
                return text, file_type, filename, file_size
            case _:
                raise ValueError(f"Неподдерживаемый формат: {file_type}")
