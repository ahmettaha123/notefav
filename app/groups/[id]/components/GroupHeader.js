import { FaEdit, FaUserPlus, FaUsers, FaCrown, FaUserShield, FaUser, FaCalendar, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function GroupHeader({ group, membersCount, myRole, onInvite }) {
  if (!group) return null;

  const createdAt = new Date(group.created_at);
  const formattedDate = format(createdAt, 'dd MMMM yyyy', { locale: tr });
  
  // Kullanıcı profilini al
  const creator = group.profiles || {};
  
  // Rol rozeti render fonksiyonu
  const renderRoleBadge = (role) => {
    switch (role) {
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
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            <FaUser className="mr-1" /> Üye
          </span>
        );
    }
  };

  const canEditGroup = myRole === 'leader' || myRole === 'admin';

  return (
    <div className="mb-8">
      {/* Geri butonu */}
      <div className="mb-6">
        <Link href="/groups" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center w-fit">
          <FaArrowLeft className="mr-2" />
          <span>Gruplara Dön</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 overflow-hidden">
        {/* Renkli üst kenar */}
        <div 
          className="h-3" 
          style={{ backgroundColor: group.color || '#3b82f6' }}
        ></div>
        
        {/* Grup içeriği */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold">{group.name}</h1>
            
            <div className="flex flex-wrap gap-2">
              {/* Rol rozeti */}
              <div className="flex-shrink-0">
                {renderRoleBadge(myRole)}
              </div>
              
              {/* Düzenleme butonu */}
              {canEditGroup && (
                <Link 
                  href={`/groups/${group.id}/edit`} 
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center"
                >
                  <FaEdit className="mr-1" /> Düzenle
                </Link>
              )}
              
              {/* Davet butonu */}
              {(myRole === 'leader' || myRole === 'admin') && (
                <button 
                  onClick={onInvite}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center"
                >
                  <FaUserPlus className="mr-1" /> Davet Et
                </button>
              )}
            </div>
          </div>
          
          {/* Grup bilgileri */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {group.description || 'Bu grup için henüz bir açıklama eklenmemiş.'}
            </p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <FaCalendar className="mr-2 text-gray-400" />
                <span>Oluşturulma: {formattedDate}</span>
              </div>
              
              <div className="flex items-center">
                <FaUsers className="mr-2 text-gray-400" />
                <span>{membersCount} üye</span>
              </div>
              
              <div className="flex items-center">
                <FaCrown className="mr-2 text-yellow-500" />
                <span>Kurucu: {creator?.full_name || creator?.username || 'Bilinmiyor'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 