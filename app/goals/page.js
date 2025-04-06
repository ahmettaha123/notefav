'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';

export default function Goals() {
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        let query = supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);
          
        if (filter === 'active') {
          query = query.lt('progress', 100);
        } else if (filter === 'completed') {
          query = query.eq('progress', 100);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        setGoals(data || []);
        
      } catch (error) {
        console.error('Hedefleri çekerken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoals();
  }, [user, filter]);

  const getStatusColor = (progress) => {
    if (progress === 100) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    if (progress >= 50) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
  };
  
  const getStatusText = (progress) => {
    if (progress === 100) return 'Tamamlandı';
    if (progress >= 50) return 'İyi gidiyor';
    return 'Devam ediyor';
  };
  
  if (authLoading) {
    return <div className="flex justify-center py-16"><p>Yükleniyor...</p></div>;
  }
  
  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Giriş yapmalısınız</h1>
        <p className="mb-6">Bu sayfayı görüntülemek için giriş yapmanız gerekmektedir.</p>
        <Link href="/auth/login" className="btn-primary">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hedeflerim</h1>
        <Link href="/goals/new" className="btn-primary">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Hedef
          </span>
        </Link>
      </div>
      
      <div className="flex mb-6 gap-2 md:gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all' 
              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md ${
            filter === 'active' 
              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          Devam Eden
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-md ${
            filter === 'completed' 
              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          Tamamlanan
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p>Hedefler yükleniyor...</p>
        </div>
      ) : goals.length > 0 ? (
        <div className="space-y-6">
          {goals.map((goal) => (
            <Link key={goal.id} href={`/goals/${goal.id}`}>
              <div className="card hover:shadow-lg transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">{goal.title}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(goal.progress || 0)}`}>
                    {getStatusText(goal.progress || 0)}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {goal.description?.substring(0, 150)}
                    {goal.description?.length > 150 ? '...' : ''}
                  </p>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>İlerleme</span>
                    <span>%{goal.progress || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-green-500 h-full" 
                      style={{ width: `${goal.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                  <div>
                    Hedef Tarihi: {new Date(goal.target_date).toLocaleDateString('tr-TR')}
                  </div>
                  <div>
                    {new Date(goal.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 card">
          <h2 className="text-xl mb-2">Henüz hedef oluşturmadınız</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            İlk hedefinizi oluşturmak için "Yeni Hedef" düğmesine tıklayın.
          </p>
          <Link href="/goals/new" className="btn-primary">
            İlk Hedefi Oluştur
          </Link>
        </div>
      )}
    </div>
  );
}
