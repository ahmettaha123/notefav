/**
 * Bildirim sistemi - NoteFav uygulaması için bildirim fonksiyonları
 */

// Firebase için import ekleyelim (kullanıcı tarafında kurulmalı)
let firebaseMessaging = null;

// FCM yapılandırması
export const initializeFirebase = () => {
  if (typeof window !== 'undefined' && 'firebase' in window) {
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      
      const app = window.firebase.initializeApp(firebaseConfig);
      firebaseMessaging = window.firebase.messaging(app);
      
      // Service worker kaydı
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then(registration => {
            firebaseMessaging.useServiceWorker(registration);
          })
          .catch(err => {
            console.error('Service worker kaydı başarısız:', err);
          });
      }
      
      return true;
    } catch (error) {
      console.error('Firebase başlatma hatası:', error);
      return false;
    }
  }
  return false;
};

// FCM token alımı
export const getFCMToken = async () => {
  if (!firebaseMessaging) {
    const initialized = initializeFirebase();
    if (!initialized) return null;
  }
  
  try {
    const currentToken = await firebaseMessaging.getToken();
    if (currentToken) {
      // Token'ı sunucuda sakla
      saveFCMTokenToServer(currentToken);
      return currentToken;
    } else {
      console.log('FCM token alınamadı');
      return null;
    }
  } catch (error) {
    console.error('FCM token alma hatası:', error);
    return null;
  }
};

// Token'ı sunucu tarafında sakla
const saveFCMTokenToServer = async (token) => {
  if (!token || typeof window === 'undefined') return;
  
  try {
    // Kullanıcı giriş yapmışsa token'ı sunucuya gönder
    const user = JSON.parse(localStorage.getItem('supabase.auth.token'))?.user;
    if (user && user.id) {
      const response = await fetch('/api/save-device-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          token,
          device: 'web', // veya 'android', 'ios'
          platform: navigator.userAgent
        }),
      });
      
      if (response.ok) {
        console.log('FCM token sunucuya kaydedildi');
      }
    } else {
      // Kullanıcı giriş yapmamışsa token'ı local storage'da sakla
      localStorage.setItem('fcm_token', token);
    }
  } catch (error) {
    console.error('Token kaydetme hatası:', error);
  }
};

// Firebase ile bildirim gönderme (Client-Side)
export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification: {
          title,
          body,
          data
        }
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Push bildirim gönderme hatası:', error);
    return false;
  }
};

/**
 * Tarayıcı bildirimlerine izin isteme
 * @returns {Promise<boolean>} İzin durumu
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Bu tarayıcı bildirimler için destek sağlamıyor');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Kullanıcıya bildirim gönderme
 * @param {string} title - Bildirim başlığı
 * @param {Object} options - Bildirim seçenekleri
 * @returns {Notification|null} Bildirim nesnesi
 */
export function sendNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    // Tarayıcı bildirim desteklemiyor veya izin verilmemiş
    return null;
  }

  const defaultOptions = {
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    silent: false
  };

  const mergedOptions = { ...defaultOptions, ...options };
  return new Notification(title, mergedOptions);
}

/**
 * Hedef tarihine göre bildirim zamanlaması
 * @param {Object} goal - Hedef nesnesi
 * @returns {Object} - Bildirim bilgileri
 */
export function getGoalNotificationInfo(goal) {
  if (!goal || !goal.target_date) return { shouldNotify: false };

  const now = new Date();
  const targetDate = new Date(goal.target_date);
  const differenceInMs = targetDate.getTime() - now.getTime();
  const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));

  // Hedef tarihi geçmişse
  if (differenceInDays < 0) {
    return { 
      shouldNotify: true,
      priority: 'high',
      message: `"${goal.title}" hedefinin son tarihi geçti!`,
      type: 'deadline_passed'
    };
  }

  // Son gün
  if (differenceInDays === 0) {
    return { 
      shouldNotify: true, 
      priority: 'high',
      message: `"${goal.title}" hedefi bugün tamamlanmalı!`,
      type: 'due_today'
    };
  }
  
  // Son güne 1 gün kala
  if (differenceInDays === 1) {
    return { 
      shouldNotify: true, 
      priority: 'high',
      message: `"${goal.title}" hedefinin tamamlanmasına 1 gün kaldı!`,
      type: 'due_tomorrow'
    };
  }

  // Son güne 3 gün kala
  if (differenceInDays === 3) {
    return { 
      shouldNotify: true, 
      priority: 'medium',
      message: `"${goal.title}" hedefinin tamamlanmasına 3 gün kaldı!`,
      type: 'due_soon'
    };
  }

  // Son güne 7 gün kala
  if (differenceInDays === 7) {
    return { 
      shouldNotify: true, 
      priority: 'low',
      message: `"${goal.title}" hedefinin tamamlanmasına 1 hafta kaldı!`,
      type: 'due_week'
    };
  }

  return { shouldNotify: false };
}

/**
 * Hedefleri kontrol edip bildirim gönderme
 * @param {Array} goals - Kullanıcının hedefleri
 */
