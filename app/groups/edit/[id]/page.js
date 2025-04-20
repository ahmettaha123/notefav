'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';

// Grup renk seçenekleri
const colorOptions = [
  { name: 'Kırmızı', value: '#ef4444' },
  { name: 'Turuncu', value: '#f97316' },
  { name: 'Sarı', value: '#eab308' },
  { name: 'Yeşil', value: '#22c55e' },
  { name: 'Mavi', value: '#3b82f6' },
  { name: 'Mor', value: '#8b5cf6' },
  { name: 'Pembe', value: '#ec4899' },
];

export default function EditGroup() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchGroupData() {
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
        
        // Form alanlarını doldur
        setName(groupData.name || '');
        setDescription(groupData.description || '');
        setColor(groupData.color || '#3b82f6');
        
        // Kullanıcının bu grupta lider olup olmadığını kontrol et
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (memberError) {
          console.error("Üyelik kontrolü yapılamadı:", memberError);
          throw new Error("Üyelik bilgileri yüklenemedi");
        }
        
        // Kullanıcı lider değilse düzenleme yapamaz
        if (memberData.role !== 'leader') {
          setIsLeader(false);
          throw new Error("Bu grubu düzenlemek için lider olmalısınız.");
        }
        
        setIsLeader(true);
        
      } catch (error) {
        console.error('Grup verileri yüklenirken hata:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroupData();
  }, [id, user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Grup adı gereklidir.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Grubu güncelle
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          name: name.trim(),
          description: description.trim(),
          color,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'update_group',
        entity_type: 'group',
        entity_id: id,
        details: { group_name: name.trim() },
        created_at: new Date().toISOString()
      });
      
      // Başarılı güncellemeden sonra grup detay sayfasına yönlendir
      router.push(`/groups/${id}`);
      
    } catch (error) {
      console.error('Grup güncellenirken hata:', error);
      setError(`Grup güncellenemedi: ${error.message}`);
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
            className="flex items-center gap-2 text-orange-500 hover:text-orange-700"
          >
            <FaArrowLeft /> <span>Gruba Geri Dön</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Grubu Düzenle</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block mb-2 font-medium">
              Grup Adı <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Grubunuza bir isim verin..."
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
              rows={4}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Grubunuzun amacını açıklayın..."
            ></textarea>
          </div>
          
          <div>
            <label className="block mb-2 font-medium">
              Grup Rengi
            </label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map(option => (
                <button 
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={`w-8 h-8 rounded-full border-2 ${color === option.value ? 'border-black dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: option.value }}
                  title={option.name}
                ></button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Link
              href={`/groups/${id}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FaTimes /> <span>İptal</span>
            </Link>
            <button
              type="submit"
              disabled={saving || !isLeader}
              className="btn-primary flex items-center gap-2"
            >
              <FaSave /> <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 