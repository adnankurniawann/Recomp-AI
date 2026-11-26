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

-- Posters, uploaded from supabase/seed/posters (config.toml, [storage.buckets.posters]). STACK 2026
-- uses its official poster from GDGoC ITB, the organizer; the team agreed to show it on Nov 26,
-- 2026. The simulated competitions use generated covers.
update competitions set poster_path = slug || '/poster.webp'
where slug in ('stack-2026', 'build-for-health', 'hackathon-desa-digital',
  'kompetisi-aplikasi-mahasiswa', 'ui-ux-design-sprint', 'data-science-challenge',
  'business-case-ekonomi-kreatif', 'lkti-teknologi-terapan');

-- MENTORS (PRD §15: 10 fictional mentors, 2 to 3 services, 6 slots next week) -------------------
-- All are made up, so they carry is_simulated and initials instead of photos (PRD F-MNT, ADR 0005).
-- Slots are relative to `pnpm db:reset`: next Monday to Saturday at 19.00 Jakarta time.
insert into mentors
  (id, display_name, roles, headline, bio, achievements, competition_categories, is_simulated)
values
  ('00000000-0000-4000-8000-000000000101', 'Raka Pratama', '{backend}',
    'Juara 1 hackathon nasional 2024, kategori layanan publik',
    'Backend engineer yang suka merapikan arsitektur prototipe hackathon supaya demo tidak gagal di depan juri.',
    '[{"year":2024,"title":"Juara 1 hackathon nasional, kategori layanan publik"},{"year":2023,"title":"Finalis kompetisi aplikasi mahasiswa"}]',
    '{hackathon,it_competition}', true),
  ('00000000-0000-4000-8000-000000000102', 'Nadia Kusuma', '{uiux}',
    'Juara 1 design sprint nasional 2024, kategori UX',
    'Product designer yang membimbing riset pengguna singkat dan prototipe yang bisa diuji dalam sehari.',
    '[{"year":2024,"title":"Juara 1 design sprint nasional, kategori UX"}]',
    '{ui_ux,hackathon}', true),
  ('00000000-0000-4000-8000-000000000103', 'Dimas Saputra', '{frontend}',
    'Juara 2 hackathon kampus 2023, frontend lead',
    'Frontend developer yang fokus ke antarmuka cepat, aksesibel, dan siap didemokan.',
    '[{"year":2023,"title":"Juara 2 hackathon kampus"}]',
    '{hackathon,it_competition}', true),
  ('00000000-0000-4000-8000-000000000104', 'Salsa Maharani', '{data}',
    'Juara 1 data science challenge 2024',
    'Data scientist yang membantu tim memilih model sederhana dan menyajikan temuan lewat dasbor.',
    '[{"year":2024,"title":"Juara 1 data science challenge mahasiswa"},{"year":2022,"title":"Juara 3 lomba analisis data"}]',
    '{data,hackathon}', true),
  ('00000000-0000-4000-8000-000000000105', 'Bagas Wicaksono', '{product}',
    'Best pitch di hackathon nasional 2023',
    'Product manager yang melatih alur pitch tiga menit, dari masalah sampai demo.',
    '[{"year":2023,"title":"Best pitch, hackathon nasional"}]',
    '{hackathon,business_case}', true),
  ('00000000-0000-4000-8000-000000000106', 'Intan Permatasari', '{business}',
    'Juara 1 business case competition 2024',
    'Konsultan strategi yang membimbing analisis kasus, struktur slide, dan sesi tanya jawab juri.',
    '[{"year":2024,"title":"Juara 1 business case competition"}]',
    '{business_case}', true),
  ('00000000-0000-4000-8000-000000000107', 'Fajar Nugroho', '{backend,data}',
    'Finalis hackathon AI 2024, backend dan machine learning',
    'Engineer yang menyambungkan model machine learning ke API yang stabil untuk demo.',
    '[{"year":2024,"title":"Finalis hackathon AI"}]',
    '{hackathon,data}', true),
  ('00000000-0000-4000-8000-000000000108', 'Ayu Lestari', '{uiux,frontend}',
    'Juara 2 lomba UI/UX nasional 2023',
    'Designer yang juga menulis kode, membantu tim menjaga desain tetap bisa dibangun.',
    '[{"year":2023,"title":"Juara 2 lomba UI/UX nasional"}]',
    '{ui_ux,it_competition}', true),
  ('00000000-0000-4000-8000-000000000109', 'Yoga Firmansyah', '{product,business}',
    'Juara 1 lomba rencana bisnis 2022',
    'Pendiri startup kecil yang membimbing validasi ide dan model bisnis untuk lomba.',
    '[{"year":2022,"title":"Juara 1 lomba rencana bisnis"}]',
    '{business_case,hackathon}', true),
  ('00000000-0000-4000-8000-000000000110', 'Putri Anggraini', '{data}',
    'Juara 1 karya tulis ilmiah teknologi 2023',
    'Peneliti yang membimbing penulisan karya ilmiah dan analisis data pendukungnya.',
    '[{"year":2023,"title":"Juara 1 karya tulis ilmiah teknologi"}]',
    '{paper,data}', true);

