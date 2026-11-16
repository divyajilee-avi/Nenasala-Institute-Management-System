-- ============================================================
-- Nenasala IT Center — Update to ICT Courses
-- Run this in phpMyAdmin → SQL tab
-- ============================================================
USE `nenasala_ims`;

-- ── Disable FK checks to allow deleting parent rows ──────
SET FOREIGN_KEY_CHECKS = 0;

-- Clear dependent tables first
DELETE FROM `results`;
DELETE FROM `attendance`;
DELETE FROM `payments`;
DELETE FROM `fees`;
DELETE FROM `exams`;
DELETE FROM `classes`;
DELETE FROM `materials`;
DELETE FROM `subjects`;
DELETE FROM `students`;
DELETE FROM `teachers`;
DELETE FROM `courses`;

-- Reset auto-increments
ALTER TABLE `results`    AUTO_INCREMENT = 1;
ALTER TABLE `attendance` AUTO_INCREMENT = 1;
ALTER TABLE `payments`   AUTO_INCREMENT = 1;
ALTER TABLE `fees`       AUTO_INCREMENT = 1;
ALTER TABLE `exams`      AUTO_INCREMENT = 1;
ALTER TABLE `classes`    AUTO_INCREMENT = 1;
ALTER TABLE `materials`  AUTO_INCREMENT = 1;
ALTER TABLE `subjects`   AUTO_INCREMENT = 1;
ALTER TABLE `students`   AUTO_INCREMENT = 1;
ALTER TABLE `teachers`   AUTO_INCREMENT = 1;
ALTER TABLE `courses`    AUTO_INCREMENT = 1;

-- ── Re-enable FK checks ───────────────────────────────────
SET FOREIGN_KEY_CHECKS = 1;

-- ── ICT Courses ───────────────────────────────────────────
INSERT INTO `courses` (`name`, `code`, `description`, `duration`, `fee`, `status`) VALUES
('ICT — Advanced Level',           'ICT-AL',   'A/L ICT: programming, networking, databases, system analysis.',        '2 Years',   35000.00, 'active'),
('Web Development',                'WEB-DEV',  'Full-stack: HTML, CSS, JavaScript, PHP, MySQL, React.',                '6 Months',  18000.00, 'active'),
('Computer Hardware & Networking', 'CHN',      'Hardware, OS, LAN/WAN, server administration, troubleshooting.',       '4 Months',  15000.00, 'active'),
('Office Automation',              'OFC-AUTO', 'MS Office, Google Workspace, typing, professional computer skills.',   '3 Months',   8000.00, 'active'),
('Graphic Design',                 'GFX',      'Photoshop, Illustrator, CorelDRAW for print and digital media.',       '4 Months',  12000.00, 'active'),
('Software Development',           'SD',       'Python, Java, OOP, data structures, software engineering.',            '8 Months',  25000.00, 'active'),
('Cybersecurity Fundamentals',     'CYBER',    'Network security, ethical hacking basics, cyber threats, protection.', '4 Months',  20000.00, 'active'),
('Data Science & AI',              'DS-AI',    'Python for data science, machine learning, AI applications.',          '6 Months',  28000.00, 'active');

-- ── ICT Subjects ──────────────────────────────────────────

-- ICT A/L (id=1)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(1,'ICT Theory',                   'ICT-TH',  4),
(1,'Programming (Python & Java)',  'ICT-PRG', 4),
(1,'Database Management',          'ICT-DB',  3),
(1,'Networking Fundamentals',      'ICT-NET', 3),
(1,'System Analysis & Design',     'ICT-SAD', 3),
(1,'ICT Practicals',               'ICT-LAB', 2);

-- Web Development (id=2)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(2,'HTML & CSS',                   'WEB-01',  2),
(2,'JavaScript & jQuery',          'WEB-02',  3),
(2,'PHP & MySQL Backend',          'WEB-03',  3),
(2,'React.js Frontend',            'WEB-04',  3),
(2,'WordPress & CMS',              'WEB-05',  2);

-- Hardware & Networking (id=3)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(3,'Computer Hardware',            'CHN-01',  3),
(3,'Operating Systems',            'CHN-02',  2),
(3,'LAN / WAN Networking',         'CHN-03',  3),
(3,'Server Administration',        'CHN-04',  3),
(3,'Troubleshooting & Repair',     'CHN-05',  2);

-- Office Automation (id=4)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(4,'Microsoft Word & Excel',       'OFC-01',  2),
(4,'PowerPoint & Publisher',       'OFC-02',  2),
(4,'Google Workspace',             'OFC-03',  2),
(4,'Professional Typing',          'OFC-04',  1);

-- Graphic Design (id=5)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(5,'Adobe Photoshop',              'GFX-01',  3),
(5,'Adobe Illustrator',            'GFX-02',  3),
(5,'CorelDRAW',                    'GFX-03',  2),
(5,'Video Editing Basics',         'GFX-04',  2);

-- Software Development (id=6)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(6,'Python Programming',           'SD-01',   3),
(6,'Java & OOP',                   'SD-02',   3),
(6,'Data Structures & Algorithms', 'SD-03',   3),
(6,'Mobile App Development',       'SD-04',   3),
(6,'Software Engineering',         'SD-05',   2);

-- Cybersecurity (id=7)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(7,'Network Security',             'CYB-01',  3),
(7,'Ethical Hacking Basics',       'CYB-02',  3),
(7,'Cryptography',                 'CYB-03',  2),
(7,'Cyber Laws & Ethics',          'CYB-04',  2);

-- Data Science & AI (id=8)
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(8,'Python for Data Science',      'DS-01',   3),
(8,'Statistics for Data Science',  'DS-02',   3),
(8,'Machine Learning',             'DS-03',   3),
(8,'AI Fundamentals',              'DS-04',   3),
(8,'Data Visualization',           'DS-05',   2);

-- ── Update admin branding ─────────────────────────────────
UPDATE `users` SET `name` = 'IT Admin' WHERE `email` = 'admin@nenasala.lk';

-- ── Verify results ────────────────────────────────────────
SELECT CONCAT('✅ Courses: ', COUNT(*)) AS result FROM `courses`
UNION ALL
SELECT CONCAT('✅ Subjects: ', COUNT(*)) FROM `subjects`;
