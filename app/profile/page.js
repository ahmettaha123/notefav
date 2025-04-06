'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../lib/supabase';
import { Suspense } from 'react';

function ProfileInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/profile');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profil bulunamadı, yeni profil oluştur
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
              return;
            }

            setUsername(user.email?.split('@')[0] || '');
            setFullName(user.email?.split('@')[0] || '');
          } else {
            console.error('Profil alınırken hata:', profileError);
            setError('Profil alınamadı: ' + profileError.message);
            return;
          }
        } else {
          setUsername(profile.username || '');
          setFullName(profile.full_name || '');
        }
      } catch (error) {
        console.error('Profil alınırken beklenmeyen hata:', error);
        setError('Profil alınamadı: ' + error.message);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Kullanıcı adı gereklidir.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          full_name: fullName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profil güncellenirken hata:', updateError);
        setError('Profil güncellenemedi: ' + updateError.message);
        return;
      }

      setSuccess('Profil başarıyla güncellendi.');
    } catch (error) {
      console.error('Profil güncellenirken beklenmeyen hata:', error);
      setError('Profil güncellenemedi: ' + error.message);
    } finally {
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
        <h1 className="text-3xl font-bold mb-8">Profil</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">{error}</div>
          )}

          {success && (
            <div className="bg-green-50 text-green-500 p-3 rounded">{success}</div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Ad Soyad
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileContent() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ProfileInner />
    </Suspense>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
