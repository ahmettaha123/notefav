import supabase from '../../../lib/supabase';
import { NextResponse } from 'next/server';

// Tüm grupları getir
export async function GET(request) {
  try {
    // Kullanıcının oturumunu kontrol et
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli' }, 
        { status: 401 }
      );
    }
    
    const user = session.user;
    
    // Kullanıcının üye olduğu tüm grupları getir
    const { data: memberGroups, error: memberError } = await supabase
      .from('group_members')
      .select(`
        group_id,
        role,
        groups (
          id,
          name,
          description,
          color,
          created_at,
          created_by,
          profiles (
            username,
            display_name
          )
        )
      `)
      .eq('user_id', user.id);
      
    if (memberError) {
      console.error('Gruplar alınırken hata:', memberError);
      return NextResponse.json(
        { error: 'Gruplar alınamadı' }, 
        { status: 500 }
      );
    }
    
    // Grupları lideri olduğu ve üye olduğu şeklinde ayır
    const leaderGroups = [];
    const memberOnlyGroups = [];
    
    memberGroups.forEach(item => {
      if (item.groups) {
        if (item.role === 'leader') {
          leaderGroups.push({
            ...item.groups,
            role: 'leader'
          });
        } else {
          memberOnlyGroups.push({
            ...item.groups,
            role: 'member'
          });
        }
      }
    });
    
    return NextResponse.json({
      leader: leaderGroups,
      member: memberOnlyGroups
    });
    
  } catch (error) {
    console.error('Gruplar alınırken genel hata:', error);
    return NextResponse.json(
      { error: 'Gruplar alınırken bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

// Yeni grup oluştur
export async function POST(request) {
  try {
    // Kullanıcının oturumunu kontrol et
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli' }, 
        { status: 401 }
      );
    }
    
    const user = session.user;
    
    // Kullanıcı profilini al
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      return NextResponse.json(
        { error: 'Kullanıcı profili bulunamadı' }, 
        { status: 404 }
      );
    }
    
    // İstek gövdesini al
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.name) {
      return NextResponse.json(
        { error: 'Grup adı gereklidir' }, 
        { status: 400 }
      );
    }
    
    // Yeni grubu veritabanına ekle
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: body.name,
        description: body.description || '',
        color: body.color || '#3B82F6',
        creator_id: profile.id
      })
      .select('*')
      .single();
      
    if (groupError) {
      console.error('Grup oluşturulurken hata:', groupError);
      return NextResponse.json(
        { error: 'Grup oluşturulamadı' }, 
        { status: 500 }
      );
    }
    
    // Oluşturan kişiyi grup lideri olarak ekle
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: profile.id,
        role: 'leader'
      });
      
    if (memberError) {
      console.error('Grup lideri eklenirken hata:', memberError);
      // Grubu silmeye gerek yok, cascade ile otomatik silinecek üyeler
      return NextResponse.json(
        { error: 'Grup oluşturuldu ancak lider atamasında hata oluştu' }, 
        { status: 500 }
      );
    }
    
    // Diğer üyeleri ekle (varsa)
    if (body.members && Array.isArray(body.members) && body.members.length > 0) {
      const memberInserts = body.members.map(member => ({
        group_id: group.id,
        user_id: member.id,
        role: 'member'
      }));
      
      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);
        
      if (membersError) {
        console.error('Grup üyeleri eklenirken hata:', membersError);
      }
    }
    
    // Grup oluşturma aktivitesini kaydet
    await supabase
      .from('group_activity')
      .insert({
        group_id: group.id,
        user_id: profile.id,
        action: 'group_created',
        entity_type: 'group',
        entity_id: group.id.toString()
      });
    
    return NextResponse.json({ group });
  } catch (error) {
    console.error('Grup oluşturulurken genel hata:', error);
    return NextResponse.json(
      { error: 'Grup oluşturulurken bir hata oluştu' }, 
      { status: 500 }
    );
  }
} 