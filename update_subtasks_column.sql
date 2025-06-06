ALTER TABLE goals ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::JSONB;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date TIMESTAMP WITH TIME ZONE;

-- Grup sistemi tabloları oluşturma
-- Gruplar tablosu
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3b82f6',
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eksik sütun varsa ekle veya eski sütun adını güncelle
DO $$ 
BEGIN
  -- Sütun zaten creator_id olarak varsa, hiçbir şey yapma
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'groups' AND column_name = 'creator_id') THEN
    -- Do nothing
  -- Eğer created_by sütunu varsa, adını creator_id olarak değiştir
  ELSIF EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'groups' AND column_name = 'created_by') THEN
    ALTER TABLE groups RENAME COLUMN created_by TO creator_id;
  END IF;
END $$;

-- Grup üyeleri tablosu
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'leader' veya 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Grup notları tablosu
CREATE TABLE IF NOT EXISTS group_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES profiles(id),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, note_id)
);

-- Grup hedefleri tablosu
CREATE TABLE IF NOT EXISTS group_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed'
  progress INTEGER DEFAULT 0,
  subtasks JSONB DEFAULT '[]'::JSONB,
  target_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grup aktiviteleri tablosu
CREATE TABLE IF NOT EXISTS group_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL, -- 'create', 'join', 'leave', 'share_note', 'create_goal', vb.
  entity_type VARCHAR(50), -- 'note', 'goal', 'group', vb.
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security politikaları
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activity ENABLE ROW LEVEL SECURITY;

-- Grup tablosu politikaları (creator_id sütun adına göre güncellendi)
CREATE POLICY groups_select_policy ON groups 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id AND 
            group_members.user_id = auth.uid()
    )
  );

CREATE POLICY groups_insert_policy ON groups 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY groups_update_policy ON groups 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id AND 
            group_members.user_id = auth.uid() AND 
            group_members.role = 'leader'
    )
  );

-- created_by yerine creator_id kullanılacak
CREATE POLICY groups_delete_policy ON groups 
  FOR DELETE USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id AND 
            group_members.user_id = auth.uid() AND 
            group_members.role = 'leader'
    )
  );

-- Grup üyeleri tablosu politikaları
CREATE POLICY group_members_select_policy ON group_members 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members AS gm
      WHERE gm.group_id = group_members.group_id AND 
            gm.user_id = auth.uid()
    )
  );

CREATE POLICY group_members_insert_policy ON group_members 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      -- Kullanıcı kendisini ekliyor (grup oluşturma durumu)
      group_members.user_id = auth.uid() OR
      -- Kullanıcı grubun lideri ise başkalarını ekleyebilir
      EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_members.group_id = group_id AND 
              group_members.user_id = auth.uid() AND 
              group_members.role = 'leader'
      )
    )
  );
-- Diğer tablolar için benzer politikalar

