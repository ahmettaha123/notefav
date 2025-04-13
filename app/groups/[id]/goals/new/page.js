'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';
import { FaArrowLeft, FaSave, FaTags, FaPlus, FaTrash, FaCheck } from 'react-icons/fa';

export default function NewGroupGoal() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form alanları
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Minimum tarih (bugün)
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchGroupData() {
      setLoading(true);
      setError('');
      
      try {
        // Grup bilgilerini çek
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();
          
        if (groupError) {
          console.error("Grup bilgileri çekilemedi:", groupError);
          throw new Error("Grup bulunamadı");
        }
        
        setGroup(groupData);
        
        // Kullanıcının grup üyesi olup olmadığını kontrol et
        const { data: memberData, error: memberCheckError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (memberCheckError && memberCheckError.code !== 'PGRST116') {
          console.error("Üyelik kontrolü yapılamadı:", memberCheckError);
          throw new Error("Üyelik bilgileri yüklenemedi");
        }
        
        if (!memberData) {
          // Kullanıcı bu grupta üye değil, gruplar sayfasına yönlendir
          router.push('/groups');
          return;
        }
        
      } catch (error) {
        console.error('Grup bilgileri yüklenirken hata:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroupData();
  }, [id, user, router]);
  
  // İlerlemeyi alt görevlere göre hesapla
  useEffect(() => {
    if (subtasks.length === 0) {
      setProgress(0);
      return;
    }
    
    const completedCount = subtasks.filter(task => task.completed).length;
    const newProgress = Math.round((completedCount / subtasks.length) * 100);
    setProgress(newProgress);
  }, [subtasks]);
  
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    
    if (!tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    
    setTagInput('');
  };
  
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  const addSubtask = () => {
    const trimmedSubtask = subtaskInput.trim();
    if (!trimmedSubtask) return;
    
    const newSubtask = {
      id: Date.now().toString(),
      title: trimmedSubtask,
      completed: false
    };
    
    setSubtasks([...subtasks, newSubtask]);
    setSubtaskInput('');
  };
  
  const removeSubtask = (taskId) => {
    setSubtasks(subtasks.filter(task => task.id !== taskId));
  };
  
  const toggleSubtaskCompletion = (taskId) => {
    setSubtasks(subtasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleSubtaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Lütfen hedef başlığını girin');
      return;
    }
    
    if (!dueDate) {
      setError('Lütfen bir hedef tarihi belirleyin');
      return;
    }
    
    // Tarihin bugünden sonra olup olmadığını kontrol et
    const selectedDate = new Date(dueDate);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Bugünün başlangıcı
    
    if (selectedDate < currentDate) {
      setError('Hedef tarihi en erken bugün olabilir');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // İlerleme durumunu belirle
      const status = progress === 0 ? 'planned' : progress === 100 ? 'completed' : 'in_progress';
      
      // Yeni hedef oluştur
      const { data: goalData, error: goalError } = await supabase
        .from('group_goals')
        .insert({
          group_id: id,
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          status: status,
          progress: progress,
          priority: priority,
          tags: tags,
          subtasks: subtasks,
          creator_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (goalError) {
        console.error("Hedef oluşturulurken hata:", goalError);
        throw new Error("Hedef oluşturulamadı: " + goalError.message);
      }
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'create_goal',
        entity_type: 'goal',
        entity_id: goalData.id,
        details: { goal_title: title.trim() },
        created_at: new Date().toISOString()
      });
      
      alert('Hedef başarıyla oluşturuldu!');
      
      // Hedefler sayfasına yönlendir
      router.push(`/groups/${id}/goals`);
      
    } catch (error) {
      console.error('Hedef oluşturulurken hata:', error);
      setError(`Hedef oluşturulamadı: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (authLoading || loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }
  
  if (error && !group) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href={`/groups/${id}/goals`}
            className="btn-primary"
          >
            Hedefler Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!group) return null;

  // Öncelik renkleri 
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    medium: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center mb-6">
          <Link 
            href={`/groups/${id}/goals`}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
          >
            <FaArrowLeft className="inline" /> <span>Hedefler Sayfasına Geri Dön</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Yeni Hedef Oluştur</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{group.name} grubu için yeni bir hedef oluşturun</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 mb-6">
            <div>
              <label htmlFor="title" className="block mb-1 font-medium">Hedef Başlığı *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Hedef başlığı girin..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block mb-1 font-medium">Açıklama</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Hedefin açıklamasını girin..."
                rows={4}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueDate" className="block mb-1 font-medium">Hedef Tarihi *</label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Hedefin tamamlanması gereken tarihi seçin (en erken bugün)</p>
              </div>
              
              <div>
                <label htmlFor="priority" className="block mb-1 font-medium">Öncelik</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="tags" className="block mb-1 font-medium">Etiketler</label>
              <div className="flex gap-2">
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Etiket eklemek için yazın ve Enter'a basın..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  Ekle
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Etiketleri eklemek için Enter'a basın veya Ekle düğmesini kullanın
              </p>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm flex items-center gap-1"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-500 hover:text-red-500 focus:outline-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="subtasks" className="font-medium">Alt Görevler</label>
                <span className="text-sm text-gray-500">{subtasks.filter(t => t.completed).length}/{subtasks.length} tamamlandı</span>
              </div>
              
              <div className="flex gap-2 mb-2">
                <input
                  id="subtasks"
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                  className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Alt görev eklemek için yazın..."
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="px-3 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  <FaPlus />
                </button>
              </div>
              
              {subtasks.length > 0 && (
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                  {subtasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-2 flex-grow">
                        <button
                          type="button"
                          onClick={() => toggleSubtaskCompletion(task.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            task.completed 
                              ? 'bg-green-500 text-white' 
                              : 'border border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {task.completed && <FaCheck size={12} />}
                        </button>
                        <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubtask(task.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* İlerleme Çubuğu */}
              {subtasks.length > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Otomatik İlerleme: {progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Alt görevleri işaretledikçe ilerleme otomatik olarak hesaplanır
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link
              href={`/groups/${id}/goals`}
              className="btn-secondary mr-2"
            >
              İptal
            </Link>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={submitting}
            >
              <FaSave className="inline" /> <span>{submitting ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 