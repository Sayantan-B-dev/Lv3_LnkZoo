-- ─────────────────────────────────────────
-- SEED DATA — matches ui-reference-version_3.0.html
-- ─────────────────────────────────────────

-- USERS (password: "password123" for all)
INSERT INTO users (id, username, email, password_hash, bio, karma, streak, last_post_date, is_admin)
VALUES
  ('11111111-1111-1111-1111-111111111111','priya',   'priya@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ1','full-stack dev. loves systems and open source.',           4820, 22, CURRENT_DATE - 1, false),
  ('22222222-2222-2222-2222-222222222222','kshetra', 'kshetra@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ2','rust & go enthusiast. building fast things.',              3641, 14, CURRENT_DATE - 1, false),
  ('33333333-3333-3333-3333-333333333333','arjun',   'arjun@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ3','building things on the internet. curious about systems, design, and the open web.', 1204, 7, CURRENT_DATE, false),
  ('44444444-4444-4444-4444-444444444444','meera',   'meera@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ4','data journalist. obsessed with dataviz.',                  980,  3, CURRENT_DATE - 2, false),
  ('55555555-5555-5555-5555-555555555555','rahul',   'rahul@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ5','linux, security, and cli tools.',                         744,  0, CURRENT_DATE - 5, false),
  ('66666666-6666-6666-6666-666666666666','ananya',  'ananya@example.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ6','ux designer + frontend dev.',                             612,  5, CURRENT_DATE - 1, false),
  ('77777777-7777-7777-7777-777777777777','kunal',   'kunal@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ7','backend-first developer.',                                503,  1, CURRENT_DATE - 3, false),
  ('88888888-8888-8888-8888-888888888888','tanvi',   'tanvi@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ8','product manager turned developer.',                       390,  0, CURRENT_DATE - 8, false),
  ('99999999-9999-9999-9999-999999999999','aisha',   'aisha@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ9','ai researcher. python all the way.',                      280,  2, CURRENT_DATE - 2, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','admin',   'admin@glinqx.io',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX1R3wvKpQzQpQpQpQpQpQpQ0','site admin.',                                               0,   0, NULL,             true);

-- INTERESTS
UPDATE users SET interests = ARRAY['engineering','debugging','webdev','javascript'] WHERE username = 'priya';
UPDATE users SET interests = ARRAY['rust','golang','systems','performance'] WHERE username = 'kshetra';
UPDATE users SET interests = ARRAY['design','ux','webdev','css'] WHERE username = 'arjun';
UPDATE users SET interests = ARRAY['dataviz','javascript','journalism'] WHERE username = 'meera';
UPDATE users SET interests = ARRAY['linux','security','devops'] WHERE username = 'rahul';
UPDATE users SET interests = ARRAY['ux','design','frontend','css'] WHERE username = 'ananya';
UPDATE users SET interests = ARRAY['backend','database','postgres'] WHERE username = 'kunal';
UPDATE users SET interests = ARRAY['ai','python','productivity'] WHERE username = 'aisha';

-- FOLLOWS
INSERT INTO follows (follower_id, followee_id) VALUES
  ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555','22222222-2222-2222-2222-222222222222'),
  ('66666666-6666-6666-6666-666666666666','33333333-3333-3333-3333-333333333333'),
  ('77777777-7777-7777-7777-777777777777','11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333');

-- TAGS
INSERT INTO tags (name, normalized_name, usage_count) VALUES
  ('javascript','javascript', 42),
  ('webdev',    'webdev',     38),
  ('rust',      'rust',       29),
  ('ai',        'ai',         35),
  ('linux',     'linux',      22),
  ('design',    'design',     31),
  ('security',  'security',   18),
  ('python',    'python',     27),
  ('devops',    'devops',     15),
  ('ux',        'ux',         24),
  ('opensource','opensource', 33),
  ('golang',    'golang',     20),
  ('typescript','typescript', 19),
  ('react',     'react',      28),
  ('nextjs',    'nextjs',     14),
  ('database',  'database',   17),
  ('postgres',  'postgres',   12),
  ('redis',     'redis',       9),
  ('aws',       'aws',        11),
  ('devtools',  'devtools',   16),
  ('career',    'career',     13),
  ('productivity','productivity',21),
  ('philosophy','philosophy', 10),
  ('engineering','engineering',26),
  ('debugging', 'debugging',  8),
  ('frontend',  'frontend',   23),
  ('backend',   'backend',    18),
  ('css',       'css',        25),
  ('systems',   'systems',    14),
  ('performance','performance',17),
  ('sqlite',    'sqlite',      7),
  ('dataviz',   'dataviz',     9),
  ('journalism','journalism',  5),
  ('tools',     'tools',      20),
  ('mindset',   'mindset',     6);

