'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { FaArrowLeft, FaClock, FaExclamationTriangle, FaUser, FaEdit, FaTrash, FaPlus, FaCheck, FaUserPlus, FaUserMinus, FaUserCog } from 'react-icons/fa';

export default function GroupActivity() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchGroupAndActivities() {
      setLoading(true);
      setError(null);
      
      try {
        // Grup bilgilerini çek
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();
          
        if (groupError) {
          console.error("Grup bilgileri çekilemedi:", groupError);
          throw new Error("Grup bulunamadı");
        }
        
        setGroup(groupData);
        
        // Kullanıcının grup üyesi olup olmadığını kontrol et
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (memberError) {
          console.error("Üyelik kontrolü yapılamadı:", memberError);
          // Kullanıcı grupta değilse ana sayfaya yönlendir
          router.push('/groups');
          return;
        }
        
        // Grup aktivitelerini çek
        fetchActivities();
        
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        setError(error.message);
        setLoading(false);
      }
    }
    
    fetchGroupAndActivities();
  }, [id, user, router]);
  
  const fetchActivities = async () => {
    try {
      const { data, error, count } = await supabase
        .from('group_activity')
        .select(`
          *,
          user:profiles!group_activity_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
        
      if (error) {
        console.error("Aktiviteler çekilemedi:", error);
        throw error;
      }
      
      if (data.length < pageSize) {
        setHasMore(false);
      }
      
      // İlk sayfa ise aktiviteleri ayarla, değilse mevcut aktivitelere ekle
      if (page === 1) {
        setActivities(data || []);
      } else {
        setActivities(prev => [...prev, ...(data || [])]);
      }
      
    } catch (error) {
      console.error('Aktiviteler yüklenirken hata:', error);
      setError('Aktiviteler yüklenemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMore = () => {
    setPage(prev => prev + 1);
  };
  
  useEffect(() => {
    if (page > 1) {
      fetchActivities();
    }
  }, [page]);
  
  // Aktivite ikonlarını belirle
  const getActivityIcon = (action) => {
    switch (action) {
      case 'create_note':
        return <FaPlus className="text-green-500" />;
      case 'update_note':
        return <FaEdit className="text-blue-500" />;
      case 'delete_note':
        return <FaTrash className="text-red-500" />;
      case 'create_goal':
        return <FaPlus className="text-green-500" />;
      case 'update_goal':
        return <FaEdit className="text-blue-500" />;
      case 'update_goal_status':
        return <FaCheck className="text-blue-500" />;
      case 'delete_goal':
        return <FaTrash className="text-red-500" />;
      case 'member_added':
        return <FaUserPlus className="text-green-500" />;
      case 'member_removed':
        return <FaUserMinus className="text-red-500" />;
      case 'update_role':
        return <FaUserCog className="text-blue-500" />;
      case 'leader_changed':
        return <FaUserCog className="text-purple-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };
  
  // Aktivite metni oluştur
  const getActivityText = (activity) => {
    const userName = activity.user?.full_name || activity.user?.username || 'Bir kullanıcı';
    
    switch (activity.action) {
      case 'create_note':
        return `${userName} yeni bir not oluşturdu`;
      case 'update_note':
        return `${userName} bir notu güncelledi`;
      case 'delete_note':
        return `${userName} bir notu sildi`;
      case 'create_goal':
        return `${userName} "${activity.details?.goal_title || 'Bir hedef'}" adlı yeni bir hedef oluşturdu`;
      case 'update_goal':
        return `${userName} "${activity.details?.goal_title || 'Bir hedef'}" adlı hedefi güncelledi`;
      case 'update_goal_status':
        const newStatus = activity.details?.new_status;
        const statusText = newStatus === 'completed' ? 'tamamlandı olarak işaretledi' : 
                          newStatus === 'cancelled' ? 'iptal edildi olarak işaretledi' : 
                          'durumunu güncelledi';
        return `${userName} bir hedefi ${statusText}`;
      case 'delete_goal':
        return `${userName} "${activity.details?.goal_title || 'Bir hedef'}" adlı hedefi sildi`;
      case 'member_added':
        return `${userName}, ${activity.details?.member_username || 'bir kullanıcıyı'} gruba ekledi`;
      case 'member_removed':
        return `${userName}, ${activity.details?.member_username || 'bir kullanıcıyı'} gruptan çıkardı`;
      case 'update_role':
        const roleName = activity.details?.new_role === 'admin' ? 'yönetici' :
                        activity.details?.new_role === 'leader' ? 'lider' : 'üye';
        return `${userName}, ${activity.details?.member_username || 'bir kullanıcının'} rolünü ${roleName} olarak değiştirdi`;
      case 'leader_changed':
        return `${userName}, ${activity.details?.new_leader_username || 'bir kullanıcıya'} liderlik yetkisi verdi`;
      default:
        return `${userName} bir eylem gerçekleştirdi`;
    }
  };
  
  // Tarih formatlama
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (authLoading || loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center py-12">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href={`/groups/${id}`}
            className="btn-primary"
          >
            Grup Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center mb-6">
          <Link 
            href={`/groups/${id}`}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-4"
          >
            <FaArrowLeft className="inline" /> <span>Gruba Geri Dön</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-1">{group?.name} Aktiviteleri</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Gruptaki tüm etkinlikler</p>
        
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Bu grupta henüz aktivite bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="p-4 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getActivityIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-gray-800 dark:text-gray-200">
                      {getActivityText(activity)}
                    </p>
                    
                    <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaClock className="mr-1" /> 
                      <time dateTime={activity.created_at}>
                        {formatDate(activity.created_at)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center py-4">
                <button 
                  onClick={loadMore}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/30"
                >
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 