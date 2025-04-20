import { FaHome, FaUsers, FaListAlt, FaChartLine, FaClipboard, FaBullseye, FaStream } from 'react-icons/fa';
import Link from 'next/link';

export default function GroupTabs({ groupId, activeTab }) {
  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: <FaHome /> },
    { id: 'notes', label: 'Notlar', icon: <FaClipboard /> },
    { id: 'goals', label: 'Hedefler', icon: <FaBullseye /> },
    { id: 'activity', label: 'Aktivite', icon: <FaStream /> },
    { id: 'members', label: 'Üyeler', icon: <FaUsers /> }
  ];

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex border-b dark:border-slate-700 min-w-max">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const baseClasses = "flex items-center px-4 py-3 whitespace-nowrap transition-colors border-b-2 font-medium";
          const activeClasses = "text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400";
          const inactiveClasses = "text-gray-600 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800";
          
          return (
            <Link 
              href={tab.id === 'overview' ? `/groups/${groupId}` : `/groups/${groupId}/${tab.id}`}
              key={tab.id}
              className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
} 