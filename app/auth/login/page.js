'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  // Mobil cihazları tespit etmek için
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Eğer kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
    if (user) {
      router.push('/dashboard');
    }
    
    // Ekran genişliğini kontrol et
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // İlk yükleme için kontrol et
    checkMobile();
    
    // Pencere boyutu değiştiğinde kontrol et
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Giriş yapılırken beklenmeyen bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Giriş Yap</h1>
      
      <form onSubmit={handleSubmit} className="card p-4 sm:p-6 rounded-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
            placeholder="ornek@email.com"
            autoComplete="email"
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <div className="mt-2 text-right text-sm">
            <Link href="/auth/reset-password" className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
              Şifremi unuttum
            </Link>
          </div>
        </div>
        
        <div className="space-y-4">
          <button 
            type="submit" 
            className="btn-primary w-full py-2.5"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Giriş yapılıyor...
              </div>
            ) : 'Giriş Yap'}
          </button>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Güvenliğiniz için oturumunuz otomatik olarak açık tutulacaktır
          </p>
        </div>
      </form>
      
      <p className="mt-6 text-center text-sm sm:text-base">
        Hesabınız yok mu?{' '}
        <Link href="/auth/signup" className="text-cyan-500 hover:underline">
          Üye Ol
        </Link>
      </p>
    </div>
  );
}
