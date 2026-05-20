from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

# Import all routers
from app.routers import (
    auth,
    users,
    categories,
    suppliers,
    products,
    stock_movements,
    dashboard,
)


# ---------------------------------------------------------------------
# Startup / Shutdown lifecycle
# ---------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            admin = User(
                username="admin",
                email="admin@example.com",
                hashed_password=hash_password("admin123"),
                is_active=True,
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created (username: admin / password: admin123)")
        else:
            print("ℹ️  Admin already exists")
    except Exception as e:
        print(f"⚠️  Startup error: {e}")
    finally:
        db.close()

    yield
    print("👋 Shutting down Inventory Management System")


# ---------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------
app = FastAPI(
    title="Inventory Management System",
    description="Backend API for managing products, stock, suppliers, and users.",
    version="1.0.0",
    lifespan=lifespan,
)

# 🔧 Disable automatic trailing-slash redirects (fixes 404 on POST /movements)
app.router.redirect_slashes = False

# ---------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Routers — only add "/api" prefix; routers already define their own
# sub-prefix (/auth, /users, /categories, ...) and tags.
# ---------------------------------------------------------------------
app.include_router(auth.router,            prefix="/api")
app.include_router(users.router,           prefix="/api")
app.include_router(categories.router,      prefix="/api")
app.include_router(suppliers.router,       prefix="/api")
app.include_router(products.router,        prefix="/api")
app.include_router(stock_movements.router, prefix="/api")
app.include_router(dashboard.router,       prefix="/api")


# ---------------------------------------------------------------------
# Root & health endpoints
# ---------------------------------------------------------------------
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Inventory Management System API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "healthy"}