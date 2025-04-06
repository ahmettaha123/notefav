-- RLS politikalarını güncelleyelim
BEGIN;

-- group_notes tablosu için RLS politikaları

-- Mevcut politikaları temizleyelim (varsa)
DROP POLICY IF EXISTS group_notes_select_policy ON group_notes;
DROP POLICY IF EXISTS group_notes_insert_policy ON group_notes;
DROP POLICY IF EXISTS group_notes_update_policy ON group_notes;
DROP POLICY IF EXISTS group_notes_delete_policy ON group_notes;

-- Grup notları görüntüleme politikası: Grup üyeleri görebilir
CREATE POLICY group_notes_select_policy ON group_notes
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_notes.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Grup notları ekleme politikası: Grup üyeleri ekleyebilir
CREATE POLICY group_notes_insert_policy ON group_notes
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_notes.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Grup notları güncelleme politikası: Not sahibi veya grup lideri güncelleyebilir
CREATE POLICY group_notes_update_policy ON group_notes
    FOR UPDATE
    TO public
    USING (
        -- Not sahibi
        creator_id = auth.uid()
        OR 
        -- Grup lideri
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_notes.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'leader'
        )
    );

-- Grup notları silme politikası: Not sahibi veya grup lideri silebilir
CREATE POLICY group_notes_delete_policy ON group_notes
    FOR DELETE
    TO public
    USING (
        -- Not sahibi
        creator_id = auth.uid()
        OR
        -- Grup lideri
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_notes.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'leader'
        )
    );

-- Grup hedefleri için de benzer politikaları oluşturalım
DROP POLICY IF EXISTS group_goals_select_policy ON group_goals;
DROP POLICY IF EXISTS group_goals_insert_policy ON group_goals;
DROP POLICY IF EXISTS group_goals_update_policy ON group_goals;
DROP POLICY IF EXISTS group_goals_delete_policy ON group_goals;

-- Grup hedefleri görüntüleme politikası: Grup üyeleri görebilir
CREATE POLICY group_goals_select_policy ON group_goals
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_goals.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Grup hedefleri ekleme politikası: Grup üyeleri ekleyebilir
CREATE POLICY group_goals_insert_policy ON group_goals
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_goals.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Grup hedefleri güncelleme politikası: Hedef sahibi veya grup lideri güncelleyebilir
CREATE POLICY group_goals_update_policy ON group_goals
    FOR UPDATE
    TO public
    USING (
        -- Hedef sahibi
        creator_id = auth.uid()
        OR 
        -- Grup lideri
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_goals.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'leader'
        )
    );

-- Grup hedefleri silme politikası: Hedef sahibi veya grup lideri silebilir
CREATE POLICY group_goals_delete_policy ON group_goals
    FOR DELETE
    TO public
    USING (
        -- Hedef sahibi
        creator_id = auth.uid()
        OR
        -- Grup lideri
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_members.group_id = group_goals.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'leader'
        )
    );

COMMIT; 