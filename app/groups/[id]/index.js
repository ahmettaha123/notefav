import { createServerSupabaseClient } from '@/utils/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const supabase = createServerSupabaseClient();
    
    // Grup bilgilerini çek
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('id', id)
      .single();
      
    if (groupError) {
      return NextResponse.json(
        { error: 'Grup bilgileri bulunamadı' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({ group });
  } catch (error) {
    console.error('Grup detayları alınırken hata:', error);
    return NextResponse.json(
      { error: 'Grup bilgileri alınırken bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const supabase = createServerSupabaseClient();
    
    // Grup silme işlemi
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);
      
    if (error) {
      return NextResponse.json(
        { error: 'Grup silinemedi' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Grup silinirken hata:', error);
    return NextResponse.json(
      { error: 'Grup silinirken bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const supabase = createServerSupabaseClient();
    
    // Grup güncelleme işlemi
    const { data, error } = await supabase
      .from('groups')
      .update(body)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      return NextResponse.json(
        { error: 'Grup güncellenemedi' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ group: data });
  } catch (error) {
    console.error('Grup güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Grup güncellenirken bir hata oluştu' }, 
      { status: 500 }
    );
  }
} 