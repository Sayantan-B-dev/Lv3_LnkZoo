-- ─────────────────────────────────────────
-- TOPIC TAXONOMY (curated, admin-managed)
-- Single topic (subtopic) per link; topic-types are
-- parent groupings (not link-bonded).
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS topics (
  id          SERIAL PRIMARY KEY,
  parent_id   INT REFERENCES topics(id) ON DELETE CASCADE,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(20),
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_id);

ALTER TABLE links ADD COLUMN IF NOT EXISTS topic_id INT REFERENCES topics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_links_topic_id ON links(topic_id);

-- ── Seed: 9 topic-types (parents) ──────────
INSERT INTO topics (id, parent_id, slug, name, color, sort_order) VALUES
  (1,  NULL, 'programming-languages', 'Programming & Languages', '#5eead4', 1),
  (2,  NULL, 'ai-data',             'AI & Data',                '#a78bfa', 2),
  (3,  NULL, 'web-cloud',           'Web & Cloud',              '#60a5fa', 3),
  (4,  NULL, 'security-blockchain', 'Security & Blockchain',    '#f87171', 4),
  (5,  NULL, 'engineering-open-source', 'Engineering & Open Source', '#fbbf24', 5),
  (6,  NULL, 'science-math',        'Science & Math',            '#34d399', 6),
  (7,  NULL, 'business-career',     'Business & Career',         '#f472b6', 7),
  (8,  NULL, 'design-creative',     'Design & Creative',         '#fb923c', 8),
  (9,  NULL, 'life-culture',       'Life & Culture',           '#22d3ee', 9)
ON CONFLICT (id) DO NOTHING;

-- ── Seed: subtopics (children, link-bonded) ──
INSERT INTO topics (id, parent_id, slug, name, color, sort_order) VALUES
  -- 1 Programming & Languages
  (11, 1, 'programming',        'Programming',          '#5eead4', 1),
  (12, 1, 'python',             'Python',               '#5eead4', 2),
  (13, 1, 'javascript-typescript','JavaScript/TypeScript', '#5eead4', 3),
  (14, 1, 'rust',              'Rust',                '#5eead4', 4),
  (15, 1, 'go',                'Go',                  '#5eead4', 5),
  (16, 1, 'systems-programming','Systems Programming',    '#5eead4', 6),
  -- 2 AI & Data
  (21, 2, 'ai-ml',             'AI & ML',              '#a78bfa', 1),
  (22, 2, 'machine-learning',   'Machine Learning',       '#a78bfa', 2),
  (23, 2, 'llms-prompting',    'LLMs & Prompting',     '#a78bfa', 3),
  (24, 2, 'data-science',       'Data Science',          '#a78bfa', 4),
  (25, 2, 'databases',         'Databases',            '#a78bfa', 5),
  (26, 2, 'sql',               'SQL',                 '#a78bfa', 6),
  -- 3 Web & Cloud
  (31, 3, 'web-development',    'Web Development',       '#60a5fa', 1),
  (32, 3, 'frontend',          'Frontend',             '#60a5fa', 2),
  (33, 3, 'backend',           'Backend',              '#60a5fa', 3),
  (34, 3, 'apis',              'APIs',                 '#60a5fa', 4),
  (35, 3, 'devops',            'DevOps',               '#60a5fa', 5),
  (36, 3, 'cloud-infra',       'Cloud & Infra',         '#60a5fa', 6),
  (37, 3, 'kubernetes',        'Kubernetes',           '#60a5fa', 7),
  (38, 3, 'linux',             'Linux',                '#60a5fa', 8),
  (39, 3, 'networking',        'Networking',           '#60a5fa', 9),
  -- 4 Security & Blockchain
  (41, 4, 'cybersecurity',     'Cybersecurity',         '#f87171', 1),
  (42, 4, 'blockchain-web3',   'Blockchain & Web3',    '#f87171', 2),
  (43, 4, 'crypto',            'Crypto',               '#f87171', 3),
  -- 5 Engineering & Open Source
  (51, 5, 'software-architecture','Software Architecture',  '#fbbf24', 1),
  (52, 5, 'open-source',       'Open Source',          '#fbbf24', 2),
  (53, 5, 'developer-tools',    'Developer Tools',       '#fbbf24', 3),
  (54, 5, 'testing-qa',        'Testing & QA',          '#fbbf24', 4),
  (55, 5, 'mobile-dev',        'Mobile Dev',            '#fbbf24', 5),
  (56, 5, 'game-dev',          'Game Dev',             '#fbbf24', 6),
  (57, 5, 'hardware',          'Hardware',              '#fbbf24', 7),
  (58, 5, 'iot',               'IoT',                  '#fbbf24', 8),
  -- 6 Science & Math
  (61, 6, 'mathematics',        'Mathematics',           '#34d399', 1),
  (62, 6, 'physics',           'Physics',               '#34d399', 2),
  (63, 6, 'biology',            'Biology',               '#34d399', 3),
  (64, 6, 'chemistry',         'Chemistry',             '#34d399', 4),
  (65, 6, 'astronomy',         'Astronomy',             '#34d399', 5),
  (66, 6, 'research',          'Research',              '#34d399', 6),
  -- 7 Business & Career
  (71, 7, 'startups',          'Startups',              '#f472b6', 1),
  (72, 7, 'business',          'Business',              '#f472b6', 2),
  (73, 7, 'finance',           'Finance',               '#f472b6', 3),
  (74, 7, 'marketing',         'Marketing',             '#f472b6', 4),
  (75, 7, 'productivity',      'Productivity',          '#f472b6', 5),
  (76, 7, 'career',            'Career',                '#f472b6', 6),
  -- 8 Design & Creative
  (81, 8, 'design',            'Design',               '#fb923c', 1),
  (82, 8, 'ui-ux',            'UI/UX',                '#fb923c', 2),
  (83, 8, 'art-photography',   'Art & Photography',     '#fb923c', 3),
  (84, 8, 'music',             'Music',                 '#fb923c', 4),
  (85, 8, 'writing-books',     'Writing & Books',       '#fb923c', 5),
  (86, 8, 'video-film',        'Video & Film',          '#fb923c', 6),
  -- 9 Life & Culture
  (91, 9, 'health-fitness',     'Health & Fitness',      '#22d3ee', 1),
  (92, 9, 'education',         'Education',             '#22d3ee', 2),
  (93, 9, 'gaming',            'Gaming',                '#22d3ee', 3),
  (94, 9, 'entertainment',     'Entertainment',         '#22d3ee', 4),
  (95, 9, 'sports',            'Sports',                '#22d3ee', 5),
  (96, 9, 'travel',            'Travel',                '#22d3ee', 6),
  (97, 9, 'news-politics',     'News & Politics',       '#22d3ee', 7),
  (98, 9, 'food-cooking',      'Food & Cooking',        '#22d3ee', 8),
  (99, 9, 'nature-environment','Nature & Environment',   '#22d3ee', 9),
  (100,9, 'community',          'Community',             '#22d3ee', 10)
ON CONFLICT (id) DO NOTHING;
