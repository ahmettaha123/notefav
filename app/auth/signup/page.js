'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // Validation
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    setLoading(true);
    
    const result = await signUp(email, password);
    if (result.success) {
      setMessage('Kayıt başarılı! E-posta adresinizi kontrol edin.');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Üye Ol</h1>
      
      <form onSubmit={handleSubmit} className="card">
        {error && (
          <p className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">{error}</p>
        )}
        
        {message && (
          <p className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">{message}</p>
        )}
        
        <div className="mb-4">
          <label className="block mb-2">E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2">Şifre Tekrar</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : 'Üye Ol'}
        </button>
      </form>
      
      <p className="mt-6 text-center">
        Zaten hesabınız var mı?{' '}
        <Link href="/auth/login" className="text-cyan-500 hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}
