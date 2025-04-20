-- RLS politikalarını ve sonsuz döngü sorununu çözmek için en basit yaklaşım
BEGIN;

-- Tüm mevcut politikaları temizle
DROP POLICY IF EXISTS group_members_insert_policy ON group_members;
DROP POLICY IF EXISTS group_members_update_policy ON group_members;
DROP POLICY IF EXISTS group_members_delete_policy ON group_members;
DROP POLICY IF EXISTS group_members_select_policy ON group_members;
DROP POLICY IF EXISTS group_members_insert_first_member_policy ON group_members;
DROP POLICY IF EXISTS group_members_insert_other_members_policy ON group_members;
DROP POLICY IF EXISTS group_members_own_policy ON group_members;
DROP POLICY IF EXISTS group_members_own_select_policy ON group_members;
DROP POLICY IF EXISTS group_members_own_delete_policy ON group_members;
DROP POLICY IF EXISTS group_members_leader_policy ON group_members;

DROP POLICY IF EXISTS groups_select_policy ON groups;
DROP POLICY IF EXISTS groups_insert_policy ON groups;
DROP POLICY IF EXISTS groups_update_policy ON groups;
DROP POLICY IF EXISTS groups_delete_policy ON groups;
DROP POLICY IF EXISTS groups_member_policy ON groups;

-- RLS'yi tamamen devre dışı bırak
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;

-- Role değerini güncelle
ALTER TABLE group_members 
    ALTER COLUMN role SET DEFAULT 'member';
    
-- Mevcut 'viewer' değerlerini 'member' olarak güncelle
UPDATE group_members
SET role = 'member'
WHERE role = 'viewer';

-- RLS'yi kapalı bırakalım (test etmek için)
-- NOT: Uygulamanız test edilip, sorunlar giderildikten sonra 
-- daha güvenli RLS politikaları eklenebilir

COMMENT ON TABLE group_members IS 'Bir gruba ait üyelerin bilgileri ve rolleri';
COMMENT ON COLUMN group_members.role IS 'Üyenin roldür: leader veya member. Varsayılan olarak member';

-- Grup üyeleri rollerini genişletme ve yetki kontrolü ekleme

-- Önce rol alanını güncelleyelim (varsayılan member, diğer roller: admin, leader)
ALTER TABLE group_members 
  DROP CONSTRAINT IF EXISTS group_members_role_check,
  ADD CONSTRAINT group_members_role_check 
  CHECK (role IN ('member', 'admin', 'leader'));

-- Rol açıklamaları:
-- leader: Grup lideri, tüm yetkilere sahip
-- admin: Yönetici, içerik ekleyebilir, düzenleyebilir ama grup ayarlarını değiştiremez
-- member: Üye, sadece içerikleri görüntüleyebilir

