'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';

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

export default function EditGroup({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Önce kullanıcının bu grupta lider olup olmadığını kontrol et
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (memberError) throw memberError;
        
        if (!memberData || memberData.role !== 'leader') {
          router.push(`/groups/${id}`);
          return;
        }
        
        setIsLeader(true);
        
        // Grup bilgilerini çek
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        setName(data.name);
        setDescription(data.description || '');
        setColor(data.color || '#3b82f6');
        
      } catch (error) {
        console.error('Grup verisi çekilirken hata:', error);
        setError('Grup verisi yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [id, user, router]);

  const handleSaveGroup = async () => {
    if (!name.trim()) {
      setError('Grup adı gereklidir.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const updates = {
        name: name.trim(),
        description: description.trim(),
        color,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
      
      // Grup aktivitesine kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'update_group',
        entity_type: 'group',
        entity_id: id,
        details: { group_name: name }
      });
      
      router.push(`/groups/${id}`);
      
    } catch (error) {
      console.error('Grup güncellenirken hata oluştu:', error);
      setError(`Grup güncellenemedi: ${error.message}`);
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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

  if (!isLeader) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Yetkisiz Erişim</h1>
        <p className="mb-6">Sadece grup liderleri grubu düzenleyebilir.</p>
        <Link href={`/groups/${id}`} className="btn-primary">
          Gruba Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Grubu Düzenle</h1>
        <div className="flex gap-2">
          <Link 
            href={`/groups/${id}`} 
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            İptal
          </Link>
          <button 
            onClick={handleSaveGroup}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div className="card">
        <div className="space-y-6">
          {/* Grup Adı */}
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
            />
          </div>
          
          {/* Grup Açıklaması */}
          <div>
            <label htmlFor="description" className="block mb-2 font-medium">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Grubunuzun amacını açıklayın..."
            ></textarea>
          </div>
          
          {/* Grup Rengi */}
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
        </div>
      </div>
    </div>
  );
}
