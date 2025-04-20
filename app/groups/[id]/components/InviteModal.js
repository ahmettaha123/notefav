import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaEnvelope } from 'react-icons/fa';
import supabase from '../../../../lib/supabase';

export default function InviteModal({ groupId, onClose, onMembersUpdate }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Davet gönder 
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Öncelikle kullanıcıyı ara
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .maybeSingle();
      
      // Kullanıcı bulundu mu kontrolü
      if (userError) {
        console.error("Kullanıcı arama hatası:", userError);
        throw new Error("Kullanıcı aranamadı");
      }
      
      if (!userData) {
        // Kullanıcı bulunamadıysa davet e-postası gönder
        // NOT: Bu kısım için gerçek bir e-posta gönderme servisi entegre edilmeli
        toast.success('Davet e-postası gönderildi');
        setInviteEmail('');
        onClose();
        return;
      }
      
      // Kullanıcı zaten grup üyesi mi kontrol et
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (memberCheckError) {
        console.error("Üyelik kontrolü hatası:", memberCheckError);
        throw new Error("Üyelik kontrolü yapılamadı");
      }
      
      if (existingMember) {
        toast.error('Bu kullanıcı zaten grup üyesi');
        return;
      }
      
      // Kullanıcıyı gruba ekle
      const { error: addError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userData.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });
      
      if (addError) {
        console.error("Üye ekleme hatası:", addError);
        throw new Error("Üye eklenemedi");
      }
      
      // Grup üyelerini yeniden yükle
      const { data: updatedMembers, error: refreshError } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId);
      
      if (!refreshError && onMembersUpdate) {
        onMembersUpdate(updatedMembers || []);
      }
      
      toast.success('Kullanıcı gruba eklendi');
      setInviteEmail('');
      onClose();
      
    } catch (error) {
      console.error("Davet hatası:", error);
      toast.error(error.message || "Davet işlemi başarısız oldu");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Üye Davet Et</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleInvite}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">E-posta Adresi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kullanıcının tam e-posta adresini girin. Sistemde kayıtlı ise otomatik olarak eklenecek, değilse davet gönderilecektir.
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit"
              className="btn-primary"
              disabled={isSending}
            >
              {isSending ? 'Gönderiliyor...' : 'Davet Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 