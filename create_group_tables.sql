-- Grup tabloları oluşturma
-- Gruplar tablosu
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3B82F6',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grup üyeleri tablosu
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- Grup notları tablosu
CREATE TABLE IF NOT EXISTS group_notes (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES profiles(id),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grup hedefleri tablosu
CREATE TABLE IF NOT EXISTS group_goals (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  subtasks JSONB DEFAULT '[]'::JSONB,
  status VARCHAR(20) DEFAULT 'planned',
  target_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grup aktiviteleri
CREATE TABLE IF NOT EXISTS group_activity (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lider değiştirme işlemi için fonksiyon
CREATE OR REPLACE FUNCTION promote_to_leader(
  p_group_id INTEGER,
  p_current_leader_id UUID,
  p_new_leader_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Mevcut liderin rolünü üye olarak güncelle
  UPDATE group_members
  SET role = 'member'
  WHERE group_id = p_group_id AND user_id = p_current_leader_id;
  
  -- Yeni lideri ata
  UPDATE group_members
  SET role = 'leader'
  WHERE group_id = p_group_id AND user_id = p_new_leader_id;
END;
$$ LANGUAGE plpgsql; 