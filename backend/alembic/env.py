from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

import os
import sys

# Add the parent directory to Python path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Base and all models so Alembic can detect them
from app.database import Base
from app.models.user import User
from app.models.product import Product
from app.models.stock_movement import StockMovement
# Add any other models you have here, e.g.:
# from app.models.category import Category
# from app.models.supplier import Supplier

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Override the sqlalchemy.url with our actual database URL
config.set_main_option("sqlalchemy.url", "sqlite:///./inventory.db")

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target_metadata to Base.metadata so autogenerate works
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # Important for SQLite
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # Important for SQLite
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()