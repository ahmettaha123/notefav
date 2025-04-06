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

function CreateGroupForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6'); // varsayılan mavi
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const emailInputRef = useRef(null);
  const [skipMembers, setSkipMembers] = useState(false); // Üye eklemeyi atla

  // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/groups/new');
    }
  }, [user, authLoading, router]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!emailInput.trim()) return;
    
    try {
      // Email formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(emailInput);
      
      // Kendini eklemeyi önle
      if (isEmail && emailInput.toLowerCase() === user.email.toLowerCase()) {
        setError('Kendinizi üye olarak ekleyemezsiniz, siz otomatik olarak lider olacaksınız.');
        return;
      }
      
      // Aynı emaili tekrar eklemeyi önle
      if (members.some(m => m.email && m.email.toLowerCase() === emailInput.toLowerCase())) {
        setError('Bu kullanıcı zaten eklenmiş');
        return;
      }
      
      let userData = null;
      
      // Kullanıcıyı bul - e-posta veya kullanıcı adına göre
      if (isEmail) {
        // Bu e-posta için yetkili bir Supabase API uç noktası olmalı
        // Şimdilik tüm üye ekleme mantığını atlayalım
        
        setError('E-posta ile kullanıcı arama şu anda devre dışı. Grup oluşturma işlemine devam etmek için üye eklemeden grubu oluşturun ve daha sonra üye ekleyin.');
        return;
        
        /* E-posta araması için sunucu tarafında özel API yolu oluşturulmalı
        const { data } = await fetch('/api/users/search-by-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput })
        }).then(res => res.json());
        
        if (!data || !data.id) {
          setError('Bu e-posta ile kayıtlı kullanıcı bulunamadı');
          return;
        }
        
        userData = {
          id: data.id,
          email: data.email,
          username: data.username || data.email.split('@')[0],
          full_name: data.full_name
        };
        */
      } else {
        // Kullanıcı adına göre profil bilgilerini al
        const { data: usernameUser, error: usernameError } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .eq('username', emailInput.trim())
          .maybeSingle();
          
        if (usernameError || !usernameUser) {
          setError('Bu kullanıcı adına sahip bir kullanıcı bulunamadı');
          return;
        }
        
        // Üye olarak ekle - ancak e-posta adresini bilmiyoruz
        userData = {
          id: usernameUser.id,
          email: '', // E-posta bilgisi burada mevcut değil
          username: usernameUser.username,
          full_name: usernameUser.full_name
        };
      }
      
      if (!userData) {
        setError('Kullanıcı bilgileri alınamadı.');
        return;
      }
      
      setMembers([...members, { 
        id: userData.id,
        email: userData.email, 
        username: userData.username || userData.full_name || '',
        role: 'member'
      }]);
      
      setEmailInput('');
      setError('');
      emailInputRef.current?.focus();
      
    } catch (error) {
      console.error('Üye eklerken hata:', error);
      setError('Üye eklenirken bir hata oluştu. Alternatif olarak, grubu önce üyesiz oluşturup daha sonra üye ekleyebilirsiniz.');
    }
  };

  const handleRemoveMember = (emailToRemove) => {
    setMembers(members.filter(m => m.email !== emailToRemove));
  };

  const handleSaveGroup = async () => {
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
          role: 'leader', // Rol değerinin doğru olduğundan emin olalım
          joined_at: new Date().toISOString()
        });
        
      if (leaderError) {
        console.error('Lider eklenirken hata:', leaderError);
        setError('Grup oluşturuldu ancak lider eklenirken hata oluştu. Gruplara gidin ve tekrar deneyin.');
        // Lider eklenemese bile grup oluştu, devam edelim
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
        // Aktivite kaydetme hatası kritik değil, devam edebiliriz
      }
      
      // Başarı durumuna göre yönlendirme yap
      if (memberError) {
        // Üye eklemede hata varsa, hata mesajı göster ama yine de grup detay sayfasına git
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

        <form onSubmit={handleSaveGroup} className="space-y-6">
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

export default function CreateGroup() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CreateGroupForm />
    </Suspense>
  );
}