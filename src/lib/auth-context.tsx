'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: 'admin' | 'amil' | 'supervisor' | 'user';
  status_aktif: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  assignedRTs: string[];
  muzakkiId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  assignedRTs: [],
  muzakkiId: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// --- LocalStorage Cache ---
const CACHE_KEY = 'zd_auth_cache';

function readCache(): { profile: UserProfile; assignedRTs: string[]; muzakkiId: string | null } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeCache(profile: UserProfile, assignedRTs: string[], muzakkiId: string | null) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ profile, assignedRTs, muzakkiId }));
  } catch { /* ignore */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignedRTs, setAssignedRTs] = useState<string[]>([]);
  const [muzakkiId, setMuzakkiId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheHydrated = useRef(false);

  // Step 1: Hydrate from localStorage cache immediately after mount (before network calls)
  useEffect(() => {
    if (cacheHydrated.current) return;
    cacheHydrated.current = true;
    const cached = readCache();
    if (cached) {
      setProfile(cached.profile);
      setAssignedRTs(cached.assignedRTs);
      setMuzakkiId(cached.muzakkiId);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        const p = profileData as UserProfile;
        setProfile(p);

        let rts: string[] = [];
        let mId: string | null = null;

        // Run secondary queries in parallel
        const promises: PromiseLike<void>[] = [];

        if (p.role === 'amil') {
          promises.push(
            supabase.from('amil_rt_assignments').select('rt').eq('amil_id', userId)
              .then(({ data: rtData }) => { rts = rtData?.map(r => r.rt) || []; setAssignedRTs(rts); })
          );
        } else {
          setAssignedRTs([]);
        }

        if (p.role === 'user') {
          promises.push(
            supabase.from('muzakki').select('id').eq('user_id', userId).single()
              .then(({ data: muzakkiData }) => { mId = muzakkiData?.id || null; setMuzakkiId(mId); })
          );
        } else {
          setMuzakkiId(null);
        }

        await Promise.all(promises);
        writeCache(p, rts, mId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  // Step 2: Validate session and refresh profile from server
  useEffect(() => {
    let mounted = true;
    let currentUserId = '';

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        if (currentUserId !== s.user.id) {
          currentUserId = s.user.id;
          fetchProfile(s.user.id);
        }
      } else {
        setProfile(null);
        setAssignedRTs([]);
        setMuzakkiId(null);
        clearCache();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          if (currentUserId !== s.user.id) {
            currentUserId = s.user.id;
            fetchProfile(s.user.id);
          }
        } else {
          currentUserId = '';
          setProfile(null);
          setAssignedRTs([]);
          setMuzakkiId(null);
          clearCache();
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    // Stage 1: Clear local state immediately for instant UI reaction
    setUser(null);
    setSession(null);
    setProfile(null);
    setAssignedRTs([]);
    setMuzakkiId(null);
    clearCache();

    // Stage 2: Perform the actual network signout in the background
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout issue', e);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, assignedRTs, muzakkiId, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
