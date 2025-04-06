'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
    
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const navbarClasses = `
    sticky top-0 z-50 w-full
    transition-all duration-300 px-4 py-3
    ${isScrolled 
      ? 'bg-white dark:bg-slate-900 shadow-md'
      : 'bg-transparent'}
  `;

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={closeMenu}>
          <span className="font-bold text-2xl relative">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Note</span>
            <span className="text-slate-800 dark:text-white">Fav</span>
            <span className="absolute -top-2 -right-3 bg-orange-500 text-white text-xs px-1 rounded-full">Beta</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Dashboard
          </Link>
          <Link href="/notes" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Notlar
          </Link>
          <Link href="/goals" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Hedefler
          </Link>
          <Link href="/groups" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Gruplar
          </Link>
        </div>

        {/* Right Section (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isMounted && theme === 'dark' ? 'Açık moda geç' : 'Karanlık moda geç'}
          >
            {isMounted && theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <div className="relative group">
                <button className="flex items-center gap-2 py-2 px-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{user.email?.split('@')[0]}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    Profil
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    Ayarlar
                  </Link>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="py-2 px-4 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/signup"
                className="py-2 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:shadow-md transition-shadow"
              >
                Kaydol
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isMounted && theme === 'dark' ? 'Açık moda geç' : 'Karanlık moda geç'}
          >
            {isMounted && theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`
          md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900
          shadow-md overflow-hidden transition-all duration-300
          ${isMenuOpen ? 'max-h-96 border-b border-gray-200 dark:border-gray-700' : 'max-h-0'}
        `}
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
            <div className="py-2">
              <Link href="/dashboard" className="block py-2 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                Dashboard
              </Link>
              <Link href="/notes" className="block py-2 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                Notlar
              </Link>
              <Link href="/goals" className="block py-2 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                Hedefler
              </Link>
              <Link href="/groups" className="block py-2 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                Gruplar
              </Link>
            </div>

            <div className="py-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">{user.email}</span>
                  </div>
                  <Link href="/profile" className="block py-2 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                    Profil
                  </Link>
                  <Link href="/settings" className="block py-2 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                    Ayarlar
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left block py-2 text-red-600 dark:text-red-400"
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block py-2 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400"
                    onClick={closeMenu}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block py-2 text-orange-500 dark:text-orange-400 font-medium"
                    onClick={closeMenu}
                  >
                    Kaydol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
