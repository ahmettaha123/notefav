import { useState, useRef, useEffect } from 'react';
import { FaCrown, FaUserShield, FaUser, FaEllipsisV, FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MembersList({ members, myRole, groupId, onRoleChange, onRemoveMember }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('role'); // role, name, date
  const menuRef = useRef(null);

  // Menü dışında tıklandığında menüyü kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Üyeleri filtrele
  const filteredMembers = members.filter(member => {
    const profile = member.profiles || {};
    const name = profile.full_name || profile.username || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole ? member.role === filterRole : true;
    return matchesSearch && matchesRole;
  });

  // Üyeleri sırala
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'role') {
      const roleOrder = { leader: 0, admin: 1, member: 2 };
      return roleOrder[a.role] - roleOrder[b.role];
    } else if (sortBy === 'name') {
      const nameA = a.profiles?.full_name || a.profiles?.username || '';
      const nameB = b.profiles?.full_name || b.profiles?.username || '';
      return nameA.localeCompare(nameB);
    } else if (sortBy === 'date') {
      return new Date(b.joined_at) - new Date(a.joined_at);
    }
    return 0;
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const canManageMembers = myRole === 'leader' || myRole === 'admin';
  
  const getRoleIcon = (role) => {
    switch (role) {
      case 'leader':
        return <FaCrown className="text-yellow-500" />;
      case 'admin':
        return <FaUserShield className="text-green-500" />;
      default:
        return <FaUser className="text-orange-500" />;
    }
  };
  
  const getRoleName = (role) => {
    switch (role) {
      case 'leader':
        return 'Lider';
      case 'admin':
        return 'Yönetici';
      default:
        return 'Üye';
    }
  };

  // Menüyü aç/kapat
  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Rol renk sınıfları
  const getRoleClasses = (role) => {
    switch (role) {
      case 'leader':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'admin':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Arama ve Filtreleme */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Üye ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-10 pr-8 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Tüm Roller</option>
                <option value="leader">Lider</option>
                <option value="admin">Yönetici</option>
                <option value="member">Üye</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <select
                className="appearance-none pl-10 pr-8 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="role">Rol</option>
                <option value="name">İsim</option>
                <option value="date">Katılım</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSortAmountDown className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Üye Sayacı */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredMembers.length} üye gösteriliyor ({members.length} toplam)
        </div>
      </div>

      {/* Üye Listesi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 overflow-hidden">
        {sortedMembers.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            {sortedMembers.map((member) => {
              const profile = member.profiles || {};
              const joinedDate = new Date(member.joined_at);
              const joinedText = formatDistanceToNow(joinedDate, { addSuffix: true, locale: tr });
              
              return (
                <li key={member.user_id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 relative flex-shrink-0">
                        {profile.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={profile.full_name || profile.username || 'Kullanıcı'}
                            width={48}
                            height={48}
                            className="rounded-full h-12 w-12 object-cover ring-2 ring-white dark:ring-slate-900"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                            {getInitials(profile.full_name || profile.username)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                          {getRoleIcon(member.role)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">{profile.full_name || profile.username || 'İsimsiz Üye'}</span>
                          <span className={`ml-2 flex items-center text-xs px-2 py-0.5 rounded-full ${getRoleClasses(member.role)}`}>
                            {getRoleName(member.role)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Katıldı: {joinedText}
                        </p>
                      </div>
                    </div>
                    
                    {canManageMembers && member.role !== 'leader' && (
                      <div className="relative" ref={menuRef}>
                        <button 
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                          onClick={() => toggleMenu(member.user_id)}
                          aria-label="Üye ayarları"
                        >
                          <FaEllipsisV className="text-gray-500" />
                        </button>
                        
                        {openMenuId === member.user_id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                            <div className="py-1">
                              {myRole === 'leader' && member.role !== 'admin' && (
                                <button
                                  onClick={() => {
                                    onRoleChange(member.user_id, 'admin');
                                    setOpenMenuId(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                  Yönetici Yap
                                </button>
                              )}
                              
                              {myRole === 'leader' && member.role !== 'member' && (
                                <button
                                  onClick={() => {
                                    onRoleChange(member.user_id, 'member');
                                    setOpenMenuId(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                  Üye Yap
                                </button>
                              )}
                              
                              {myRole === 'leader' && (
                                <button
                                  onClick={() => {
                                    onRemoveMember(member.user_id);
                                    setOpenMenuId(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  Gruptan Çıkar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <div className="h-16 w-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <FaUser className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">Üye bulunamadı</h3>
            <p className="text-gray-500 dark:text-gray-400">Arama kriterlerinize uygun üye bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
} 