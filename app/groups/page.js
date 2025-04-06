'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';

export default function Groups() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myGroups, setMyGroups] = useState({ leader: [], member: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMyGroups() {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Lider olduğum grupları çek
        const { data: leaderGroups, error: leaderError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            groups (
              id,
              name,
              description,
              color,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .eq('role', 'leader');
          
        if (leaderError) {
          console.error("Lider grupları çekilemedi:", leaderError);
          throw new Error("Gruplar yüklenirken bir hata oluştu");
        }
        
        // Üye olduğum grupları çek
        const { data: memberGroups, error: memberError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            groups (
              id,
              name,
              description,
              color,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .eq('role', 'member');
          
        if (memberError) {
          console.error("Üye grupları çekilemedi:", memberError);
          throw new Error("Gruplar yüklenirken bir hata oluştu");
        }
        
        const leaderGroupsFormatted = leaderGroups
          .filter(item => item.groups !== null)
          .map(item => ({
            ...item.groups,
            role: 'leader'
          }));
          
        const memberGroupsFormatted = memberGroups
          .filter(item => item.groups !== null)
          .map(item => ({
            ...item.groups,
            role: 'member'
          }));
          
        setMyGroups({
          leader: leaderGroupsFormatted || [],
          member: memberGroupsFormatted || []
        });
        
      } catch (error) {
        console.error("Gruplar yüklenirken hata:", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMyGroups();
  }, [user, supabase]);

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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gruplarım</h1>
        <Link href="/groups/new" className="btn-primary">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Grup
          </span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p>Gruplar yükleniyor...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Lider olduğum gruplar */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Yönettiğim Gruplar</h2>
            {myGroups.leader.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.leader.map(group => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">Henüz yönettiğiniz bir grup yok.</p>
            )}
          </div>

          {/* Üye olduğum gruplar */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Üye Olduğum Gruplar</h2>
            {myGroups.member.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.member.map(group => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">Henüz üye olduğunuz bir grup yok.</p>
            )}
          </div>

          {myGroups.leader.length === 0 && myGroups.member.length === 0 && (
            <div className="text-center py-12 card">
              <h2 className="text-xl mb-2">Henüz bir grubunuz yok</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Yeni bir grup oluşturarak başlayabilir veya arkadaşlarınızın gruplarına katılabilirsiniz.
              </p>
              <Link href="/groups/new" className="btn-primary">
                İlk Grubu Oluştur
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Grup Kartı */
function GroupCard({ group }) {
  const formattedDate = new Date(group.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <Link href={`/groups/${group.id}`} className="block">
      <div 
        className="card p-4 hover:shadow-md transition-shadow duration-200"
        style={{ borderLeft: `4px solid ${group.color || '#3b82f6'}` }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{group.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            group.role === 'leader' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
          }`}>
            {group.role === 'leader' ? 'Lider' : 'Üye'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {group.description || 'Açıklama yok'}
        </p>
        
        <div className="text-xs text-gray-500">
          Oluşturulma: {formattedDate}
        </div>
      </div>
    </Link>
  );
}
