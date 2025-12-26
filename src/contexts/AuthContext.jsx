// AuthContext.jsx v1.0 - Admin-only Authentication
// Provides authentication state and methods via Supabase Auth
//
// Features:
// - Session persistence (auto-refresh tokens)
// - signIn/signOut methods
// - useAuth hook for consuming auth state
// - Loading state for initial session check
//
// CHANGELOG:
// v1.0 (2025-12-26): Initial implementation
//   - Admin-only auth (no public signup)
//   - Session management via Supabase
//   - Auth state synced with Supabase onAuthStateChange

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    let authListener = null;

    const initAuth = async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
          console.warn('[Auth] Supabase client not available');
          if (mounted) setLoading(false);
          return;
        }

        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth] Error getting session:', sessionError);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('[Auth] Auth state changed:', event);

            if (mounted) {
              setSession(currentSession);
              setUser(currentSession?.user ?? null);
              setError(null);
            }
          }
        );

        authListener = subscription;
      } catch (err) {
        console.error('[Auth] Init error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase não está configurado');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Translate common errors to Portuguese
        let message = signInError.message;
        if (message.includes('Invalid login credentials')) {
          message = 'Email ou senha incorretos';
        } else if (message.includes('Email not confirmed')) {
          message = 'Email não confirmado';
        } else if (message.includes('Too many requests')) {
          message = 'Muitas tentativas. Aguarde alguns minutos.';
        }
        throw new Error(message);
      }

      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase não está configurado');
      }

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
