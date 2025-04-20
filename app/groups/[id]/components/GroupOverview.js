import { FaClipboard, FaChartLine, FaUsers, FaPlus, FaEye } from 'react-icons/fa';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function GroupOverview({ 
  groupId, 
  notes, 
  goals, 
  membersCount, 
  myRole,
  onAddNote,
  onAddGoal
}) {
  const canAddContent = myRole === 'leader' || myRole === 'admin';
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: tr });
  };
  
  // Not kartı bileşeni
  const NoteCard = ({ note }) => (
    <Link href={`/groups/${groupId}/notes/${note.id}`} className="block">
      <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow duration-200">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{note.title || 'İsimsiz Not'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {note.content?.replace(/<[^>]*>/g, '') || 'İçerik yok'}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{note.profiles?.full_name || note.profiles?.username || 'Bilinmiyor'}</span>
          <span>{formatDate(note.created_at)}</span>
        </div>
      </div>
    </Link>
  );
  
  // Hedef kartı bileşeni
  const GoalCard = ({ goal }) => {
    // İlerleme durumunu hesapla
    const progress = goal.progress || 0;
    
    // Durum göstergesi
    const getStatusBadge = (status) => {
      switch (status) {
        case 'completed':
          return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">Tamamlandı</span>;
        case 'in_progress':
          return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full">Devam Ediyor</span>;
        case 'cancelled':
          return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">İptal Edildi</span>;
        default:
          return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 rounded-full">Planlandı</span>;
      }
    };
    
    return (
      <Link href={`/groups/${groupId}/goals/${goal.id}`} className="block">
        <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{goal.title || 'İsimsiz Hedef'}</h3>
            {getStatusBadge(goal.status)}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {goal.description || 'Açıklama yok'}
          </p>
          
          {/* İlerleme çubuğu */}
          <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-2">
            <div 
              className="h-full bg-orange-500 dark:bg-orange-600 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">{progress}% tamamlandı</span>
            {goal.due_date && (
              <span className="text-gray-500 dark:text-gray-400">Bitiş: {formatDate(goal.due_date)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  };
  
  // KArtsız durum gösterimi
  const EmptyState = ({ type, onAction, canAdd }) => (
    <div className="text-center p-8 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
      <div className="mb-3">
        {type === 'notes' ? <FaClipboard className="w-10 h-10 mx-auto text-gray-400" /> : <FaChartLine className="w-10 h-10 mx-auto text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium mb-2">
        {type === 'notes' ? 'Henüz not paylaşılmamış' : 'Henüz hedef oluşturulmamış'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {type === 'notes' 
          ? 'Bu grupta henüz paylaşılmış not bulunmuyor.' 
          : 'Bu grup için henüz bir hedef oluşturulmamış.'}
      </p>
      {canAdd && (
        <button 
          onClick={onAction}
          className="btn-primary inline-flex items-center"
        >
          <FaPlus className="mr-2" />
          {type === 'notes' ? 'Not Paylaş' : 'Hedef Oluştur'}
        </button>
      )}
    </div>
  );
  
  return (
    <div>
      {/* İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Grup Üyeleri</p>
              <p className="text-2xl font-bold">{membersCount}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <FaUsers className="text-orange-500 dark:text-orange-400 h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Notlar</p>
              <p className="text-2xl font-bold">{notes.length}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <FaClipboard className="text-purple-500 dark:text-purple-400 h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Hedefler</p>
              <p className="text-2xl font-bold">{goals.length}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <FaChartLine className="text-green-500 dark:text-green-400 h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Son Notlar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Son Notlar</h2>
          <Link href={`/groups/${groupId}/notes`} className="text-orange-500 dark:text-orange-400 hover:underline flex items-center">
            <FaEye className="mr-1" /> Tümünü Gör
          </Link>
        </div>
        
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.slice(0, 4).map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <EmptyState type="notes" onAction={onAddNote} canAdd={canAddContent} />
        )}
        
        {notes.length > 0 && canAddContent && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onAddNote}
              className="btn-secondary inline-flex items-center"
            >
              <FaPlus className="mr-2" /> Not Paylaş
            </button>
          </div>
        )}
      </div>
      
      {/* Son Hedefler */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Grup Hedefleri</h2>
          <Link href={`/groups/${groupId}/goals`} className="text-orange-500 dark:text-orange-400 hover:underline flex items-center">
            <FaEye className="mr-1" /> Tümünü Gör
          </Link>
        </div>
        
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.slice(0, 4).map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <EmptyState type="goals" onAction={onAddGoal} canAdd={canAddContent} />
        )}
        
        {goals.length > 0 && canAddContent && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onAddGoal}
              className="btn-secondary inline-flex items-center"
            >
              <FaPlus className="mr-2" /> Hedef Oluştur
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 