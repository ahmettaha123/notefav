'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';

export default function NewGroupGoal() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('not_started');
  const [progress, setProgress] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchGroup() {
      setLoading(true);
      setError('');
      
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
        const { data: memberData, error: memberCheckError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (memberCheckError && memberCheckError.code !== 'PGRST116') {
          console.error("Üyelik kontrolü yapılamadı:", memberCheckError);
          throw new Error("Üyelik bilgileri yüklenemedi");
        }
        
        if (!memberData) {
          // Kullanıcı bu grupta üye değil, gruplar sayfasına yönlendir
          router.push('/groups');
          return;
        }
        
        // Varsayılan hedef tarihini 1 ay sonrası olarak ayarla
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 1);
        setTargetDate(defaultDate.toISOString().split('T')[0]);
        
      } catch (error) {
        console.error('Grup bilgileri yüklenirken hata:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroup();
  }, [id, user, router]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Hedef başlığı gereklidir');
      return;
    }
    
    if (!targetDate) {
      setError('Hedef tarihi gereklidir');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      // Yeni grup hedefi oluştur
      const { data: goalData, error: goalError } = await supabase
        .from('group_goals')
        .insert({
          group_id: id,
          title: title.trim(),
          description: description.trim(),
          status,
          progress,
          is_public: isPublic,
          target_date: targetDate,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (goalError) throw goalError;
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'create_goal',
        entity_type: 'goal',
        entity_id: goalData.id,
        details: { goal_title: title.trim() },
        created_at: new Date().toISOString()
      });
      
      // Hedefler sayfasına yönlendir
      router.push(`/groups/${id}/goals`);
      
    } catch (error) {
      console.error('Hedef oluşturulurken hata:', error);
      setError(`Hedef oluşturulamadı: ${error.message}`);
      setSaving(false);
    }
  };
  
  if (authLoading || loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }
  
  if (error && !saving) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href={`/groups/${id}/goals`}
            className="btn-primary"
          >
            Hedefler Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!group) return null;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center mb-6">
          <Link 
            href={`/groups/${id}/goals`}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
          >
            <FaArrowLeft /> <span>Hedeflere Geri Dön</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Yeni Grup Hedefi Oluştur</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block mb-2 font-medium">
              Hedef Başlığı <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Hedef başlığı girin..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block mb-2 font-medium">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Hedefin detaylı açıklaması..."
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block mb-2 font-medium">
                Durum
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="not_started">Başlanmadı</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="progress" className="block mb-2 font-medium">
                İlerleme (%)
              </label>
              <input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="targetDate" className="block mb-2 font-medium">
                Hedef Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div className="flex items-center h-full mt-8">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isPublic" className="cursor-pointer">
                Herkese Açık (Grup dışındaki kullanıcılar da görebilir)
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Link
              href={`/groups/${id}/goals`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FaTimes /> <span>İptal</span>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <FaSave /> <span>{saving ? 'Kaydediliyor...' : 'Hedefi Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 