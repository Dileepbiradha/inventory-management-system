"""
Dependencies module - re-exports auth dependencies from security.py
for cleaner imports in routers.
"""
from app.core.security import (
    get_current_user,
    require_admin,
    require_manager_or_admin,
)

# Alias: get_current_active_user is the same as get_current_user
# (since get_current_user already checks is_active)
get_current_active_user = get_current_user

__all__ = [
    "get_current_user",
    "get_current_active_user",
    "require_admin",
    "require_manager_or_admin",
]