"""
Supabase Client Singleton
Provides shared Supabase client instance for Python automation scripts.

Usage:
    from supabase_client import get_supabase_client
    client = get_supabase_client()
"""

import os

_supabase_client = None


def get_supabase_client():
    """
    Get shared Supabase client instance (lazy-loaded singleton).
    Returns None if credentials not configured.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        return _supabase_client
    except ImportError:
        print("[SupabaseClient] supabase-py not installed. Run: pip install supabase")
        return None
    except Exception as e:
        print(f"[SupabaseClient] Failed to create client: {e}")
        return None


def reset_client():
    """Reset the singleton (useful for testing)."""
    global _supabase_client
    _supabase_client = None
