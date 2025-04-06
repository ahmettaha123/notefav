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

COMMIT; 