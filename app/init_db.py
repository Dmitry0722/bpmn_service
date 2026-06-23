import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.data_base.database import engine, Base
from app.data_base.database_model import ProcessingTask


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Таблицы созданы")


if __name__ == "__main__":
    asyncio.run(create_tables())
