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
        {(change !== 0 || value > 0) && (
          <div className="flex items-center mt-1">
            <span className={`text-xs font-medium ${
              changeType === 'good' ? 'text-green-500 dark:text-green-400' :
              changeType === 'bad' ? 'text-red-500 dark:text-red-400' : 
              'text-slate-500 dark:text-slate-400'
            }`}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">bu hafta</span>
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
  const { user, loading: authLoading, profile } = useAuth();
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({ 
    notes: 0, 
    goals: 0, 
    completed: 0, 
    notesChange: 0,
    goalsChange: 0, 
    completedChange: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoaded, setChartLoaded] = useState(false);
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);
  // Bu değişken hata almamak için eklendi
  const notesAndGoalsCount = stats.notes + stats.goals;
  // Artık global router değişimlerini kullanacağız
  const { isNavigating } = useRouterChange();
  // Grafik türü seçimi
  const [selectedDataType, setSelectedDataType] = useState("notes");
  // Son 6 haftalık veriler (mock veri - fetch sırasında doldurulacak)
  const [timelineData, setTimelineData] = useState({
    notes: [],
    goals: [],
    completed: []
  });
  
  // Kullanıcı adını dinamik bir şekilde profil bilgilerinden almak için getUserDisplayName fonksiyonunu düzenleyeceğim
  const getUserDisplayName = () => {
    if (!user) return "Ziyaretçi";
    
    // Profil bilgilerinden isim al, yoksa kullanıcı adını kullan
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    // Profil tablosundan isim al (eğer fetchUserData fonksiyonunda profile verisi alındıysa)
    if (profile?.display_name) {
      return profile.display_name;
    }
    
    // Email'i @ işaretine kadar göster
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return "Kullanıcı";
  };

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
        
        // Şu anki tarih
        const now = new Date();
        // Bir hafta öncesi
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        
        // Bu haftaki notları say
        const { data: currentNotesCount, error: currentNotesError } = await supabase
          .from('notes')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        // Geçen haftaki notları say
        const { data: previousNotesCount, error: previousNotesError } = await supabase
          .from('notes')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .lt('created_at', oneWeekAgo.toISOString());
          
        // Bu haftaki hedefleri say
        const { data: currentGoalsCount, error: currentGoalsError } = await supabase
          .from('goals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        // Geçen haftaki hedefleri say
        const { data: previousGoalsCount, error: previousGoalsError } = await supabase
          .from('goals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .lt('created_at', oneWeekAgo.toISOString());
          
        // Bu haftaki tamamlanan hedefleri say
        const { data: currentCompletedGoals, error: currentCompletedError } = await supabase
          .from('goals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'completed');
          
        // Geçen haftaki tamamlanan hedefleri say
        const { data: previousCompletedGoals, error: previousCompletedError } = await supabase
          .from('goals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .lt('created_at', oneWeekAgo.toISOString());
          
        if (currentNotesError || previousNotesError || currentGoalsError || 
            previousGoalsError || currentCompletedError || previousCompletedError) {
          throw new Error('İstatistikler alınırken hata oluştu');
        }
        
        // Değişim yüzdesi hesaplama fonksiyonu
        const calculatePercentChange = (current, previous) => {
          const currentValue = current?.length || 0;
          const previousValue = previous?.length || 0;
          
          // Eğer önceki değer 0 ise ve şimdiki değer varsa, artış yüzdesi şimdiki değerin kendisi * 100 olur
          // Örneğin 0'dan 2'ye çıktıysa %200 artış gösterilmeli
          if (previousValue === 0 && currentValue > 0) {
            return currentValue * 100;
          } 
          // Eğer önceki değer 0 ise ve şimdiki değer de 0 ise değişim yok
          else if (previousValue === 0) {
            return 0;
          }
          
          // Normal yüzde hesaplama
          return Math.round(((currentValue - previousValue) / previousValue) * 100);
        };
        
        // Not değişim yüzdesi
        const notesChange = calculatePercentChange(currentNotesCount, previousNotesCount);
        
        // Hedef değişim yüzdesi
        const goalsChange = calculatePercentChange(currentGoalsCount, previousGoalsCount);
        
        // Tamamlanan hedef değişim yüzdesi
        const completedChange = calculatePercentChange(currentCompletedGoals, previousCompletedGoals);
        
        setStats({
          notes: currentNotesCount?.length || 0,
          goals: currentGoalsCount?.length || 0,
          completed: currentCompletedGoals?.length || 0,
          notesChange,
          goalsChange,
          completedChange
        });
        
        // Zaman içindeki verileri simüle ediyoruz
        // Gerçek uygulamada burada son 6 haftalık veriler için
        // belirli zaman dilimlerine göre ayrı sorgular yapılmalıdır
        const generateTimelineData = () => {
          // Başlangıç değerleri
          let notesBase = previousNotesCount?.length || 0;
          let goalsBase = previousGoalsCount?.length || 0;
          let completedBase = previousCompletedGoals?.length || 0;
          
          // Son 6 hafta için haftalık veri noktaları oluştur
          // Bu örnek uygulama için simüle edilmiş veriler
          const weeks = [];
          const notesData = [];
          const goalsData = [];
          const completedData = [];
          
          for (let i = 0; i < 6; i++) {
            const weekDate = new Date();
            weekDate.setDate(weekDate.getDate() - (6 - i) * 7);
            weeks.push(`${weekDate.getDate()}/${weekDate.getMonth() + 1}`);
            
            // i=5 olduğunda güncel haftadayız, gerçek değerleri kullan
            if (i === 5) {
              notesData.push(currentNotesCount?.length || 0);
              goalsData.push(currentGoalsCount?.length || 0);
              completedData.push(currentCompletedGoals?.length || 0);
            } else {
              // Önceki haftalar için değerleri hesapla (simülasyon)
              // Gerçek uygulamada her hafta için ayrı sorgu yapılmalı
              const growthFactor = 1 + (Math.random() * 0.5 - 0.1); // %40 arasında rassal artış/azalış
              notesBase = Math.round(notesBase * growthFactor);
              goalsBase = Math.round(goalsBase * growthFactor);
              completedBase = Math.round(completedBase * growthFactor);
              
              notesData.push(Math.max(0, notesBase));
              goalsData.push(Math.max(0, goalsBase));
              completedData.push(Math.max(0, completedBase));
            }
          }
          
          return {
            labels: weeks,
            notes: notesData,
            goals: goalsData,
            completed: completedData
          };
        };
        
        const timelineDataResult = generateTimelineData();
        setTimelineData({
          labels: timelineDataResult.labels,
          notes: timelineDataResult.notes,
          goals: timelineDataResult.goals,
          completed: timelineDataResult.completed
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

  // Chart ile ilgili işlemler için ayrı useEffect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Chart.js CDN'den yükle
    const loadChartJS = () => {
      if (window.Chart) {
        console.log('Chart.js zaten yüklü, grafik oluşturuluyor...');
        createChart();
        return;
      }

      console.log('Chart.js CDN yükleniyor...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      script.async = true;
      script.onload = () => {
        console.log('Chart.js CDN başarıyla yüklendi');
        setChartLoaded(true);
        createChart();
      };
      script.onerror = (err) => {
        console.error('Chart.js yüklenirken hata oluştu:', err);
      };
      document.body.appendChild(script);
    };

    // Chart oluştur
    const createChart = () => {
      if (!chartRef.current || !window.Chart) return;
      
      // Veri kontrolü
      if (!timelineData.notes || timelineData.notes.length === 0) {
        console.log('Grafik için veri bulunamadı');
        return;
      }
      
      try {
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) {
          console.error('Canvas context alınamadı');
          return;
        }
        
        // Önceki grafiği temizle
        if (chartRef.current.chart) {
          chartRef.current.chart.destroy();
        }
        
        // Veri tipine göre gösterilecek veriyi seç
        let dataToShow = [];
        let color = "";
        let label = "";
        
        switch(selectedDataType) {
          case "notes":
            dataToShow = timelineData.notes;
            color = "#f97316"; // Orange-500
            label = "Notlar";
            break;
          case "goals":
            dataToShow = timelineData.goals;
            color = "#fb923c"; // Orange-400
            label = "Hedefler";
            break;
          case "completed":
            dataToShow = timelineData.completed;
            color = "#fdba74"; // Orange-300
            label = "Tamamlanan";
            break;
          default:
            dataToShow = timelineData.notes;
            color = "#f97316";
            label = "Notlar";
        }
        
        // Line chart oluştur
        chartRef.current.chart = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: timelineData.labels || [],
            datasets: [{
              label: label,
              data: dataToShow,
              fill: {
                target: 'origin',
                above: color + "20" // %12 opaklık
              },
              borderColor: color,
              borderWidth: 2,
              pointBackgroundColor: color,
              pointBorderColor: "#fff",
              pointBorderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3, // Eğri yumuşaklığı
              cubicInterpolationMode: 'monotone'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1000,
              easing: 'easeOutQuart'
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: {
                    size: 11
                  }
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                  borderDash: [3, 3]
                },
                ticks: {
                  precision: 0,
                  font: {
                    size: 11
                  }
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                  size: 13
                },
                bodyFont: {
                  size: 12
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                  label: function(context) {
                    return `${label}: ${context.raw}`;
                  }
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }
        });

      } catch (err) {
        console.error('Grafik oluşturulurken hata:', err);
      }
    };

    // Sayfa yüklendikten sonra Chart.js'i yükle
    // Hata çözümü: timelineData.labels güvenli erişim için kontrol eklendi
    if (!isNavigating && timelineData?.labels && timelineData.labels.length > 0) {
      const timer = setTimeout(() => {
        loadChartJS();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [timelineData, selectedDataType, isNavigating, chartLoaded]);

  // Veri tipi değiştirme işleyicisi
  const handleDataTypeChange = (type) => {
    setSelectedDataType(type);
  };

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
      {/* Chart.js CDN'den yükle */}
      
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">
          Hoş geldin, <span className="text-orange-500 font-bold">{getUserDisplayName()}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Bugün nasıl bir ilerleme kaydetmek istersin?
        </p>
      </div>

      {loading || authLoading || isNavigating ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard 
              title="Toplam Not" 
              value={stats.notes}
              change={stats.notesChange}
              changeType={stats.notesChange >= 0 ? 'good' : 'bad'}
              icon={<DocumentTextIcon className="h-6 w-6" />}
            />
            <StatCard 
              title="Toplam Hedef" 
              value={stats.goals}
              change={stats.goalsChange}
              changeType={stats.goalsChange >= 0 ? 'good' : 'bad'}
              icon={<FlagIcon className="h-6 w-6" />}
            />
            <StatCard 
              title="Tamamlanan Hedefler" 
              value={stats.completed}
              change={stats.completedChange}
              changeType={stats.completedChange >= 0 ? 'good' : 'bad'}
              icon={<CheckCircleIcon className="h-6 w-6" />}
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
              
              {timelineData.labels.length > 0 ? (
                <>
                  <div 
                    ref={chartContainerRef}
                    className="h-64 md:h-60 relative w-full mb-4"
                  >
                    <canvas 
                      ref={chartRef} 
                      id="statsChart"
                      style={{ 
                        touchAction: 'none', 
                        minHeight: '200px',
                        maxWidth: '100%', 
                        width: '100%', 
                        height: '100%', 
                        display: 'block' 
                      }}
                    ></canvas>
                  </div>
                  
                  <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 pt-2 px-1">
                    <button 
                      onClick={() => handleDataTypeChange("notes")}
                      className={`flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 rounded transition ${
                        selectedDataType === "notes" 
                          ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                      <span>Notlar</span>
                    </button>
                    
                    <button 
                      onClick={() => handleDataTypeChange("goals")}
                      className={`flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 rounded transition ${
                        selectedDataType === "goals" 
                          ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-400 flex-shrink-0"></span>
                      <span>Hedefler</span>
                    </button>
                    
                    <button 
                      onClick={() => handleDataTypeChange("completed")}
                      className={`flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 rounded transition ${
                        selectedDataType === "completed" 
                          ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-300 flex-shrink-0"></span>
                      <span>Tamamlanan</span>
                    </button>
                  </div>
                </>
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
