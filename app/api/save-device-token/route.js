import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, token, device, platform } = await request.json();
    
    if (!userId || !token) {
      return NextResponse.json({ error: "UserId ve token gerekli" }, { status: 400 });
    }
    
    // Supabase bağlantısı
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Önce bu token'a sahip bir kayıt var mı kontrol et
    const { data: existingToken } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('token', token)
      .eq('user_id', userId)
      .single();
      
    if (existingToken) {
      // Token zaten var, güncelle
      const { error } = await supabase
        .from('device_tokens')
        .update({
          last_used: new Date().toISOString(),
          platform: platform || existingToken.platform,
          device_type: device || existingToken.device_type
        })
        .eq('id', existingToken.id);
        
      if (error) throw error;
    } else {
      // Yeni token ekle
      const { error } = await supabase
        .from('device_tokens')
        .insert({
          user_id: userId,
          token,
          device_type: device || 'unknown',
          platform: platform || 'unknown',
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token kayıt hatası:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 