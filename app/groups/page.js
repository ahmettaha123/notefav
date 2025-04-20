'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import { FaUsers, FaUserShield, FaCrown, FaUser, FaPlus, FaSearch, FaTh, FaList } from 'react-icons/fa';

export default function Groups() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myGroups, setMyGroups] = useState({ leader: [], admin: [], member: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' veya 'list' görünüm seçeneği
  const [sortBy, setSortBy] = useState('name'); // 'name' veya 'date' sıralama seçeneği

  useEffect(() => {
    async function fetchMyGroups() {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Tüm grupları ve rollerimi al
        const { data: groupsData, error: groupsError } = await supabase
          .from('group_members')
          .select(`
            role,
            groups (
              id,
              name,
              description,
              color,
              created_at,
              created_by
            )
          `)
          .eq('user_id', user.id);
          
        if (groupsError) {
          console.error("Gruplar çekilemedi:", groupsError);
          throw new Error("Gruplar yüklenirken bir hata oluştu");
        }
        
        const leaderGroups = [];
        const adminGroups = [];
        const memberGroups = [];
        
        // Grupları rollerine göre ayır
        groupsData.forEach(item => {
          if (!item.groups) return;
          
          const group = {
            ...item.groups,
            role: item.role,
            isCreator: item.groups.created_by === user.id
          };
          
          if (item.role === 'leader') {
            leaderGroups.push(group);
          } else if (item.role === 'admin') {
            adminGroups.push(group);
          } else {
            memberGroups.push(group);
          }
        });
        
        // Son 7 günde katıldığım grupları işaretle
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const markNewGroups = groups => {
          return groups.map(group => ({
            ...group,
            isNew: new Date(group.created_at) > oneWeekAgo
          }));
        };
        
        setMyGroups({
          leader: markNewGroups(leaderGroups) || [],
          admin: markNewGroups(adminGroups) || [],
          member: markNewGroups(memberGroups) || []
        });
        
      } catch (error) {
        console.error("Gruplar yüklenirken hata:", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMyGroups();
  }, [user]);

  // Filtreleme ve sıralama
  const filterAndSortGroups = (groups) => {
    let result = [...groups];
    
    // Arama terimime göre filtrele
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        group => group.name.toLowerCase().includes(term) || 
                 (group.description && group.description.toLowerCase().includes(term))
      );
    }
    
    // Sıralama seçeneğine göre sırala
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return result;
  };
  
  // Tüm grup sayısını hesapla
  const totalGroups = myGroups.leader.length + myGroups.admin.length + myGroups.member.length;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4"></div>
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="h-20 w-20 bg-orange-100 dark:bg-orange-900/30 mx-auto rounded-full flex items-center justify-center mb-6">
          <FaUsers className="h-10 w-10 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Giriş yapmalısınız</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Gruplarınızı görüntülemek ve yönetmek için giriş yapmanız gerekmektedir.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login" className="btn-primary">
            Giriş Yap
          </Link>
          <Link href="/auth/signup" className="btn-secondary">
            Hesap Oluştur
          </Link>
        </div>
      </div>
    );
  }

  const filteredLeaderGroups = filterAndSortGroups(myGroups.leader);
  const filteredAdminGroups = filterAndSortGroups(myGroups.admin);
  const filteredMemberGroups = filterAndSortGroups(myGroups.member);
  const hasFilteredGroups = filteredLeaderGroups.length > 0 || filteredAdminGroups.length > 0 || filteredMemberGroups.length > 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Gruplarım</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalGroups === 0 
              ? 'Henüz bir gruba üye değilsiniz' 
              : `Toplam ${totalGroups} gruba üyesiniz (${myGroups.leader.length} lider, ${myGroups.admin.length} yönetici, ${myGroups.member.length} üye)`}
          </p>
        </div>
        <Link href="/groups/new" className="btn-primary whitespace-nowrap">
          <span className="flex items-center">
            <FaPlus className="mr-2" /> Yeni Grup
          </span>
        </Link>
      </div>
      
      {/* Filtreler ve araç çubuğu */}
      {totalGroups > 0 && (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-slate-800 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Grup ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-700"
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border rounded-md dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-700"
              >
                <option value="name">İsme Göre</option>
                <option value="date">Tarihe Göre</option>
              </select>
              <div className="flex border rounded-md overflow-hidden dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-white dark:bg-slate-800'}`}
                  aria-label="Izgara görünümü"
                >
                  <FaTh />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-white dark:bg-slate-800'}`}
                  aria-label="Liste görünümü"
                >
                  <FaList />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg shadow-sm">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm underline mt-1"
          >
            Yeniden dene
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 dark:border-orange-800 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Gruplar yükleniyor...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Lider olduğum gruplar */}
          {filteredLeaderGroups.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <FaCrown className="text-yellow-500 mr-2" />
                <h2 className="text-xl font-semibold">Lider Olduğum Gruplar</h2>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLeaderGroups.map(group => (
                    <GroupCard key={group.id} group={group} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeaderGroups.map(group => (
                    <GroupCard key={group.id} group={group} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Admin olduğum gruplar */}
          {filteredAdminGroups.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <FaUserShield className="text-green-500 mr-2" />
                <h2 className="text-xl font-semibold">Yönetici Olduğum Gruplar</h2>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAdminGroups.map(group => (
                    <GroupCard key={group.id} group={group} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAdminGroups.map(group => (
                    <GroupCard key={group.id} group={group} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Üye olduğum gruplar */}
          {filteredMemberGroups.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <FaUser className="text-orange-500 mr-2" />
                <h2 className="text-xl font-semibold">Üye Olduğum Gruplar</h2>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMemberGroups.map(group => (
                    <GroupCard key={group.id} group={group} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMemberGroups.map(group => (
                    <GroupCard key={group.id} group={group} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasFilteredGroups && searchTerm && (
            <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
              <p className="mb-2 text-lg font-medium">Aramanızla eşleşen grup bulunamadı</p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">"{searchTerm}" için sonuç bulunamadı</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-orange-500 hover:underline"
              >
                Aramayı temizle
              </button>
            </div>
          )}
          
          {totalGroups === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
                <FaUsers className="h-12 w-12 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Henüz bir grubunuz yok</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Yeni bir grup oluşturarak başlayabilir veya arkadaşlarınızın gruplarına katılabilirsiniz.
              </p>
              <Link href="/groups/new" className="btn-primary px-6 py-3 text-lg flex items-center">
                <FaPlus className="mr-2" /> İlk Grubu Oluştur
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Grup Kartı */
function GroupCard({ group, viewMode }) {
  const formattedDate = new Date(group.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const getRoleBadge = (role, isCreator) => {
    if (isCreator) {
      return (
        <span className="flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
          <FaCrown className="mr-1 text-yellow-500" /> Kurucu
        </span>
      );
    }
    
    switch(role) {
      case 'leader':
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
            <FaCrown className="mr-1" /> Lider
          </span>
        );
      case 'admin':
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            <FaUserShield className="mr-1" /> Yönetici
          </span>
        );
      default:
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
            <FaUser className="mr-1" /> Üye
          </span>
        );
    }
  };
  
  if (viewMode === 'list') {
    return (
      <Link href={`/groups/${group.id}`} className="block">
        <div 
          className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-slate-800 hover:shadow-md transition-shadow duration-200 flex items-center"
          style={{ borderLeft: `4px solid ${group.color || '#f97316'}` }}
        >
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              {group.isNew && (
                <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full w-fit">Yeni</span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
              {group.description || 'Açıklama yok'}
            </p>
            <div className="text-xs text-gray-500">
              {formattedDate}
            </div>
          </div>
          <div className="ml-4">
            {getRoleBadge(group.role, group.isCreator)}
          </div>
        </div>
      </Link>
    );
  }
  
  return (
    <Link href={`/groups/${group.id}`} className="block h-full">
      <div 
        className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-slate-800 hover:shadow-md transition-shadow duration-200 h-full flex flex-col"
        style={{ borderTop: `4px solid ${group.color || '#f97316'}` }}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold line-clamp-1">{group.name}</h3>
            {group.isNew && (
              <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full w-fit mt-1">Yeni</span>
            )}
          </div>
          <div>
            {getRoleBadge(group.role, group.isCreator)}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
          {group.description || 'Açıklama yok'}
        </p>
        
        <div className="text-xs text-gray-500 flex items-center">
          <span className="mr-2">Oluşturulma:</span>
          {formattedDate}
        </div>
      </div>
    </Link>
  );
}