-- LINKS
INSERT INTO links (id, user_id, original_url, short_code, title, description, is_anonymous, upvote_count, downvote_count, comment_count, view_count, created_at)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'https://nilsbarth.com/debugging','xK3p01',
   'The Art of Debugging: How Elite Engineers Think',
   'A deep-dive into mental models top engineers use when tracking down elusive bugs in production systems.',
   false, 218, 4, 24, 1204, NOW() - INTERVAL '3 hours'),

  ('aaaaaaaa-0002-0002-0002-000000000002',
   '33333333-3333-3333-3333-333333333333',
   'https://web.dev/container-queries','xK3p02',
   'CSS Container Queries Are Here — And They''re Amazing',
   'Container queries let you style elements based on their container''s size, not the viewport. Game changer for component libraries.',
   false, 184, 2, 31, 944, NOW() - INTERVAL '5 hours'),

  ('aaaaaaaa-0003-0003-0003-000000000003',
   '22222222-2222-2222-2222-222222222222',
   'https://bitfieldconsulting.com/golang/rust-vs-go','xK3p03',
   'Rust vs Go in 2025: A Production Perspective',
   'After building real systems in both languages, here''s an honest comparison of ergonomics, performance, and team velocity.',
   false, 312, 18, 87, 3200, NOW() - INTERVAL '8 hours'),

  ('aaaaaaaa-0004-0004-0004-000000000004',
   '55555555-5555-5555-5555-555555555555',
   'https://medium.com/@pgoptimize/postgres-90-percent','xK3p04',
   'How I Reduced My Postgres Query Time by 90%',
   'A practical walkthrough of EXPLAIN ANALYZE, index types, and query restructuring that saved us $2k/month in cloud costs.',
   true, 276, 7, 42, 2100, NOW() - INTERVAL '12 hours'),

  ('aaaaaaaa-0005-0005-0005-000000000005',
   '44444444-4444-4444-4444-444444444444',
   'https://observablehq.com','xK3p05',
   'Observable Notebooks are the Future of Data Journalism',
   'Why reactive notebooks that run in the browser will replace static charts in every major newsroom within 5 years.',
   false, 94, 3, 15, 720, NOW() - INTERVAL '1 day'),

  ('aaaaaaaa-0006-0006-0006-000000000006',
   '66666666-6666-6666-6666-666666666666',
   'https://css-tricks.com/boring-tools','xK3p06',
   'Why the Web Needs More Boring Tools',
   'A case for stable, well-documented utilities over shiny new frameworks.',
   false, 410, 5, 38, 2800, NOW() - INTERVAL '6 hours'),

  ('aaaaaaaa-0007-0007-0007-000000000007',
   '77777777-7777-7777-7777-777777777777',
   'https://grugbrain.dev','xK3p07',
   'The Grug Brain Developer',
   'Learning to embrace simplicity in software. The most-shared dev essay this month.',
   false, 388, 3, 62, 4100, NOW() - INTERVAL '7 hours'),

  ('aaaaaaaa-0008-0008-0008-000000000008',
   '33333333-3333-3333-3333-333333333333',
   'https://linear.app/blog/design-system','xK3p08',
   'Linear''s Design System: A Deep Dive',
   'How the team behind Linear builds one of the most polished UIs in SaaS.',
   false, 302, 4, 29, 1900, NOW() - INTERVAL '9 hours'),

  ('aaaaaaaa-0009-0009-0009-000000000009',
   '22222222-2222-2222-2222-222222222222',
   'https://vitejs.dev/blog/build-tools','xK3p09',
   'Anatomy of a Modern Build Tool',
   'Vite, Turbopack, and beyond — what makes a fast bundler fast.',
   false, 248, 6, 33, 1650, NOW() - INTERVAL '10 hours'),

  ('aaaaaaaa-0010-0010-0010-000000000010',
   '55555555-5555-5555-5555-555555555555',
   'https://sqlite.org/serverless','xK3p10',
   'SQLite is the Database of the Future',
   'Why serverless and edge computing are making SQLite viable for serious applications.',
   false, 214, 8, 27, 1420, NOW() - INTERVAL '11 hours'),

  ('aaaaaaaa-0011-0011-0011-000000000011',
   '11111111-1111-1111-1111-111111111111',
   'https://securitytrails.com/blog/dns-attacks','xK3p11',
   'DNS Attacks: A Complete Field Guide',
   'From cache poisoning to BGP hijacking — how attackers exploit DNS and what defenders can do.',
   false, 156, 2, 18, 890, NOW() - INTERVAL '2 days'),

  ('aaaaaaaa-0012-0012-0012-000000000012',
   '44444444-4444-4444-4444-444444444444',
   'https://d3js.org/gallery','xK3p12',
   'D3.js Gallery: 50 Stunning Data Visualizations',
   'A curated collection of the most impressive D3 charts and graphs, with full source code.',
   false, 198, 1, 22, 1350, NOW() - INTERVAL '18 hours'),

  ('aaaaaaaa-0013-0013-0013-000000000013',
   '88888888-8888-8888-8888-888888888888',
   'https://www.designsystems.com/foundations','xK3p13',
   'Design Systems: Foundations and Philosophy',
   'Why great design systems start with principles, not components. A framework for thinking about UI consistency.',
   false, 143, 3, 14, 760, NOW() - INTERVAL '3 days'),

  ('aaaaaaaa-0014-0014-0014-000000000014',
   '99999999-9999-9999-9999-999999999999',
   'https://openai.com/research/gpt-4-technical-report','xK3p14',
   'GPT-4 Technical Report: What We Actually Learned',
   'A breakdown of the GPT-4 paper beyond the hype — training approach, safety considerations, and benchmark caveats.',
   false, 334, 12, 71, 4800, NOW() - INTERVAL '4 hours'),

  ('aaaaaaaa-0015-0015-0015-000000000015',
   '66666666-6666-6666-6666-666666666666',
   'https://uxdesign.cc/micro-interactions','xK3p15',
   'Micro-interactions: The Secret to Delightful UX',
   'The tiny moments that make interfaces feel alive. A practical guide with real-world examples.',
   false, 167, 2, 21, 1100, NOW() - INTERVAL '1 day 4 hours'),

  ('aaaaaaaa-0016-0016-0016-000000000016',
   '22222222-2222-2222-2222-222222222222',
   'https://go.dev/blog/rangefunc','xK3p16',
   'Go''s New Range-Over Functions: A Deep Dive',
   'Go 1.22 adds range-over function iterators. Here''s everything you need to know and how to use them in practice.',
   false, 121, 5, 16, 680, NOW() - INTERVAL '2 days 6 hours'),

  ('aaaaaaaa-0017-0017-0017-000000000017',
   '11111111-1111-1111-1111-111111111111',
   'https://github.blog/open-source-impact','xK3p17',
   'The Quiet Impact of Open Source Infrastructure',
   'How invisible open-source projects quietly power billions of dollars of commercial software.',
   false, 289, 6, 44, 2200, NOW() - INTERVAL '5 hours'),

  ('aaaaaaaa-0018-0018-0018-000000000018',
   '77777777-7777-7777-7777-777777777777',
   'https://redis.io/blog/redis-vs-postgres','xK3p18',
   'When to Use Redis vs Postgres: A Practical Guide',
   'Stop over-engineering your caching layer. Here is a decision framework for when each tool actually makes sense.',
   false, 201, 9, 35, 1800, NOW() - INTERVAL '15 hours'),

  ('aaaaaaaa-0019-0019-0019-000000000019',
   '33333333-3333-3333-3333-333333333333',
   'https://nextjs.org/blog/next-15','xK3p19',
   'Next.js 15: What''s New and What Changed',
   'Server actions are stable, the compiler is faster, and Turbopack is the default. Full breakdown inside.',
   false, 445, 11, 93, 5600, NOW() - INTERVAL '2 hours'),

  ('aaaaaaaa-0020-0020-0020-000000000020',
   '99999999-9999-9999-9999-999999999999',
   'https://huggingface.co/blog/llm-agents','xK3p20',
   'LLM Agents in Production: Lessons from 6 Months',
   'We shipped an LLM-powered agent to 10k users. Here is what broke, what worked, and what we wish we knew.',
   false, 378, 14, 58, 3900, NOW() - INTERVAL '3 days');

