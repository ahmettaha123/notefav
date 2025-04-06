'use client';

import { createContext, useContext, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Yükleme ekranı komponenti
const LoadingOverlay = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl flex flex-col items-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 dark:border-orange-900 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-800 dark:text-slate-200 font-medium">Yükleniyor...</p>
      </div>
    </div>
  );
};

// Router değişimlerini yönetmek için context
const RouterChangeContext = createContext({
  isNavigating: false
});

function RouterChangeContent({ children }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sayfa değişimlerinde isNavigating'i true yap
  useEffect(() => {
    setIsNavigating(true);
    
    // Sayfa yüklendikten 300ms sonra loading durumunu kapat
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <RouterChangeContext.Provider value={{ isNavigating }}>
      <LoadingOverlay show={isNavigating} />
      {children}
    </RouterChangeContext.Provider>
  );
}

export function RouterChangeProvider({ children }) {
  return (
    <Suspense fallback={null}>
      <RouterChangeContent>
        {children}
      </RouterChangeContent>
    </Suspense>
  );
}

export const useRouterChange = () => {
  return useContext(RouterChangeContext);
}; 