'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getNotificationsFromStorage } from '../../lib/notifications';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Bildirimleri kontrol et
    const checkNotifications = () => {
      if (typeof window !== 'undefined' && user) {
        const userNotifications = getNotificationsFromStorage();
        setNotifications(userNotifications);
      }
    };
    
    checkNotifications();
    
    // 1 dakikada bir bildirimleri güncelle
    const notificationInterval = setInterval(checkNotifications, 60000);
    
    // Ekran boyutunu kontrol et
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Sayfa kaydırma durumunu kontrol et
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    // İlk yükleme durumunda kontrolü yap
    checkMobile();
    
    // Event listener'ları ekle
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMobile);
    
    // Menü dışında tıklama ile menüyü kapatma
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(notificationInterval);
    };
  }, [user]);

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
      : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'}
  `;

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className={navbarClasses} ref={menuRef}>
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
          <Link href="/features" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Özellikler
          </Link>
          <Link href="/help" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Yardım
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
              {/* Bildirim Butonu */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  aria-label="Bildirimleri göster"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Bildirim Listesi */}
                {showNotifications && (
                  <div className="absolute right-0 mt-1 w-80 max-h-96 overflow-y-auto rounded-md shadow-lg py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-slate-800">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-slate-800 dark:text-slate-200">Bildirimler</h3>
                        <Link 
                          href="/notifications" 
                          className="text-xs text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400"
                          onClick={() => setShowNotifications(false)}
                        >
                          Tümünü Gör
                        </Link>
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        Henüz bildirim yok
                      </div>
                    ) : (
                      <div>
                        {notifications.slice(0, 5).map((notification) => (
                          <Link 
                            key={notification.id} 
                            href={notification.data?.url || '/notifications'}
                            className={`block p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notification.read ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}
                            onClick={() => setShowNotifications(false)}
                          >
                            <div className="flex gap-3 items-start">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                notification.priority === 'high' 
                                  ? 'bg-red-100 dark:bg-red-900/20 text-red-500' 
                                  : notification.priority === 'medium'
                                  ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-500'
                                  : 'bg-blue-100 dark:bg-blue-900/20 text-blue-500'
                              }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{notification.title}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(notification.timestamp).toLocaleDateString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        {notifications.length > 5 && (
                          <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                            <Link 
                              href="/notifications" 
                              className="text-sm text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400"
                              onClick={() => setShowNotifications(false)}
                            >
                              {notifications.length - 5} adet daha bildirim
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 py-2 px-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{user.user_metadata?.full_name || user.email?.split('@')[0] || "Ahmet"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    Profil
                  </Link>
                  <Link href="/notifications" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    Bildirimler
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
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
            aria-expanded={isMenuOpen}
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

      {/* Mobile Menu - Improved animation and accessibility */}
      <div
        className={`
          md:hidden fixed top-[61px] left-0 right-0 h-[calc(100vh-61px)] bg-white dark:bg-slate-900
          shadow-md overflow-auto transition-all duration-300 ease-in-out z-50
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-hidden={!isMenuOpen}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
            <div className="py-2">
              <Link href="/dashboard" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link href="/notes" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notlar
              </Link>
              <Link href="/goals" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hedefler
              </Link>
              <Link href="/groups" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Gruplar
              </Link>
              <Link href="/features" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Özellikler
              </Link>
              <Link href="/help" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Yardım
              </Link>
            </div>

            <div className="py-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 py-3 px-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg my-2">
                    <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{user.user_metadata?.full_name || user.email?.split('@')[0] || "Ahmet"}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-sm truncate">{user.email}</span>
                    </div>
                  </div>
                  <Link href="/profile" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profil
                  </Link>
                  <Link href="/settings" className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400" onClick={closeMenu}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ayarlar
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center py-3 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400"
                    onClick={closeMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:shadow-md transition-shadow"
                    onClick={closeMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
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
