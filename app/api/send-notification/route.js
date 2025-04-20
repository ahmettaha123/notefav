import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, title, body, data } = await request.json();
    
    if (!userId || !title || !body) {
      return NextResponse.json({ error: "UserId, title ve body gerekli" }, { status: 400 });
    }
    
    // Supabase bağlantısı
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Kullanıcının cihaz token'larını al
    const { data: deviceTokens, error } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    if (!deviceTokens || deviceTokens.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Kullanıcıya ait kayıtlı cihaz bulunamadı" 
      });
    }
    
    // FCM API için istek
    const fcmTokens = deviceTokens.map(dt => dt.token);
    const fcmResponse = await sendFCMNotification(fcmTokens, title, body, data);
    
    return NextResponse.json({ 
      success: true, 
      sent: fcmTokens.length,
      fcmResponse 
    });
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendFCMNotification(tokens, title, body, data = {}) {
  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    tokens: tokens,
  };

  try {
    // Firebase Admin SDK'nın import'u burada yapılmalı
    // Not: Gerçek uygulamada, Firebase Admin SDK kullanılmalı
    // Bu örnekte HTTP API kullanarak gösteriliyor
    const response = await fetch('https://fcm.googleapis.com/v1/projects/' + 
      process.env.FIREBASE_PROJECT_ID + '/messages:send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.FIREBASE_SERVER_KEY
      },
      body: JSON.stringify({
        message
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('FCM gönderim hatası:', error);
    throw error;
  }
} 