-- Grup içinde yetki kontrolü için fonksiyon
CREATE OR REPLACE FUNCTION check_group_permission(
  p_group_id INTEGER,
  p_user_id UUID,
  p_permission VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR(20);
  v_is_creator BOOLEAN;
BEGIN
  -- Kullanıcının rolünü al
  SELECT role INTO v_role 
  FROM group_members 
  WHERE group_id = p_group_id AND user_id = p_user_id;
  
  -- Grup yaratıcısını kontrol et
  SELECT (created_by = p_user_id) INTO v_is_creator 
  FROM groups 
  WHERE id = p_group_id;
  
  -- Grup yaratıcısı her zaman tüm yetkilere sahiptir
  IF v_is_creator THEN
    RETURN TRUE;
  END IF;
  
  -- Rol bazlı yetki kontrolü
  CASE p_permission
    WHEN 'view' THEN
      -- Tüm üyeler görüntüleyebilir
      RETURN v_role IN ('member', 'admin', 'leader');
    WHEN 'create' THEN
      -- Admin ve lider içerik ekleyebilir
      RETURN v_role IN ('admin', 'leader');
    WHEN 'edit' THEN
      -- Admin ve lider içerik düzenleyebilir
      RETURN v_role IN ('admin', 'leader');
    WHEN 'delete' THEN
      -- Admin ve lider içerik silebilir
      RETURN v_role IN ('admin', 'leader');
    WHEN 'manage_members' THEN
      -- Sadece lider üyeleri yönetebilir
      RETURN v_role = 'leader';
    WHEN 'change_settings' THEN
      -- Sadece lider grup ayarlarını değiştirebilir
      RETURN v_role = 'leader';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- RLS politikalarını güncelle

-- Grup notları için yetki politikaları
DROP POLICY IF EXISTS group_notes_select_policy ON group_notes;
CREATE POLICY group_notes_select_policy ON group_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_notes.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS group_notes_insert_policy ON group_notes;
CREATE POLICY group_notes_insert_policy ON group_notes
  FOR INSERT WITH CHECK (
    check_group_permission(group_id, auth.uid(), 'create')
  );

DROP POLICY IF EXISTS group_notes_update_policy ON group_notes;
CREATE POLICY group_notes_update_policy ON group_notes
  FOR UPDATE USING (
    check_group_permission(group_id, auth.uid(), 'edit')
  );

DROP POLICY IF EXISTS group_notes_delete_policy ON group_notes;
CREATE POLICY group_notes_delete_policy ON group_notes
  FOR DELETE USING (
    check_group_permission(group_id, auth.uid(), 'delete')
  );

-- Grup hedefleri için yetki politikaları
DROP POLICY IF EXISTS group_goals_select_policy ON group_goals;
CREATE POLICY group_goals_select_policy ON group_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_goals.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS group_goals_insert_policy ON group_goals;
CREATE POLICY group_goals_insert_policy ON group_goals
  FOR INSERT WITH CHECK (
    check_group_permission(group_id, auth.uid(), 'create')
  );

DROP POLICY IF EXISTS group_goals_update_policy ON group_goals;
CREATE POLICY group_goals_update_policy ON group_goals
  FOR UPDATE USING (
    check_group_permission(group_id, auth.uid(), 'edit')
  );

DROP POLICY IF EXISTS group_goals_delete_policy ON group_goals;
CREATE POLICY group_goals_delete_policy ON group_goals
  FOR DELETE USING (
    check_group_permission(group_id, auth.uid(), 'delete')
  );

-- Grup üyeleri için yetki politikaları
DROP POLICY IF EXISTS group_members_select_policy ON group_members;
CREATE POLICY group_members_select_policy ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members AS gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS group_members_insert_policy ON group_members;
CREATE POLICY group_members_insert_policy ON group_members
  FOR INSERT WITH CHECK (
    check_group_permission(group_id, auth.uid(), 'manage_members')
  );

DROP POLICY IF EXISTS group_members_update_policy ON group_members;
CREATE POLICY group_members_update_policy ON group_members
  FOR UPDATE USING (
    check_group_permission(group_id, auth.uid(), 'manage_members')
  );

DROP POLICY IF EXISTS group_members_delete_policy ON group_members;
CREATE POLICY group_members_delete_policy ON group_members
  FOR DELETE USING (
    check_group_permission(group_id, auth.uid(), 'manage_members')
  );

-- Grup tablosu için yetki politikaları
DROP POLICY IF EXISTS groups_select_policy ON groups;
CREATE POLICY groups_select_policy ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS groups_update_policy ON groups;
CREATE POLICY groups_update_policy ON groups
  FOR UPDATE USING (
    check_group_permission(id, auth.uid(), 'change_settings')
  );

-- Güncelleme fonksiyonu (rolü değiştirmek için)
CREATE OR REPLACE FUNCTION update_member_role(
  p_group_id INTEGER,
  p_user_id UUID,
  p_new_role VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_user_role VARCHAR(20);
  v_target_user_role VARCHAR(20);
  v_is_creator BOOLEAN;
BEGIN
  -- İşlemi yapan kullanıcının rolünü kontrol et
  SELECT role INTO v_current_user_role 
  FROM group_members 
  WHERE group_id = p_group_id AND user_id = auth.uid();
  
  -- Hedef kullanıcının rolünü al
  SELECT role INTO v_target_user_role 
  FROM group_members 
  WHERE group_id = p_group_id AND user_id = p_user_id;
  
  -- Grup yaratıcısını kontrol et
  SELECT (created_by = p_user_id) INTO v_is_creator 
  FROM groups 
  WHERE id = p_group_id;
  
  -- Grup yaratıcısının rolü değiştirilemez
  IF v_is_creator THEN
    RAISE EXCEPTION 'Grup kurucusunun rolü değiştirilemez';
    RETURN FALSE;
  END IF;
  
  -- Sadece liderler rol değiştirebilir
  IF v_current_user_role = 'leader' THEN
    UPDATE group_members
    SET role = p_new_role
    WHERE group_id = p_group_id AND user_id = p_user_id;
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Rol değiştirme yetkisine sahip değilsiniz';
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT; 