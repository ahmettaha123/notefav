'use client';

import { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  
  // Şifre gücü değerlendirmesi
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  useEffect(() => {
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
  }, []);
  
  // Şifre gücünü değerlendir
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    // Uzunluk kontrolü
    if (password.length >= 8) strength += 1;
    
    // Büyük harf kontrolü
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Küçük harf kontrolü
    if (/[a-z]/.test(password)) strength += 1;
    
    // Sayı kontrolü
    if (/[0-9]/.test(password)) strength += 1;
    
    // Özel karakter kontrolü
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthText = () => {
    if (!password) return '';
    if (passwordStrength <= 2) return 'Zayıf';
    if (passwordStrength <= 3) return 'Orta';
    if (passwordStrength <= 4) return 'İyi';
    return 'Güçlü';
  };
  
  const getStrengthColor = () => {
    if (!password) return 'bg-gray-200 dark:bg-gray-700';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

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
    
    try {
    const result = await signUp(email, password);
    if (result.success) {
      setMessage('Kayıt başarılı! E-posta adresinizi kontrol edin.');
        // İsteğe bağlı olarak formu sıfırla
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    } else {
      setError(result.error);
    }
    } catch (err) {
      setError('Kayıt sırasında beklenmeyen bir hata oluştu.');
      console.error(err);
    } finally {
    setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Üye Ol</h1>
      
      <form onSubmit={handleSubmit} className="card p-4 sm:p-6 rounded-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">{message}</p>
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
        
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
            placeholder="••••••••"
            autoComplete="new-password"
          />
          
          {password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Şifre gücü: {getStrengthText()}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{passwordStrength}/5</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Güçlü bir şifre için en az 8 karakter, büyük/küçük harf, sayı ve özel karakter kullanın.
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Şifre Tekrar</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
              confirmPassword && password !== confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            required
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Şifreler eşleşmiyor</p>
          )}
        </div>
        
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
              Kaydediliyor...
            </div>
          ) : 'Üye Ol'}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm sm:text-base">
        Zaten hesabınız var mı?{' '}
        <Link href="/auth/login" className="text-cyan-500 hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}
