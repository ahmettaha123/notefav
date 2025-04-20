'use client';

import { createContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mobil uyumluluğu artırmak için session yönetimi
    const initAuth = async () => {
      try {
        // Mevcut oturumu al
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Mobil cihazlarda oturum durumunu localStorage'a kaydet
          if (typeof window !== 'undefined') {
            localStorage.setItem('authStatus', 'authenticated');
            
            // Şu anki URL'yi kontrol et
            const currentPath = window.location.pathname;
            
            // Eğer login veya signup sayfasındaysa dashboard'a yönlendir
            if (currentPath === '/auth/login' || currentPath === '/auth/signup') {
              router.push('/dashboard');
            }
          }
        } else {
          setUser(null);
          // Oturum yoksa localStorage'dan temizle
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authStatus');
          }
        }
      } catch (error) {
        console.error('Oturum başlatma hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Auth state değişikliklerini takip et
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Mobil cihazlarda oturum durumunu kaydet
          if (typeof window !== 'undefined') {
            localStorage.setItem('authStatus', 'authenticated');
            
            // Şu anki URL'yi kontrol et
            const currentPath = window.location.pathname;
            
            // Eğer login veya signup sayfasındaysa dashboard'a yönlendir
            if (currentPath === '/auth/login' || currentPath === '/auth/signup') {
              router.push('/dashboard');
            }
          }
        } else {
          setUser(null);
          // Oturum yoksa localStorage'dan temizle
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authStatus');
          }
        }
        setLoading(false);
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  const signUp = async (email, password) => {
    try {
      // Email'den kullanıcı adını çıkar ve Türkçe karakterleri koru
      const defaultName = email?.split('@')[0] || 'Kullanıcı';
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          data: { 
            full_name: defaultName,
            last_sign_in: new Date().toISOString()
          }
        }
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          persistSession: true
        }
      });
      if (error) throw error;
      
      // Kullanıcı metadatalarını güncelle
      await supabase.auth.updateUser({
        data: { last_sign_in: new Date().toISOString() }
      });
      
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Oturum kapatılınca localStorage'ı temizle
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authStatus');
      }
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  // Otoamatik oturum yenileme
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { success: true, session: data.session };
    } catch (error) {
      console.error('Oturum yenileme hatası:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      signUp, 
      signIn, 
      signOut, 
      loading,
      refreshSession,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
