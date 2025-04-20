'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import { useRouterChange } from '../../context/RouterChangeProvider';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon, FlagIcon, CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// LoadingOverlay artık global olarak kullanılacak, bu nedenle kaldırıyoruz
// Ancak sayfaya özel loading durumları için basit bir spinner ekleyelim
const Spinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="relative w-12 h-12">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 dark:border-orange-800 rounded-full animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

// İstatistik kartı bileşeni
const StatCard = ({ title, value, change, changeType, icon }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800">
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value || 0}</p>
        {change && (
          <div className="flex items-center mt-1">
            <span className={`text-xs font-medium ${
              changeType === 'good' ? 'text-green-500 dark:text-green-400' :
              changeType === 'bad' ? 'text-red-500 dark:text-red-400' : 
              'text-slate-500 dark:text-slate-400'
            }`}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">bu ay</span>
          </div>
        )}
      </div>
      <div className="rounded-full p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white">
        {icon}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({ notes: 0, goals: 0, completed: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  // Bu değişken hata almamak için eklendi
  const notesAndGoalsCount = stats.notes + stats.goals;
  // Artık global router değişimlerini kullanacağız
  const { isNavigating } = useRouterChange();

  // Eski sayfa geçişi efekti artık gerekli değil
  // useEffect(() => {
  //   // Sayfa geçişlerini dinle
  //   ...
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Notları çek
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (notesError) throw notesError;
        setNotes(notesData || []);
        
        // Hedefleri çek
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (goalsError) throw goalsError;
        setGoals(goalsData || []);
        
        // İstatistikleri çek
        const { data: notesCount, error: notesCountError } = await supabase
          .from('notes')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        const { data: goalsCount, error: goalsCountError } = await supabase
          .from('goals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        const { data: completedGoals, error: completedGoalsError } = await supabase
          .from('goals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'completed');
          
        if (notesCountError || goalsCountError || completedGoalsError) {
          throw new Error('İstatistikler alınırken hata oluştu');
        }
        
        setStats({
          notes: notesCount?.length || 0,
          goals: goalsCount?.length || 0,
          completed: completedGoals?.length || 0,
          favoritedNotes: 0 // Favori not sayısı için varsayılan değer
        });
        
        // Kullanıcının üye olduğu grupları al
        const { data: userGroups, error: groupsError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
          
        if (groupsError) throw groupsError;
        
        // Grup ID'leri
        const groupIds = userGroups?.map(g => g.group_id) || [];
        
        // Son aktiviteleri çek (notlar, hedefler ve grup notları)
        const recentNotesQuery = supabase
          .from('notes')
          .select('id, title, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);
          
        const recentGoalsQuery = supabase
          .from('goals')
          .select('id, title, created_at, updated_at, status')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);
          
        // Grup notlarını da çek (eğer kullanıcı gruplara üyeyse)
        let groupNotesResult = { data: [] };
        if (groupIds.length > 0) {
          groupNotesResult = await supabase
            .from('group_notes')
            .select(`
              id, title, created_at, updated_at,
              group_id, 
              groups (name),
              profiles (username, full_name)
            `)
            .in('group_id', groupIds)
            .order('updated_at', { ascending: false })
            .limit(5);
        }
          
        const [notesResult, goalsResult] = await Promise.all([
          recentNotesQuery,
          recentGoalsQuery
        ]);
        
        const combinedActivity = [
          ...(notesResult.data || []).map(note => ({
            ...note,
            type: 'note'
          })),
          ...(goalsResult.data || []).map(goal => ({
            ...goal,
            type: 'goal'
          })),
          ...(groupNotesResult.data || []).map(groupNote => ({
            ...groupNote,
            type: 'group_note',
            title: `${groupNote.title || 'İsimsiz Not'} (${groupNote.groups?.name || 'Grup'})`,
            group_name: groupNote.groups?.name
          }))
        ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5);
        
        setRecentActivity(combinedActivity);
        
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Chart için useEffect
  useEffect(() => {
    if (chartRef.current && notesAndGoalsCount > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      // Önceki chart'ı temizle
      if (chartRef.current.chart) {
        chartRef.current.chart.destroy();
      }
      
      // Yeni chart oluştur
      import('chart.js').then(({ Chart, registerables }) => {
        Chart.register(...registerables);
        
        const newChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Notlar', 'Hedefler', 'Tamamlanan Hedefler'],
            datasets: [{
              data: [stats.notes, stats.goals - stats.completed, stats.completed],
              backgroundColor: [
                '#f97316', // orange-500
                '#4f46e5', // indigo-600 
                '#10b981', // emerald-500
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569'
                }
              },
              tooltip: {
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                titleColor: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#0f172a',
                bodyColor: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569',
                borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                usePointStyle: true
              }
            }
          }
        });
        
        // Chart referansını kaydet
        chartRef.current.chart = newChart;
      });
    }
  }, [stats, notesAndGoalsCount, chartRef.current]);

  if (authLoading) {
    return <Spinner />;
  }
  
  if (!user) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="h-20 w-20 bg-orange-100 dark:bg-orange-900/30 mx-auto rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-slate-800 dark:text-slate-200">Giriş yapmalısınız</h1>
        <p className="mb-8 text-slate-600 dark:text-slate-400">
          NoteFav'un tüm özelliklerinden yararlanmak için giriş yapmanız gerekmektedir.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login" className="btn-primary">
            Giriş Yap
          </Link>
          <Link href="/auth/signup" className="btn-secondary">
            Hesap Oluştur
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Hoş Geldin, <span className="text-orange-500">{user?.user_metadata?.full_name || 'Ahmet'}</span></h1>
        <p className="text-slate-500 dark:text-slate-400">İşte bugün neler olup bitiyor:</p>
      </div>

      {loading || authLoading || isNavigating ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Toplam Not" 
              value={stats.notes}
              change={15}
              changeType="good"
              icon={<DocumentTextIcon className="h-6 w-6" />}
            />
            <StatCard 
              title="Toplam Hedef" 
              value={stats.goals}
              change={5}
              changeType="good"
              icon={<FlagIcon className="h-6 w-6" />}
            />
            <StatCard 
              title="Tamamlanan Hedefler" 
              value={stats.completed}
              change={10}
              changeType="good"
              icon={<CheckCircleIcon className="h-6 w-6" />}
            />
            <StatCard 
              title="Favori Notlar" 
              value={stats.favoritedNotes}
              change={0}
              changeType="neutral"
              icon={<StarIcon className="h-6 w-6" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Son Aktiviteler</h2>
                <Link href="/dashboard/activity" className="text-sm font-medium text-orange-500 hover:text-orange-600 dark:hover:text-orange-400">
                  Tümünü Gör
                </Link>
              </div>
              
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">Henüz hiç aktivite yok.</p>
                  <p className="text-slate-500 dark:text-slate-400">Not veya hedef ekleyin!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={`${activity.type}-${activity.id}`} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 ${
                          activity.type === 'note' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-500' :
                          activity.type === 'goal' ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-500' :
                          'bg-green-100 dark:bg-green-900/20 text-green-500'
                        }`}>
                          {activity.type === 'note' && <DocumentTextIcon className="h-5 w-5" />}
                          {activity.type === 'goal' && <FlagIcon className="h-5 w-5" />}
                          {activity.type === 'group_note' && <DocumentTextIcon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <Link 
                              href={
                                activity.type === 'note' ? `/notes/${activity.id}` :
                                activity.type === 'goal' ? `/goals/${activity.id}` :
                                activity.type === 'group_note' ? `/groups/${activity.group_id}/notes/${activity.id}` :
                                '#'
                              }
                              className="font-medium text-slate-800 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                            >
                              {activity.title || (activity.type === 'note' ? 'İsimsiz Not' : 'İsimsiz Hedef')}
                            </Link>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true, locale: tr })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {activity.type === 'note' ? 'Not güncellendi' : 
                             activity.type === 'goal' ? `Hedef ${activity.status === 'completed' ? 'tamamlandı' : 'güncellendi'}` :
                             `Grup notu eklendi: ${activity.group_name || 'Grup'}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">İstatistikler</h2>
              
              {notesAndGoalsCount > 0 ? (
                <div className="h-64 relative">
                  <canvas ref={chartRef}></canvas>
                </div>
              ) : (
                <div className="text-center py-8 h-64 flex flex-col justify-center">
                  <p className="text-slate-500 dark:text-slate-400">Henüz veri yok</p>
                  <p className="text-slate-500 dark:text-slate-400">Not veya hedef ekleyin!</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Son Notlar</h2>
                <div className="flex space-x-2">
                  <Link href="/notes" className="text-sm font-medium text-orange-500 hover:text-orange-600 dark:hover:text-orange-400">
                    Tümünü Gör
                  </Link>
                  <Link href="/notes/new" className="text-sm font-medium flex items-center text-green-500 hover:text-green-600 dark:hover:text-green-400">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Yeni
                  </Link>
                </div>
              </div>
              
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">Henüz not yok.</p>
                  <Link href="/notes/new" className="inline-flex items-center mt-2 text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    İlk notunu ekle
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <Link key={note.id} href={`/notes/${note.id}`} className="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-slate-800 dark:text-white">{note.title || 'İsimsiz Not'}</h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDistanceToNow(new Date(note.updated_at || note.created_at), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                      {note.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{note.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Son Hedefler</h2>
                <div className="flex space-x-2">
                  <Link href="/goals" className="text-sm font-medium text-orange-500 hover:text-orange-600 dark:hover:text-orange-400">
                    Tümünü Gör
                  </Link>
                  <Link href="/goals/new" className="text-sm font-medium flex items-center text-green-500 hover:text-green-600 dark:hover:text-green-400">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Yeni
                  </Link>
                </div>
              </div>
              
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">Henüz hedef yok.</p>
                  <Link href="/goals/new" className="inline-flex items-center mt-2 text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    İlk hedefini ekle
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <Link key={goal.id} href={`/goals/${goal.id}`} className="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            goal.status === 'completed' ? 'bg-green-500' :
                            goal.status === 'in_progress' ? 'bg-orange-500' :
                            'bg-slate-400 dark:bg-slate-600'
                          }`}></div>
                          <h3 className="font-medium text-slate-800 dark:text-white">{goal.title || 'İsimsiz Hedef'}</h3>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDistanceToNow(new Date(goal.due_date || goal.created_at), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-4 line-clamp-1">{goal.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