-- One real mentor: Muhammad Adnan Kurniawan of Team Cumlaude, with the photo Adnan supplied
-- (supabase/seed/mentors). Not simulated, so no "Simulasi" badge; no achievements are listed
-- because none were given. Booking him is free; the payment step stays simulated (ADR 0005).
insert into mentors
  (id, display_name, photo_path, roles, headline, bio, achievements, competition_categories,
   is_simulated)
values
  ('00000000-0000-4000-8000-000000000201', 'Muhammad Adnan Kurniawan',
    'adnan-kurniawan/photo.webp', '{data}',
    'AI & Data Lead Tim Cumlaude, peserta STACK 2026',
    'Membangun bagian AI dan data di Recomp AI: pencocokan kandidat, agen pembaca guidebook, dan evaluasinya. Siap bantu tim merancang fitur AI yang tetap jalan walau tanpa API key.',
    '[]', '{hackathon,data}', false);

insert into mentor_services (mentor_id, name, description, duration_min, price) values
  ('00000000-0000-4000-8000-000000000201', 'Konsultasi fitur AI untuk lomba',
    'Ngobrol 30 menit soal ide fitur AI timmu: data apa yang dibutuhkan, prompt, dan rencana cadangan saat demo.',
    30, 0);

insert into mentor_slots (mentor_id, starts_at)
select '00000000-0000-4000-8000-000000000201', (date_trunc('week', now() at time zone 'Asia/Jakarta')
  + interval '7 days' + d * interval '1 day' + interval '20 hours') at time zone 'Asia/Jakarta'
from generate_series(0, 4, 2) d;

insert into mentor_services (mentor_id, name, description, duration_min, price)
select m.id, s.name, s.description, s.duration_min, s.price
from mentors m
join (values
  ('Review ide dan rencana tim', 'Sesi tanya jawab untuk mengecek ide, pembagian role, dan rencana kerja.', 30, 75000),
  ('Mentoring teknis atau desain', 'Bedah prototipe sesuai bidang mentor dan daftar perbaikan prioritas.', 60, 150000),
  ('Latihan pitch dan demo', 'Simulasi presentasi di depan juri dengan masukan langsung.', 45, 120000)
) as s(name, description, duration_min, price)
  on s.name <> 'Latihan pitch dan demo' or m.roles && '{product,business}'
where m.id::text like '00000000-0000-4000-8000-0000000001%';

insert into mentor_slots (mentor_id, starts_at)
select m.id, (date_trunc('week', now() at time zone 'Asia/Jakarta') + interval '7 days'
  + d * interval '1 day' + interval '19 hours') at time zone 'Asia/Jakarta'
from mentors m, generate_series(0, 5) d
where m.id::text like '00000000-0000-4000-8000-0000000001%';