-- LINK ↔ TAG associations
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', id FROM tags WHERE normalized_name IN ('engineering','debugging','mindset');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002', id FROM tags WHERE normalized_name IN ('css','webdev','frontend');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0003-0003-0003-000000000003', id FROM tags WHERE normalized_name IN ('rust','golang','systems');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0004-0004-0004-000000000004', id FROM tags WHERE normalized_name IN ('postgres','database','performance');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0005-0005-0005-000000000005', id FROM tags WHERE normalized_name IN ('dataviz','journalism','javascript');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0006-0006-0006-000000000006', id FROM tags WHERE normalized_name IN ('webdev','tools','philosophy');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0007-0007-0007-000000000007', id FROM tags WHERE normalized_name IN ('engineering','philosophy','mindset');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0008-0008-0008-000000000008', id FROM tags WHERE normalized_name IN ('design','ux');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0009-0009-0009-000000000009', id FROM tags WHERE normalized_name IN ('javascript','webdev','devtools');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0010-0010-0010-000000000010', id FROM tags WHERE normalized_name IN ('sqlite','database');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0011-0011-0011-000000000011', id FROM tags WHERE normalized_name IN ('security','devops','linux');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0012-0012-0012-000000000012', id FROM tags WHERE normalized_name IN ('dataviz','javascript','design');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0013-0013-0013-000000000013', id FROM tags WHERE normalized_name IN ('design','ux','philosophy');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0014-0014-0014-000000000014', id FROM tags WHERE normalized_name IN ('ai','python','engineering');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0015-0015-0015-000000000015', id FROM tags WHERE normalized_name IN ('ux','design','frontend');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0016-0016-0016-000000000016', id FROM tags WHERE normalized_name IN ('golang','backend','systems');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0017-0017-0017-000000000017', id FROM tags WHERE normalized_name IN ('opensource','engineering');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0018-0018-0018-000000000018', id FROM tags WHERE normalized_name IN ('redis','database','backend','performance');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0019-0019-0019-000000000019', id FROM tags WHERE normalized_name IN ('nextjs','react','javascript','webdev');
INSERT INTO link_tags (link_id, tag_id)
SELECT 'aaaaaaaa-0020-0020-0020-000000000020', id FROM tags WHERE normalized_name IN ('ai','python','backend');

