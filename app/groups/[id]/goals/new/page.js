'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';
import { FaArrowLeft, FaSave, FaTimes, FaExclamationTriangle, FaCalendarAlt, FaFlag, FaBullseye } from 'react-icons/fa';

export default function NewGroupGoal() {
  const { id: groupId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [group, setGroup] = useState(null);
  
  useEffect(() => {
    async function checkPermission() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Grup bilgilerini al
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
          
        if (groupError) {
          console.error("Grup bilgileri alınamadı:", groupError);
          setError("Grup bulunamadı");
          return;
        }
        
        setGroup(groupData);
        
        // Kullanıcının rolünü kontrol et
        const { data: roleData, error: roleError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();
          
        if (roleError) {
          console.error("Kullanıcı rolü alınamadı:", roleError);
          setError("Bu gruba erişim izniniz yok");
          return;
        }
        
        setUserRole(roleData.role);
        
        // Sadece lider hedef ekleyebilir
        if (roleData.role !== 'leader') {
          setError("Bu işlem için yetkiniz bulunmuyor");
          return;
        }
        
      } catch (error) {
        console.error("İzin kontrolü yapılırken hata:", error);
        setError("Bir hata oluştu: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkPermission();
  }, [user, groupId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Lütfen bir başlık girin');
      return;
    }
    
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('group_goals')
        .insert({
          group_id: groupId,
          title: title.trim(),
          description: description.trim(),
          priority,
          due_date: dueDate || null,
          creator_id: user.id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Grup aktivitesi ekle
      await supabase.from('group_activity').insert({
        group_id: groupId,
        user_id: user.id,
        action: 'create_goal',
        entity_type: 'goal',
        entity_id: data.id,
        details: { goal_title: title },
        created_at: new Date().toISOString()
      });
      
      // Başarıyla oluşturuldu, hedefler sayfasına geri dön
      router.push(`/groups/${groupId}/goals`);
      
    } catch (error) {
      console.error('Hedef kaydedilirken hata:', error);
      alert(`Hedef kaydedilemedi: ${error.message}`);
      setSaving(false);
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-blue-200 dark:bg-blue-700 h-16 w-16 mb-4 flex items-center justify-center">
            <FaBullseye className="text-blue-500 dark:text-blue-300 text-2xl animate-ping opacity-75" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-3"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-8 text-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link 
              href={`/groups/${groupId}/goals`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Hedefler Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center">
          <Link 
            href={`/groups/${groupId}/goals`}
            className="mr-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-xl text-white font-bold">Yeni Hedef Ekle</h1>
            <p className="text-blue-100 text-sm">{group?.name} grubuna yeni bir hedef ekleyin</p>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="title">
                Başlık <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Hedefin başlığını girin..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="description">
                Açıklama
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[120px]"
                placeholder="Hedefin detaylarını açıklayın..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="priority">
                  <div className="flex items-center gap-2">
                    <FaFlag className="text-gray-500" />
                    <span>Öncelik</span>
                  </div>
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="appearance-none w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="dueDate">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-500" />
                    <span>Bitiş Tarihi</span>
                  </div>
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
              <Link
                href={`/groups/${groupId}/goals`}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2 transition-colors"
              >
                <FaTimes className="text-red-500" /> <span>İptal</span>
              </Link>
              
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md"
                disabled={saving}
              >
                <FaSave /> <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 