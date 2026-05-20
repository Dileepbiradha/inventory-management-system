from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.core.config import settings
from app.routers import dashboard
from app.routers import (
    auth,
    categories,
    suppliers,
    products,
    stock_movements,
    users,
)
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A complete inventory management system API",
    redirect_slashes=False,
)

# CORS - read allowed origins from environment variable
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - all under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(stock_movements.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}