export function checkGoalsAndNotify(goals) {
  if (!goals || !Array.isArray(goals) || goals.length === 0) return;

  goals.forEach(goal => {
    // Tamamlanmış hedefler için bildirim gönderme
    if (goal.progress === 100) return;

    const notificationInfo = getGoalNotificationInfo(goal);
    
    if (notificationInfo.shouldNotify) {
      const options = {
        body: notificationInfo.message,
        data: {
          goalId: goal.id,
          type: notificationInfo.type,
          url: `/goals/${goal.id}`
        },
        requireInteraction: notificationInfo.priority === 'high',
        // serviceWorker aktif ise eklenebilir
        // actions: [
        //   {
        //     action: 'view',
        //     title: 'Görüntüle'
        //   }
        // ]
      };
      
      sendNotification('NoteFav Hedef Hatırlatıcı', options);
      
      // Local Storage'a bildirim kaydı
      saveNotificationToStorage({
        id: Date.now(),
        goalId: goal.id,
        title: 'Hedef Hatırlatıcı',
        message: notificationInfo.message,
        type: notificationInfo.type,
        priority: notificationInfo.priority,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  });
}

/**
 * Bildirimi local storage'a kaydetme
 * @param {Object} notification - Bildirim nesnesi
 */
export function saveNotificationToStorage(notification) {
  if (typeof window === 'undefined') return;
  
  const existingNotifications = getNotificationsFromStorage();
  const updatedNotifications = [notification, ...existingNotifications];
  
  // Son 50 bildirimi sakla
  const limitedNotifications = updatedNotifications.slice(0, 50);
  
  localStorage.setItem('notefav_notifications', JSON.stringify(limitedNotifications));
}

/**
 * Kullanıcı bildirimlerini yerel depolamadan almak için fonksiyon
 * @returns {Array} Bildirimler dizisi
 */
export const getNotificationsFromStorage = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedNotifications = localStorage.getItem('notifications');
    return storedNotifications ? JSON.parse(storedNotifications) : [];
  } catch (error) {
    console.error('Bildirimler alınırken hata oluştu:', error);
    return [];
  }
};

/**
 * Bildirim okundu olarak işaretleme
 * @param {string} notificationId - Bildirim ID'si
 * @returns {Array} Güncellenmiş bildirimler dizisi
 */
export const markNotificationAsRead = (notificationId) => {
  if (typeof window === 'undefined') return [];
  
  try {
    const notifications = getNotificationsFromStorage();
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    return updatedNotifications;
  } catch (error) {
    console.error('Bildirim okundu olarak işaretlenirken hata oluştu:', error);
    return [];
  }
};

/**
 * Tüm bildirimleri okundu olarak işaretleme
 * @returns {Array} Güncellenmiş bildirimler dizisi
 */
export const markAllNotificationsAsRead = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const notifications = getNotificationsFromStorage();
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    return updatedNotifications;
  } catch (error) {
    console.error('Tüm bildirimler okundu olarak işaretlenirken hata oluştu:', error);
    return [];
  }
};

/**
 * Yeni bildirim ekleme
 * @param {Object} notification - Bildirim nesnesi
 * @returns {Array} Güncellenmiş bildirimler dizisi
 */
export const addNotification = (notification) => {
  if (typeof window === 'undefined') return [];
  
  try {
    const notifications = getNotificationsFromStorage();
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'normal',
      ...notification
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    return updatedNotifications;
  } catch (error) {
    console.error('Bildirim eklenirken hata oluştu:', error);
    return [];
  }
};

/**
 * Bildirim silme
 * @param {string} notificationId - Bildirim ID'si
 * @returns {Array} Güncellenmiş bildirimler dizisi
 */
export const deleteNotification = (notificationId) => {
  if (typeof window === 'undefined') return [];
  
  try {
    const notifications = getNotificationsFromStorage();
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    return updatedNotifications;
  } catch (error) {
    console.error('Bildirim silinirken hata oluştu:', error);
    return [];
  }
};

/**
 * Tüm bildirimleri temizleme
 * @returns {Array} Güncellenmiş bildirimler dizisi
 */
export const clearAllNotifications = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    localStorage.setItem('notifications', JSON.stringify([]));
    return [];
  } catch (error) {
    console.error('Tüm bildirimler temizlenirken hata oluştu:', error);
    return [];
  }
};

/**
 * Test için örnek bildirim oluşturma
 * @returns {Array} Oluşturulan bildirimler dizisi
 */
export const createTestNotifications = () => {
  const testNotifications = [
    {
      id: '1',
      title: 'Hoş Geldiniz',
      message: 'NoteFav uygulamasına hoş geldiniz! Hemen notlarınızı oluşturmaya başlayabilirsiniz.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 dakika önce
      read: false,
      priority: 'normal',
      data: {
        url: '/notes'
      }
    },
    {
      id: '2',
      title: 'Hedef Hatırlatıcı',
      message: 'Bu haftaki hedeflerinizi gözden geçirmeyi unutmayın. İki hedef eksik.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 saat önce
      read: true,
      priority: 'medium',
      data: {
        url: '/goals'
      }
    },
    {
      id: '3',
      title: 'Grup Davetiyesi',
      message: 'Ahmet sizi "Yazılım Projeleri" grubuna davet etti.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 gün önce
      read: false,
      priority: 'high',
      data: {
        url: '/groups',
        groupId: '123'
      }
    },
    {
      id: '4',
      title: 'İstatistikler Güncellemeleri',
      message: 'Bu ay 15 not oluşturdunuz ve 5 hedef tamamladınız. Harika iş!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 gün önce
      read: true,
      priority: 'normal',
      data: {
        url: '/dashboard'
      }
    },
    {
      id: '5',
      title: 'Yeni Özellik',
      message: 'Şimdi notlarınıza etiket ekleyebilirsiniz. Hemen deneyin!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 gün önce
      read: false,
      priority: 'medium',
      data: {
        url: '/features'
      }
    },
    {
      id: '6',
      title: 'Sistem Bakımı',
      message: 'Sistemimiz yarın gece 02:00-04:00 arasında bakımda olacaktır.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 gün önce
      read: true,
      priority: 'high',
      data: {
        url: '/help'
      }
    }
  ];
  
  localStorage.setItem('notifications', JSON.stringify(testNotifications));
  return testNotifications;
}; 