-- VOTES (upvotes from various users)
INSERT INTO link_votes (user_id, link_id, vote) VALUES
  ('33333333-3333-3333-3333-333333333333','aaaaaaaa-0001-0001-0001-000000000001', 1),
  ('22222222-2222-2222-2222-222222222222','aaaaaaaa-0001-0001-0001-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0003-0003-0003-000000000003', 1),
  ('44444444-4444-4444-4444-444444444444','aaaaaaaa-0003-0003-0003-000000000003', 1),
  ('33333333-3333-3333-3333-333333333333','aaaaaaaa-0006-0006-0006-000000000006', 1),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0019-0019-0019-000000000019', 1),
  ('22222222-2222-2222-2222-222222222222','aaaaaaaa-0019-0019-0019-000000000019', 1),
  ('55555555-5555-5555-5555-555555555555','aaaaaaaa-0019-0019-0019-000000000019', 1),
  ('66666666-6666-6666-6666-666666666666','aaaaaaaa-0014-0014-0014-000000000014', 1),
  ('77777777-7777-7777-7777-777777777777','aaaaaaaa-0007-0007-0007-000000000007', 1);

-- COMMENTS
INSERT INTO comments (id, link_id, user_id, content, upvote_count, created_at)
VALUES
  ('cccccccc-0001-0001-0001-000000000001',
   'aaaaaaaa-0001-0001-0001-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'This is exactly the kind of content I come to glinqx for. Bookmarked.',
   14, NOW() - INTERVAL '2 hours 30 minutes'),

  ('cccccccc-0002-0002-0002-000000000002',
   'aaaaaaaa-0001-0001-0001-000000000001',
   '22222222-2222-2222-2222-222222222222',
   'Agree. Though I''d push back on the point about long-term maintenance — in practice it depends heavily on team size.',
   9, NOW() - INTERVAL '1 hour 45 minutes'),

  ('cccccccc-0003-0003-0003-000000000003',
   'aaaaaaaa-0003-0003-0003-000000000003',
   '33333333-3333-3333-3333-333333333333',
   'The ergonomics section is spot on. Go wins for team velocity, Rust wins when you need every last microsecond.',
   22, NOW() - INTERVAL '6 hours'),

  ('cccccccc-0004-0004-0004-000000000004',
   'aaaaaaaa-0003-0003-0003-000000000003',
   '11111111-1111-1111-1111-111111111111',
   'I''d add that Rust''s compile times are still a pain point in large codebases.',
   18, NOW() - INTERVAL '5 hours'),

  ('cccccccc-0005-0005-0005-000000000005',
   'aaaaaaaa-0019-0019-0019-000000000019',
   '66666666-6666-6666-6666-666666666666',
   'Turbopack being default is huge. Cold starts are now under 200ms on our monorepo.',
   31, NOW() - INTERVAL '1 hour'),

  ('cccccccc-0006-0006-0006-000000000006',
   'aaaaaaaa-0019-0019-0019-000000000019',
   '44444444-4444-4444-4444-444444444444',
   'Server actions finally feeling production-ready. The DX is miles better than tRPC for simple cases.',
   27, NOW() - INTERVAL '90 minutes');

