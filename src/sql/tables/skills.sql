CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    original_skill_name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by skill name
CREATE INDEX IF NOT EXISTS idx_skills_original_skill_name ON skills(original_skill_name);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);


