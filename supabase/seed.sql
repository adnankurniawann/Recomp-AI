-- Seed data (PRD §15). This file holds the fixed skill list, the role templates, the active
-- matching config and the competitions. Mentors (#45), the course and the promo come later.

-- SKILLS --------------------------------------------------------------------------------------
-- Ids are fixed so role templates, fixtures and tests can refer to them. Never renumber; append.
insert into skills (id, slug, name, category, aliases) values
  -- engineering
  ( 1, 'backend-development',  'Backend Development',  'engineering', '{backend,back-end,server-side}'),
  ( 2, 'frontend-development', 'Frontend Development', 'engineering', '{frontend,front-end,web development}'),
  ( 3, 'react',                'React',                'engineering', '{reactjs,react.js}'),
  ( 4, 'nextjs',               'Next.js',              'engineering', '{next,nextjs}'),
  ( 5, 'nodejs',               'Node.js',              'engineering', '{node,nodejs,express}'),
  ( 6, 'database',             'Database',             'engineering', '{basis data,postgresql,mysql,mongodb}'),
  ( 7, 'api-design',           'API Design',           'engineering', '{rest api,graphql}'),
  ( 8, 'cloud-deployment',     'Cloud Deployment',     'engineering', '{devops,docker,aws,gcp}'),
  ( 9, 'mobile-development',   'Mobile Development',   'engineering', '{android,ios,mobile app}'),
  (10, 'flutter',              'Flutter',              'engineering', '{dart}'),
  (11, 'git',                  'Git',                  'engineering', '{github,version control}'),
  (12, 'tailwind-css',         'Tailwind CSS',         'engineering', '{tailwind}'),
  (13, 'typescript',           'TypeScript',           'engineering', '{ts}'),
  (14, 'algorithms',           'Algorithms',           'engineering', '{algoritma,struktur data,data structures,competitive programming}'),
  (15, 'cybersecurity',        'Cybersecurity',        'engineering', '{keamanan siber,security,ctf}'),
  -- design
  (16, 'figma',                'Figma',                'design',      '{}'),
  (17, 'user-research',        'User Research',        'design',      '{ux research,riset pengguna,usability testing}'),
  (18, 'prototyping',          'Prototyping',          'design',      '{prototype,wireframing}'),
  (19, 'design-system',        'Design System',        'design',      '{design systems}'),
  (20, 'illustration',         'Illustration',         'design',      '{ilustrasi}'),
  (21, 'ui-design',            'UI Design',            'design',      '{desain antarmuka,interface design,visual design}'),
  -- data and AI
  (22, 'python',               'Python',               'data_ai',     '{}'),
  (23, 'machine-learning',     'Machine Learning',     'data_ai',     '{ml,deep learning}'),
  (24, 'data-analysis',        'Data Analysis',        'data_ai',     '{analisis data,data analytics}'),
  (25, 'llm-integration',      'LLM Integration',      'data_ai',     '{llm,genai,prompt engineering}'),
  (26, 'computer-vision',      'Computer Vision',      'data_ai',     '{cv,image processing}'),
  (27, 'sql',                  'SQL',                  'data_ai',     '{}'),
  (28, 'data-visualization',   'Data Visualization',   'data_ai',     '{visualisasi data,tableau,power bi}'),
  (29, 'statistics',           'Statistics',           'data_ai',     '{statistika}'),
  -- product and business
  (30, 'product-management',   'Product Management',   'product_business', '{product manager,pm}'),
  (31, 'business-model',       'Business Model',       'product_business', '{business model canvas,bmc}'),
  (32, 'market-research',      'Market Research',      'product_business', '{riset pasar}'),
  (33, 'financial-modeling',   'Financial Modeling',   'product_business', '{financial model,valuasi}'),
  (34, 'pitch-deck',           'Pitch Deck',           'product_business', '{deck}'),
  (35, 'business-strategy',    'Business Strategy',    'product_business', '{strategi bisnis}'),
  -- communication
  (36, 'public-speaking',      'Public Speaking',      'communication', '{presentasi,pitching}'),
  (37, 'copywriting',          'Copywriting',          'communication', '{}'),
  (38, 'video-editing',        'Video Editing',        'communication', '{}'),
  (39, 'academic-writing',     'Academic Writing',     'communication', '{penulisan ilmiah,karya tulis ilmiah,scientific writing}'),
  (40, 'literature-review',    'Literature Review',    'communication', '{studi literatur,tinjauan pustaka}');

select setval(pg_get_serial_sequence('skills', 'id'), (select max(id) from skills));

-- ROLE TEMPLATES --------------------------------------------------------------------------------
-- Five per category (PRD §7.1). required_skills: [{"skill_id", "min_level"}], ids from above.
insert into role_templates
  (category, name, description, color_key, required_skills, optional_skill_ids, hours_per_week, sort)
values
  -- hackathon (PRD §7.1)
  ('hackathon', 'Backend Developer', 'Membangun server, API, dan database.', 'backend',
    '[{"skill_id":1,"min_level":2},{"skill_id":6,"min_level":2}]', '{7,8}', 10, 1),
  ('hackathon', 'Frontend Developer', 'Membangun tampilan web yang dipakai pengguna.', 'frontend',
    '[{"skill_id":2,"min_level":2},{"skill_id":3,"min_level":2}]', '{4,12}', 10, 2),
  ('hackathon', 'UI/UX Designer', 'Merancang alur dan tampilan produk dari riset pengguna.', 'uiux',
    '[{"skill_id":16,"min_level":2},{"skill_id":17,"min_level":1}]', '{18,19}', 8, 3),
  ('hackathon', 'Data/AI Engineer', 'Membangun fitur data atau model AI.', 'data',
    '[{"skill_id":22,"min_level":2},{"skill_id":23,"min_level":2}]', '{25,24}', 10, 4),
  ('hackathon', 'Product dan Pitching', 'Menjaga arah produk dan membawakan presentasi.', 'product',
    '[{"skill_id":36,"min_level":2},{"skill_id":30,"min_level":1}]', '{31,34}', 6, 5),

  -- it_competition
  ('it_competition', 'Software Engineer', 'Membangun logika aplikasi, API, dan database.', 'backend',
    '[{"skill_id":1,"min_level":2},{"skill_id":6,"min_level":2}]', '{7,11}', 10, 1),
  ('it_competition', 'Frontend Developer', 'Membangun tampilan web yang dipakai pengguna.', 'frontend',
    '[{"skill_id":2,"min_level":2},{"skill_id":3,"min_level":2}]', '{13,12}', 10, 2),
  ('it_competition', 'Mobile Developer', 'Membangun aplikasi Android atau iOS.', 'frontend',
    '[{"skill_id":9,"min_level":2},{"skill_id":10,"min_level":2}]', '{7,11}', 10, 3),
  ('it_competition', 'Problem Solver', 'Menyelesaikan soal algoritma atau keamanan.', 'other',
    '[{"skill_id":14,"min_level":2},{"skill_id":22,"min_level":2}]', '{27,15}', 8, 4),
  ('it_competition', 'Presenter dan Dokumentasi', 'Menulis dokumentasi dan membawakan presentasi.', 'product',
    '[{"skill_id":36,"min_level":2},{"skill_id":37,"min_level":1}]', '{34,38}', 5, 5),

  -- ui_ux
  ('ui_ux', 'UI Designer', 'Merancang tampilan visual yang rapi dan konsisten.', 'uiux',
    '[{"skill_id":21,"min_level":2},{"skill_id":16,"min_level":2}]', '{19,20}', 10, 1),
  ('ui_ux', 'UX Researcher', 'Menggali kebutuhan pengguna dan menguji desain.', 'uiux',
    '[{"skill_id":17,"min_level":2}]', '{32,24}', 8, 2),
  ('ui_ux', 'Interaction Designer', 'Membuat prototipe dan alur interaksi.', 'uiux',
    '[{"skill_id":18,"min_level":2},{"skill_id":16,"min_level":2}]', '{2,19}', 8, 3),
  ('ui_ux', 'Product Strategist', 'Menentukan masalah, sasaran, dan nilai produk.', 'product',
    '[{"skill_id":30,"min_level":2},{"skill_id":32,"min_level":1}]', '{31}', 6, 4),
  ('ui_ux', 'Presenter', 'Membawakan presentasi dan menyusun deck.', 'product',
    '[{"skill_id":36,"min_level":2},{"skill_id":34,"min_level":1}]', '{37,38}', 5, 5),

  -- data
  ('data', 'Data Scientist', 'Membangun dan menguji model machine learning.', 'data',
    '[{"skill_id":22,"min_level":2},{"skill_id":23,"min_level":2}]', '{29,26}', 10, 1),
  ('data', 'Data Analyst', 'Membersihkan dan menganalisis data.', 'data',
    '[{"skill_id":24,"min_level":2},{"skill_id":27,"min_level":2}]', '{29,22}', 8, 2),
  ('data', 'Data Engineer', 'Menyiapkan pipeline dan penyimpanan data.', 'backend',
    '[{"skill_id":22,"min_level":2},{"skill_id":6,"min_level":2}]', '{27,8}', 8, 3),
  ('data', 'Visualization Specialist', 'Mengubah hasil analisis jadi grafik yang mudah dibaca.', 'data',
    '[{"skill_id":28,"min_level":2}]', '{16,24}', 6, 4),
  ('data', 'Storyteller dan Pitching', 'Menceritakan temuan data di presentasi.', 'product',
    '[{"skill_id":36,"min_level":2},{"skill_id":34,"min_level":1}]', '{28,37}', 5, 5),

  -- business_case
  ('business_case', 'Business Strategist', 'Menyusun strategi dan model bisnis.', 'business',
    '[{"skill_id":35,"min_level":2},{"skill_id":31,"min_level":2}]', '{32}', 8, 1),
  ('business_case', 'Financial Analyst', 'Menghitung proyeksi keuangan dan kelayakan.', 'business',
    '[{"skill_id":33,"min_level":2}]', '{24,29}', 8, 2),
  ('business_case', 'Market Researcher', 'Menggali data pasar dan pesaing.', 'business',
    '[{"skill_id":32,"min_level":2},{"skill_id":24,"min_level":1}]', '{17}', 6, 3),
  ('business_case', 'Deck Designer', 'Merancang deck yang jelas dan menarik.', 'uiux',
    '[{"skill_id":34,"min_level":2},{"skill_id":16,"min_level":1}]', '{20,37}', 6, 4),
  ('business_case', 'Presenter', 'Membawakan presentasi dan menjawab juri.', 'product',
    '[{"skill_id":36,"min_level":2}]', '{34,35}', 5, 5),

  -- paper
  ('paper', 'Lead Researcher', 'Menentukan topik, metode, dan kajian pustaka.', 'other',
    '[{"skill_id":39,"min_level":2},{"skill_id":40,"min_level":2}]', '{29}', 8, 1),
  ('paper', 'Data Analyst', 'Mengolah data penelitian dan menguji hasil.', 'data',
    '[{"skill_id":24,"min_level":2},{"skill_id":29,"min_level":2}]', '{22,28}', 8, 2),
  ('paper', 'Prototype Developer', 'Membangun purwarupa untuk membuktikan gagasan.', 'backend',
    '[{"skill_id":1,"min_level":2}]', '{22,2}', 8, 3),
  ('paper', 'Scientific Writer', 'Menulis dan menyunting naskah sesuai format lomba.', 'other',
    '[{"skill_id":39,"min_level":2},{"skill_id":37,"min_level":1}]', '{40}', 6, 4),
  ('paper', 'Presenter', 'Membawakan presentasi hasil penelitian.', 'product',
    '[{"skill_id":36,"min_level":2}]', '{34,28}', 5, 5);

-- MATCHING CONFIG -------------------------------------------------------------------------------
-- One active row with the defaults of PRD §7.3. Change weights here, never in code.
insert into matching_config default values;

-- COMPETITIONS ----------------------------------------------------------------------------------
-- STACK 2026 is real: dates, team size and link from its official handbook (Handbook STACK 2026,
-- GDGoC ITB), which is the guidebook at supabase/seed/guidebooks/stack-2026/guidebook.pdf.
-- The other seven are simulated until the team picks real ones (TODO.md, open decisions). They
-- carry is_simulated, so the UI shows "Simulasi" (ADR 0005). Their dates are relative to the day
-- of `pnpm db:reset`, so /lomba always shows open and closing-soon (within 7 days) competitions.
insert into competitions
  (slug, name, organizer, category, description, registration_deadline, event_date,
   team_min, team_max, official_url, eligibility, is_featured, is_simulated)
values
  ('stack-2026', 'STACK 2026', 'GDGoC ITB',
    'hackathon', 'Hackathon mahasiswa bertema "Agent of the Ocean: Vibing Beyond the Code". Pilih satu kasus, Smarter Campus and Learning atau Stronger Communities and Everyday Services, lalu bawa ide orisinal sampai jadi prototipe lewat babak penyisihan, semifinal, dan Final Day di Bandung. Semua materi dalam bahasa Inggris.',
    '2026-11-07', '2026-12-16', 3, 4, 'https://gdgoncampusitb.com/hackathon',
    '{"student":"active","citizenship":"WNI"}', true, false),
  ('build-for-health', 'Build for Health Hackathon', 'Komunitas Teknologi Kesehatan',
    'hackathon', 'Bangun solusi untuk layanan kesehatan primer: antrean puskesmas, rekam medis sederhana, atau edukasi pasien.',
    current_date + 5, current_date + 20, 3, 4, 'https://example.com/lomba/build-for-health',
    '{"degree":["S1","D3","D4"]}', false, true),
  ('hackathon-desa-digital', 'Hackathon Inovasi Desa Digital', 'Badan Eksekutif Mahasiswa Fakultas Teknik',
    'hackathon', 'Rancang dan bangun aplikasi yang membantu pelayanan desa, UMKM lokal, atau pertanian.',
    current_date + 40, current_date + 55, 2, 4, 'https://example.com/lomba/hackathon-desa-digital',
    '{"degree":["S1","D3"]}', false, true),
  ('kompetisi-aplikasi-mahasiswa', 'Kompetisi Pengembangan Aplikasi Mahasiswa', 'Unit Kegiatan Mahasiswa Teknologi',
    'it_competition', 'Kembangkan aplikasi web atau mobile yang sudah bisa dicoba juri, lengkap dengan dokumentasi teknis.',
    current_date + 14, current_date + 30, 2, 3, 'https://example.com/lomba/kompetisi-aplikasi-mahasiswa',
    '{"degree":["S1","D3"]}', false, true),
  ('ui-ux-design-sprint', 'UI/UX Design Sprint Nasional', 'Komunitas Desain Produk Indonesia',
    'ui_ux', 'Design sprint lima hari: riset pengguna, wireframe, prototipe, dan uji kegunaan untuk satu studi kasus.',
    current_date + 3, current_date + 12, 2, 3, 'https://example.com/lomba/ui-ux-design-sprint',
    '{"degree":["S1","D3","D4"]}', false, true),
  ('data-science-challenge', 'Data Science Challenge Mahasiswa', 'Kelompok Studi Sains Data',
    'data', 'Olah dataset transportasi publik, bangun model prediksi, dan sajikan temuan dalam dasbor.',
    current_date + 28, current_date + 45, 2, 3, 'https://example.com/lomba/data-science-challenge',
    '{"degree":["S1"]}', false, true),
  ('business-case-ekonomi-kreatif', 'Business Case Competition Ekonomi Kreatif', 'Himpunan Mahasiswa Manajemen',
    'business_case', 'Analisis studi kasus perusahaan ekonomi kreatif dan presentasikan strategi pertumbuhan di depan juri.',
    current_date + 18, current_date + 32, 3, 3, 'https://example.com/lomba/business-case-ekonomi-kreatif',
    '{"degree":["S1","D3"]}', false, true),
  ('lkti-teknologi-terapan', 'Lomba Karya Tulis Ilmiah Teknologi Terapan', 'Kelompok Penulis Ilmiah Mahasiswa',
    'paper', 'Tulis karya ilmiah tentang penerapan teknologi untuk masalah nyata di sekitar kampus.',
    current_date + 25, current_date + 40, 1, 3, 'https://example.com/lomba/lkti-teknologi-terapan',
    '{"degree":["S1","D3"]}', false, true);

-- The file is uploaded from supabase/seed/guidebooks (config.toml, [storage.buckets.guidebooks]).
update competitions set guidebook_path = 'stack-2026/guidebook.pdf' where slug = 'stack-2026';
