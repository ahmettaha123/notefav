'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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

function NewGroupContent() {
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
      if (!emailRegex.test(emailInput)) {
        setError('Lütfen geçerli bir e-posta adresi girin.');
        return;
      }
      
      // Kendini eklemeyi önle
      if (emailInput.toLowerCase() === user.email.toLowerCase()) {
        setError('Kendinizi üye olarak ekleyemezsiniz, siz otomatik olarak lider olacaksınız.');
        return;
      }
      
      // Aynı emaili tekrar eklemeyi önle
      if (members.some(m => m.email && m.email.toLowerCase() === emailInput.toLowerCase())) {
        setError('Bu kullanıcı zaten eklenmiş');
        return;
      }
      
      // E-posta ile kullanıcıyı arayabilmek için auth veya profiles tablosunda e-posta araması yapmalıyız
      // Bu işlem için sunucu tarafında özel bir endpoint gerekebilir
      
      // Şimdilik kullanıcıyı e-posta bilgisi ile ekleyelim
      setMembers([...members, { 
        email: emailInput.toLowerCase(),
        username: emailInput.split('@')[0], // E-postanın kullanıcı adı kısmını gösterelim
        role: 'member'
      }]);
      
      setEmailInput('');
      setError('');
      emailInputRef.current?.focus();
      
    } catch (error) {
      console.error('Üye eklerken hata:', error);
      setError('Üye eklenirken bir hata oluştu.');
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
      
      // 3. Diğer üyeleri ekleme kısmını kaldırdık - üye eklemek için grup üyeleri sayfasına yönlendirilecekler
      
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
      router.push(`/groups/${groupData.id}`);
      
    } catch (error) {
      console.error('Grup kaydedilirken hata oluştu:', error);
      setError(`Grup kaydedilemedi: ${error.message}`);
      setSaving(false);
    }
  };

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
        
      <div className="card mb-4">
        <h2 className="text-xl font-semibold mb-4">Grup Kurulumu</h2>
        <div className="mb-4 p-3 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200 rounded-md">
          <span className="font-medium block mb-1">Bilgi:</span>
          Grubu oluşturduktan sonra istediğiniz zaman "Üyeler" sayfasını kullanarak e-posta adreslerine göre üyeleri ekleyebilirsiniz.
          Siz otomatik olarak grubun lideri olacaksınız.
        </div>
      </div>
    </div>
  );
}

export default function NewGroup() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><p>Yükleniyor...</p></div>}>
      <NewGroupContent />
    </Suspense>
  );
}