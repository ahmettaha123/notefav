'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';
import { Suspense } from 'react';

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

function CreateGroupFormContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const emailInputRef = useRef(null);
  const [skipMembers, setSkipMembers] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/groups/new');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Grup adı gereklidir.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // İlk olarak profil bilgilerinin olduğundan emin olalım
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // Profil yoksa oluşturalım
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0],
            full_name: user.email?.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Profil oluşturulurken hata:', insertError);
          setError('Profil oluşturulamadı: ' + insertError.message);
          setSaving(false);
          return;
        }
      } else if (profileError) {
        console.error('Profil kontrolünde hata:', profileError);
        setError('Profil kontrol edilemedi: ' + profileError.message);
        setSaving(false);
        return;
      }
      
      // 1. Yeni grup oluştur
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim(),
          color,
          creator_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (groupError) {
        console.error('Grup oluşturulurken hata:', groupError);
        setError('Grup oluşturulamadı: ' + groupError.message);
        setSaving(false);
        return;
      }
      
      // 2. Grubu oluşturan kişiyi lider olarak ekle
      const { error: leaderError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'leader',
          joined_at: new Date().toISOString()
        });
        
      if (leaderError) {
        console.error('Lider eklenirken hata:', leaderError);
        setError('Grup oluşturuldu ancak lider eklenirken hata oluştu. Gruplara gidin ve tekrar deneyin.');
        router.push('/groups');
        return;
      }
      
      // 3. Diğer üyeleri ekle - üye ekleme atlanmadıysa ve üyeler varsa
      let memberError = false;
      if (!skipMembers && members.length > 0) {
        try {
          const memberInserts = members.map(member => ({
            group_id: groupData.id,
            user_id: member.id,
            role: 'member',
            joined_at: new Date().toISOString()
          }));
          
          const { error: membersError } = await supabase
            .from('group_members')
            .insert(memberInserts);
            
          if (membersError) {
            console.error('Üyeler eklenirken hata:', membersError);
            memberError = true;
          }
        } catch (err) {
          console.error('Üye ekleme işleminde beklenmeyen hata:', err);
          memberError = true;
        }
      }
      
      // 4. Grup aktivitesi ekle
      try {
        await supabase.from('group_activity').insert({
          group_id: groupData.id,
          user_id: user.id,
          action: 'create',
          entity_type: 'group',
          entity_id: groupData.id,
          details: { group_name: name.trim() },
          created_at: new Date().toISOString()
        });
      } catch (activityError) {
        console.error('Grup aktivitesi kaydedilirken hata:', activityError);
      }
      
      // Başarı durumuna göre yönlendirme yap
      if (memberError) {
        alert('Grup oluşturuldu ancak bazı üyeler eklenirken sorun oluştu. Daha sonra tekrar deneyebilirsiniz.');
      }
      
      router.push(`/groups/${groupData.id}`);
      
    } catch (error) {
      console.error('Grup kaydedilirken hata oluştu:', error);
      setError(`Grup kaydedilemedi: ${error.message}`);
      setSaving(false);
    }
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/groups"
            className="text-blue-500 hover:underline"
          >
            ← Gruplara Dön
          </Link>
          <h1 className="text-3xl font-bold mt-4">Yeni Grup</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">{error}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Grup Adı
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/groups"
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateGroupForm() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CreateGroupFormContent />
    </Suspense>
  );
}

export default function CreateGroup() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CreateGroupForm />
    </Suspense>
  );
}