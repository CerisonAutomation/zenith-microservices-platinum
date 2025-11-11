"""
Supabase client configuration for Zenith Microservices.
Provides Supabase client instances for authentication, database, and storage operations.
"""
import os
from supabase import create_client, Client
from gotrue import AuthResponse
from typing import Optional

# Supabase configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Validate required environment variables
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is required")
if not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_ANON_KEY environment variable is required")

# Create Supabase client with anonymous key (for client-side operations)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Create Supabase client with service role key (for server-side operations)
supabase_admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_supabase_client() -> Client:
    """Get the main Supabase client for client-side operations."""
    return supabase

def get_supabase_admin_client() -> Client:
    """Get the Supabase admin client for server-side operations."""
    if not supabase_admin:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY not configured")
    return supabase_admin

def get_current_user(token: str):
    """Get current user from JWT token."""
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        return None

def verify_token(token: str) -> bool:
    """Verify if a JWT token is valid."""
    try:
        user = get_current_user(token)
        return user is not None
    except Exception:
        return False