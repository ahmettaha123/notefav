'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';

export default function NewGoal() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState('specific'); // specific, measurable, achievable, relevant, timebound

  // SMART şablonu için sorular
  const smartSteps = {
    specific: {
      title: 'Specific (Belirli)',
      description: 'Hedefiniz net ve belirli olmalıdır.',
      question: 'Ne başarmak istiyorsunuz?',
      placeholder: 'Örn: Fransızca öğrenmek, 5 km koşmak, vb.'
    },
    measurable: {
      title: 'Measurable (Ölçülebilir)',
      description: 'Hedefinizi nasıl ölçeceksiniz?',
      question: 'Başarıyı nasıl ölçeceksiniz?',
      placeholder: 'Örn: 500 kelime öğrenmek, haftada 3 gün koşmak, vb.'
    },
    achievable: {
      title: 'Achievable (Ulaşılabilir)',
      description: 'Hedefiniz zorlayıcı ama ulaşılabilir olmalıdır.',
      question: 'Bu hedefe ulaşmak için neye ihtiyacınız var?',
      placeholder: 'Örn: Çevrimiçi kurs, koşu ayakkabıları, vb.'
    },
    relevant: {
      title: 'Relevant (İlgili)',
      description: 'Bu hedef sizin için neden önemli?',
      question: 'Bu hedefe ulaşmanın size ne faydası olacak?',
      placeholder: 'Örn: Kariyer gelişimi, sağlık, vb.'
    },
    timebound: {
      title: 'Time-bound (Zamana Bağlı)',
      description: 'Hedefiniz için bir zaman çerçevesi belirleyin.',
      question: 'Bu hedefe ne zaman ulaşmak istiyorsunuz?',
      placeholder: 'Hedef tarihi seçin'
    }
  };

  const handleNext = () => {
    const steps = Object.keys(smartSteps);
    const currentIndex = steps.indexOf(activeStep);
    
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps = Object.keys(smartSteps);
    const currentIndex = steps.indexOf(activeStep);
    
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1]);
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    
    if (!newSubtask.trim()) return;
    
    const newSubtaskObj = {
      id: Date.now().toString(),
      title: newSubtask.trim(),
      completed: false
    };
    
    setSubtasks([...subtasks, newSubtaskObj]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter(subtask => subtask.id !== id));
  };

  const handleToggleSubtask = (id) => {
    setSubtasks(subtasks.map(subtask => 
      subtask.id === id 
        ? { ...subtask, completed: !subtask.completed } 
        : subtask
    ));
  };

  const handleSaveGoal = async () => {
    if (!title.trim()) {
      setError('Başlık gereklidir.');
      return;
    }

    if (!targetDate) {
      setError('Hedef tarihi gereklidir.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Önce profil kontrolü yapalım - profiles tablosunda kaydı yoksa oluşturalım
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // Eğer profil yoksa oluştur
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
          
        if (insertError) throw insertError;
      } else if (profileError) {
        throw profileError;
      }
      
      // Şu anki tarih nesnelerini oluştur
      const now = new Date().toISOString();
      const targetDateISO = new Date(targetDate).toISOString();
      
      const newGoal = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        progress: 0, // Başlangıçta ilerleme 0
        status: 'planned',
        target_date: targetDateISO,
        created_at: now,
        updated_at: now,
        // subtasks alanını JSONB uyumlu hale getirelim
        // subtasks
      };
      
      // Subtasks alanını JSON.stringify ile kaydetmeden önce kontrol edelim
      if (subtasks && subtasks.length > 0) {
        newGoal.subtasks = JSON.stringify(subtasks);
      } else {
        newGoal.subtasks = JSON.stringify([]); // Boş array olarak belirtelim
      }
      
      const { data, error } = await supabase
        .from('goals')
        .insert([newGoal])
        .select('id')
        .single();
        
      if (error) {
        console.error('Hedef kaydedilirken detaylı hata:', error);
        if (error.message.includes('subtasks')) {
          throw new Error('Subtasks alanı ile ilgili bir hata oluştu. Lütfen daha sonra tekrar deneyin veya yöneticinize bildirin.');
        } else {
          throw error;
        }
      }
      
      router.push(`/goals/${data.id}`);
      
    } catch (error) {
      console.error('Hedef kaydedilirken hata oluştu:', error);
      setError(`Hedef kaydedilemedi: ${error.message}`);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni SMART Hedef</h1>
        <div className="flex gap-2">
          <Link 
            href="/goals" 
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            İptal
          </Link>
          <button 
            onClick={handleSaveGoal}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {/* SMART Adımlar İlerleme Çubuğu */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {Object.keys(smartSteps).map((step) => (
            <button 
              key={step} 
              onClick={() => setActiveStep(step)}
              className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                activeStep === step 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {smartSteps[step].title.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-green-500 h-full transition-all" 
            style={{ width: `${(Object.keys(smartSteps).indexOf(activeStep) + 1) * 20}%` }}
          ></div>
        </div>
      </div>
      
      <div className="card mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            {smartSteps[activeStep].title}
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {smartSteps[activeStep].description}
          </p>
          
          <h3 className="font-medium mb-2">
            {smartSteps[activeStep].question}
          </h3>
          
          {activeStep === 'specific' && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder={smartSteps[activeStep].placeholder}
            />
          )}
          
          {activeStep === 'measurable' && (
            <div>
              <div className="mb-6">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  rows={4}
                  placeholder={smartSteps[activeStep].placeholder}
                ></textarea>
              </div>
              
              <h3 className="font-medium mb-3">Alt Görevler</h3>
              <div className="space-y-3 mb-4">
                {subtasks.map((subtask) => (
                  <div 
                    key={subtask.id}
                    className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      className="h-5 w-5 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleRemoveSubtask(subtask.id)}
                      className="ml-auto text-gray-500 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleAddSubtask} className="flex">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Yeni alt görev ekle..."
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-r-md border-t border-r border-b border-gray-300 dark:border-gray-700"
                >
                  Ekle
                </button>
              </form>
            </div>
          )}
          
          {activeStep === 'achievable' && (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder={smartSteps[activeStep].placeholder}
            ></textarea>
          )}
          
          {activeStep === 'relevant' && (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder={smartSteps[activeStep].placeholder}
            ></textarea>
          )}
          
          {activeStep === 'timebound' && (
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              min={new Date().toISOString().split('T')[0]} // Bugünden başlayarak
            />
          )}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={activeStep === 'specific'}
          className={`px-4 py-2 border rounded-md ${
            activeStep === 'specific' 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Önceki
        </button>
        
        {activeStep !== 'timebound' ? (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
          >
            Sonraki
          </button>
        ) : (
          <button
            onClick={handleSaveGoal}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Kaydediliyor...' : 'Hedefi Oluştur'}
          </button>
        )}
      </div>
    </div>
  );
}