-- Nested reply
INSERT INTO comments (id, link_id, user_id, parent_id, content, upvote_count, created_at)
VALUES
  ('cccccccc-0007-0007-0007-000000000007',
   'aaaaaaaa-0001-0001-0001-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'cccccccc-0002-0002-0002-000000000002',
   'Fair point. I''ve seen this work differently across orgs too.',
   5, NOW() - INTERVAL '1 hour 15 minutes');

-- NOTIFICATIONS (sample)
INSERT INTO notifications (user_id, actor_id, type, entity_id, message, is_read, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333333',
   '77777777-7777-7777-7777-777777777777',
   'upvote',
   'aaaaaaaa-0001-0001-0001-000000000001',
   'upvoted your link "The Art of Debugging"',
   false, NOW() - INTERVAL '2 minutes'),

  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   'follow',
   '33333333-3333-3333-3333-333333333333',
   'started following you',
   false, NOW() - INTERVAL '14 minutes'),

  ('33333333-3333-3333-3333-333333333333',
   '55555555-5555-5555-5555-555555555555',
   'reply',
   'cccccccc-0007-0007-0007-000000000007',
   'replied to your comment on "CSS Container Queries"',
   false, NOW() - INTERVAL '1 hour'),

  ('33333333-3333-3333-3333-333333333333',
   '99999999-9999-9999-9999-999999999999',
   'mention',
   'cccccccc-0006-0006-0006-000000000006',
   'mentioned you in a comment',
   true, NOW() - INTERVAL '3 hours'),

  ('33333333-3333-3333-3333-333333333333',
   NULL,
   'upvote',
   'aaaaaaaa-0019-0019-0019-000000000019',
   'Welcome to Glinqx! You posted your first link.',
   true, NOW() - INTERVAL '1 day');

-- SHORTENED LINKS (tool samples)
INSERT INTO shortened_links (short_code, original_url, user_id, click_count) VALUES
  ('demo01','https://github.com/Sayantan-B-dev/Lv3_Glinqx', '33333333-3333-3333-3333-333333333333', 12),
  ('demo02','https://nextjs.org/docs', NULL, 5);
