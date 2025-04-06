'use client';

import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';

export default function ResetPassword() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    try {
      setLoading(true);
      
      const emailToReset = user ? user.email : email;
      
      if (!emailToReset) {
        setMessage({ 
          text: 'Lütfen geçerli bir e-posta adresi girin', 
          type: 'error' 
        });
        return;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      
      setMessage({ 
        text: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      setMessage({ 
        text: `Hata: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Şifre Sıfırlama</h1>
      
      <form onSubmit={handleResetPassword} className="card">
        {message.text && (
          <div className={`mb-6 p-3 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}
        
        {!user && (
          <div className="mb-6">
            <label className="block mb-2">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="E-posta adresiniz"
              required
            />
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {user 
              ? 'Şifrenizi sıfırlamak için bir e-posta göndereceğiz.' 
              : 'E-posta adresinizi girin ve şifre sıfırlama talimatlarını göndereceğiz.'}
          </p>
        </div>
        
        <button 
          type="submit" 
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
        </button>
        
        <div className="mt-4 text-center">
          <Link href={user ? "/profile" : "/auth/login"} className="text-cyan-500 hover:underline">
            {user ? 'Profilime Dön' : 'Giriş Sayfasına Dön'}
          </Link>
        </div>
      </form>
    </div>
  );
}
