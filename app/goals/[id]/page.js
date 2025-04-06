'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';
import { Suspense } from 'react';

function GoalInner({ params }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/auth/login');
      return;
    }

    const fetchGoal = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (goalError) {
          console.error('Hedef getirilirken hata:', goalError);
          setError('Hedef getirilemedi: ' + goalError.message);
          return;
        }

        if (!goalData) {
          setError('Hedef bulunamadı.');
          return;
        }

        setGoal(goalData);
        
        // Subtasks alanı JSON formatında gelirse parse edelim
        try {
          if (goalData.subtasks) {
            if (typeof goalData.subtasks === 'string') {
              setSubtasks(JSON.parse(goalData.subtasks));
            } else {
              setSubtasks(goalData.subtasks || []);
            }
          } else {
            setSubtasks([]);
          }
        } catch (jsonError) {
          console.error('Subtasks JSON parse error:', jsonError);
          setSubtasks([]);
        }
      } catch (error) {
        console.error('Beklenmeyen hata:', error);
        setError('Hedef getirilemedi: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGoal();
    }
  }, [user, authLoading, params.id, router]);

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const handleToggleSubtask = async (taskId) => {
    try {
      setUpdatingProgress(true);
      
      // Yerel olarak güncelle
      const updatedSubtasks = subtasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      setSubtasks(updatedSubtasks);
      
      // Yeni ilerleme hesapla
      const newProgress = calculateProgress(updatedSubtasks);
      
      // Veritabanında güncelle - JSON olarak kaydedelim
      const { error } = await supabase
        .from('goals')
        .update({ 
          subtasks: JSON.stringify(updatedSubtasks),
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);
        
      if (error) throw error;
      
      // Yerel durum güncelleme
      setGoal({
        ...goal,
        subtasks: updatedSubtasks,
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : 'in_progress',
        updated_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Alt görev güncellenirken hata:', error);
      // Hata durumunda orijinal subtasks'a geri dön
      setSubtasks(goal.subtasks || []);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', params.id);
        
      if (error) throw error;
      
      router.push('/goals');
    } catch (error) {
      console.error('Hedef silinirken hata:', error);
      setError(`Hedef silinemedi: ${error.message}`);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusColor = (progress) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-cyan-500';
    return 'bg-yellow-500';
  };
  
  const getStatusText = (progress) => {
    if (progress === 100) return 'Tamamlandı';
    if (progress >= 50) return 'İyi gidiyor';
    return 'Devam ediyor';
  };
  
  if (authLoading || loading) {
    return <div className="flex justify-center py-16"><p>Yükleniyor...</p></div>;
  }
  
  if (!user) {
    return null;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>
          <Link href="/goals" className="text-blue-600 hover:text-blue-500">
            Hedeflere Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Hedef bulunamadı.</p>
            <Link href="/goals" className="text-blue-600 hover:text-blue-500">
              Hedeflere Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{goal.title}</h1>
          <Link href="/goals" className="text-blue-600 hover:text-blue-500">
            Hedeflere Dön
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="prose max-w-none">
            <p className="text-gray-600">{goal.description}</p>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>Oluşturulma: {new Date(goal.created_at).toLocaleDateString('tr-TR')}</p>
            <p>Güncelleme: {new Date(goal.updated_at).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalContent({ params }) {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GoalInner params={params} />
    </Suspense>
  );
}

function Goal({ params }) {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GoalContent params={params} />
    </Suspense>
  );
}

export default function GoalPage({ params }) {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <Goal params={params} />
    </Suspense>
  );
}
