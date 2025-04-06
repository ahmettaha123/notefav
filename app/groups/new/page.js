'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';

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

export default function NewGroup() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni Grup</h1>
        <div className="flex gap-2">
          <Link 
            href="/groups" 
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            İptal
          </Link>
          <button 
            onClick={handleSaveGroup}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Kaydediliyor...' : 'Grup Oluştur'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div className="card mb-6">
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
        
      {/* Üyeleri atla seçeneği */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="skipMembers"
          checked={skipMembers}
          onChange={(e) => setSkipMembers(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="skipMembers" className="cursor-pointer">
          Şimdilik üye eklemeyi atla (daha sonra ekleyebilirsiniz)
        </label>
      </div>
        
      {/* Üyeler */}
      {!skipMembers && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Grup Üyeleri</h2>
          
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-md">
            <span className="font-medium block mb-1">Not:</span>
            Siz otomatik olarak grubun lideri olacaksınız. Eklemek istediğiniz diğer üyeleri aşağıda belirtebilirsiniz.
            Sadece sistemde kayıtlı kullanıcıları ekleyebilirsiniz.
          </div>
          
          {/* Üye Ekleme Formu */}
          <form onSubmit={handleAddMember} className="mb-6">
            <div className="flex">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                ref={emailInputRef}
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Üye e-posta adresi..."
              />
              <button 
                type="submit" 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-r-md"
              >
                Ekle
              </button>
            </div>
          </form>
          
          {/* Eklenen Üyeler Listesi */}
          {members.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-medium">Eklenen Üyeler:</h3>
              <ul className="space-y-2">
                {members.map(member => (
                  <li key={member.email || member.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div>
                      <span className="font-medium">{member.username || member.email?.split('@')[0] || 'Bilinmeyen Kullanıcı'}</span>
                      {member.email && <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">({member.email})</span>}
                    </div>
                    <button 
                      onClick={() => handleRemoveMember(member.email || member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Henüz üye eklenmedi.</p>
          )}
        </div>
      )}
    </div>
  );
}