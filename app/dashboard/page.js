'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import { useRouterChange } from '../../context/RouterChangeProvider';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

function DashboardInner() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({ notes: 0, goals: 0, completed: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isNavigating } = useRouterChange();
  const router = useRouter();
  const searchParams = useSearchParams();

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
          completed: completedGoals?.length || 0
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
    <div>
      {/* Önceden eklediğimiz LoadingOverlay artık burada gerekli değil */}
      {/* <LoadingOverlay show={isNavigating} /> */}
      
      {/* Karşılama Başlığı */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Merhaba, <span className="gradient-text">{user.email?.split('@')[0] || 'Kullanıcı'}</span>!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Notlarınızı yönetin, hedeflerinizi takip edin ve üretkenliğinizi artırın.
        </p>
      </div>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="card bg-gradient-primary-soft flex items-center">
          <div className="h-12 w-12 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Toplam Not</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : stats.notes}
            </p>
          </div>
        </div>
        
        <div className="card bg-gradient-primary-soft flex items-center">
          <div className="h-12 w-12 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Toplam Hedef</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : stats.goals}
            </p>
          </div>
        </div>
        
        <div className="card bg-gradient-primary-soft flex items-center">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Tamamlanan Hedef</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : stats.completed}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Son Aktiviteler */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Son Aktiviteler</h2>
              <Link href="/activity" className="text-sm text-orange-500 dark:text-orange-400 hover:underline">
                Tümünü Gör
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center border-b dark:border-gray-700 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full mr-3"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">Henüz aktivite bulunmamaktadır.</p>
                <div className="mt-4 flex justify-center gap-4">
                  <Link href="/notes/new" className="btn-primary">
                    Not Ekle
                  </Link>
                  <Link href="/goals/new" className="btn-secondary">
                    Hedef Ekle
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start border-b dark:border-gray-700 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mr-3">
                      {activity.type === 'note' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : activity.type === 'goal' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <Link 
                        href={`/${activity.type}s/${activity.id}`}
                        className="font-medium text-slate-800 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                      >
                        {activity.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(activity.updated_at).toLocaleDateString('tr-TR')}
                        </span>
                        {activity.type === 'goal' && activity.status && (
                          <span className={`badge ${
                            activity.status === 'completed' ? 'badge-success' : 
                            activity.status === 'in_progress' ? 'badge-primary' : 
                            'badge-secondary'
                          }`}>
                            {activity.status === 'completed' ? 'Tamamlandı' : 
                             activity.status === 'in_progress' ? 'Devam Ediyor' : 
                             'Planlandı'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Hızlı Erişim */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Hızlı Erişim</h2>
            
            <div className="space-y-4">
              <Link href="/notes/new" className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <div className="h-10 w-10 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">Yeni Not</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Fikirlerinizi hızlıca kaydedin</p>
                </div>
              </Link>
              
              <Link href="/goals/new" className="flex items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">Yeni Hedef</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Bir SMART hedef belirleyin</p>
                </div>
              </Link>
              
              <Link href="/groups" className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">Gruplar</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Ekibinizle çalışın</p>
                </div>
              </Link>
              
              <Link href="/profile" className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">Profil</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Hesabınızı yönetin</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <DashboardInner />
    </Suspense>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
