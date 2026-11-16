-- ============================================================
-- Nenasala Institute Management System — Full Database Script
-- Version : 1.0.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS `nenasala_ims`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nenasala_ims`;

-- ── users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100) NOT NULL,
  `email`      VARCHAR(150) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `role`       ENUM('admin','teacher','student','receptionist') NOT NULL DEFAULT 'student',
  `status`     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `avatar`     VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── courses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `courses` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(150) NOT NULL,
  `code`        VARCHAR(20)  NOT NULL UNIQUE,
  `description` TEXT,
  `duration`    VARCHAR(50),
  `fee`         DECIMAL(10,2) DEFAULT 0.00,
  `status`      ENUM('active','inactive') DEFAULT 'active',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── subjects ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `subjects` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id`  INT UNSIGNED NOT NULL,
  `name`       VARCHAR(150) NOT NULL,
  `code`       VARCHAR(20)  NOT NULL,
  `credits`    INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── teachers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `teachers` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT UNSIGNED NOT NULL UNIQUE,
  `employee_id`    VARCHAR(20)  NOT NULL UNIQUE,
  `phone`          VARCHAR(20),
  `address`        TEXT,
  `qualification`  VARCHAR(200),
  `specialization` VARCHAR(200),
  `join_date`      DATE,
  `photo`          VARCHAR(255),
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── students ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `students` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT UNSIGNED NOT NULL UNIQUE,
  `student_id`     VARCHAR(20)  NOT NULL UNIQUE,
  `course_id`      INT UNSIGNED NOT NULL,
  `phone`          VARCHAR(20),
  `address`        TEXT,
  `dob`            DATE,
  `gender`         ENUM('male','female','other'),
  `guardian_name`  VARCHAR(100),
  `guardian_phone` VARCHAR(20),
  `admission_date` DATE,
  `photo`          VARCHAR(255),
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)    ON DELETE CASCADE,
  FOREIGN KEY (`course_id`)  REFERENCES `courses`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── classes (timetable) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `classes` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT UNSIGNED NOT NULL,
  `teacher_id` INT UNSIGNED NOT NULL,
  `course_id`  INT UNSIGNED NOT NULL,
  `day`        ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time`   TIME NOT NULL,
  `room`       VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`course_id`)  REFERENCES `courses`(`id`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── attendance ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `attendance` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `class_id`   INT UNSIGNED NOT NULL,
  `date`       DATE NOT NULL,
  `status`     ENUM('present','absent','late') DEFAULT 'present',
  `marked_by`  INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_att` (`student_id`,`class_id`,`date`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`)   REFERENCES `classes`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`marked_by`)  REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── fees ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `fees` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id`  INT UNSIGNED NOT NULL,
  `amount`      DECIMAL(10,2) NOT NULL,
  `due_date`    DATE NOT NULL,
  `description` VARCHAR(255),
  `status`      ENUM('pending','paid','overdue') DEFAULT 'pending',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── payments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `fee_id`         INT UNSIGNED NOT NULL,
  `student_id`     INT UNSIGNED NOT NULL,
  `amount_paid`    DECIMAL(10,2) NOT NULL,
  `payment_date`   DATE NOT NULL,
  `payment_method` ENUM('cash','bank','online') DEFAULT 'cash',
  `receipt_no`     VARCHAR(50),
  `collected_by`   INT UNSIGNED,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`fee_id`)       REFERENCES `fees`(`id`)     ON DELETE CASCADE,
  FOREIGN KEY (`student_id`)   REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`collected_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── exams ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `exams` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(150) NOT NULL,
  `course_id`   INT UNSIGNED NOT NULL,
  `subject_id`  INT UNSIGNED NOT NULL,
  `exam_date`   DATE NOT NULL,
  `total_marks` INT DEFAULT 100,
  `pass_marks`  INT DEFAULT 40,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`)  REFERENCES `courses`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── results ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `results` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `exam_id`     INT UNSIGNED NOT NULL,
  `student_id`  INT UNSIGNED NOT NULL,
  `marks`       DECIMAL(5,2) NOT NULL,
  `grade`       VARCHAR(5),
  `remarks`     VARCHAR(255),
  `uploaded_by` INT UNSIGNED,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_res` (`exam_id`,`student_id`),
  FOREIGN KEY (`exam_id`)     REFERENCES `exams`(`id`)    ON DELETE CASCADE,
  FOREIGN KEY (`student_id`)  REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── notices ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notices` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`      VARCHAR(255) NOT NULL,
  `content`    TEXT NOT NULL,
  `audience`   ENUM('all','student','teacher','admin') DEFAULT 'all',
  `posted_by`  INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── SEED DATA ─────────────────────────────────────────────
-- Passwords are PHP bcrypt hashes — verified correct
-- Admin@123   → $2y$12$zp06M7vXuQMyarSSCOYIEeZ91dsmm8nAdBlcVpzCsjJYvQozP.23m
-- Teacher@123 → $2y$12$dGVId8NIOtQNC2wTwUVTgujwHRn9GSQLQ16S44BZR7XnwPPoT12Q.
-- Student@123 → $2y$12$b4OoHYcvF4pFXwH0eSYzGOr8gsoxgYmiFpvPBX0nrh3iNljgRy/6y

INSERT INTO `users` (`name`,`email`,`password`,`role`,`status`) VALUES
('Super Admin',        'admin@nenasala.lk',           '$2y$12$zp06M7vXuQMyarSSCOYIEeZ91dsmm8nAdBlcVpzCsjJYvQozP.23m', 'admin',   'active'),
('Mr. Kamal Silva',    'kamal.silva@nenasala.lk',     '$2y$12$dGVId8NIOtQNC2wTwUVTgujwHRn9GSQLQ16S44BZR7XnwPPoT12Q.', 'teacher', 'active'),
('Ms. Nimali Perera',  'nimali.perera@nenasala.lk',   '$2y$12$dGVId8NIOtQNC2wTwUVTgujwHRn9GSQLQ16S44BZR7XnwPPoT12Q.', 'teacher', 'active'),
('Ashan Fernando',     'ashan.fernando@nenasala.lk',  '$2y$12$b4OoHYcvF4pFXwH0eSYzGOr8gsoxgYmiFpvPBX0nrh3iNljgRy/6y', 'student', 'active'),
('Dilani Jayawardena', 'dilani.j@nenasala.lk',        '$2y$12$b4OoHYcvF4pFXwH0eSYzGOr8gsoxgYmiFpvPBX0nrh3iNljgRy/6y', 'student', 'active'),
('Kasun Rathnayake',   'kasun.r@nenasala.lk',         '$2y$12$b4OoHYcvF4pFXwH0eSYzGOr8gsoxgYmiFpvPBX0nrh3iNljgRy/6y', 'student', 'active');

-- Sample Courses
INSERT INTO `courses` (`name`,`code`,`description`,`duration`,`fee`) VALUES
('Advanced Level Science',  'ALS','Physics, Chemistry, Biology','2 Years',25000.00),
('Advanced Level Commerce', 'ALC','Accounting, Economics, Business','2 Years',20000.00),
('Ordinary Level',          'OL', 'Core O/L subjects','1 Year',15000.00),
('English Language',        'ELC','Spoken & Written English','6 Months',8000.00);

-- Subjects
INSERT INTO `subjects` (`course_id`,`name`,`code`,`credits`) VALUES
(1,'Physics','PHY',3),(1,'Chemistry','CHE',3),(1,'Biology','BIO',3),
(2,'Accounting','ACC',3),(2,'Economics','ECO',3),(2,'Business Studies','BUS',3),
(3,'Mathematics','MAT',3),(3,'Science','SCI',3),(3,'Sinhala','SIN',3),
(4,'Grammar','GRM',2),(4,'Conversation','CON',2);

-- Teacher profiles  (user_id 2 = Kamal, 3 = Nimali)
INSERT INTO `teachers` (`user_id`,`employee_id`,`phone`,`qualification`,`specialization`,`join_date`) VALUES
(2,'TCH-2024-0002','0771234567','B.Sc. Physics (University of Colombo)','Physics & Mathematics','2024-01-15'),
(3,'TCH-2024-0003','0779876543','B.A. English (University of Kelaniya)','English Language','2024-02-01');

-- Student profiles  (user_id 4 = Ashan, 5 = Dilani, 6 = Kasun)
INSERT INTO `students` (`user_id`,`student_id`,`course_id`,`phone`,`dob`,`gender`,`guardian_name`,`guardian_phone`,`admission_date`) VALUES
(4,'STU-2024-0004',1,'0712345678','2005-03-12','male',  'Sunil Fernando',  '0711111111','2024-01-10'),
(5,'STU-2024-0005',2,'0723456789','2005-07-25','female','Ranjith Jayawardena','0722222222','2024-01-15'),
(6,'STU-2024-0006',3,'0734567890','2006-11-08','male',  'Gamini Rathnayake','0733333333','2024-02-05');

-- ── modules (study materials / PDF uploads) ──────
CREATE TABLE IF NOT EXISTS `modules` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT,
  `subject_id`  INT UNSIGNED NOT NULL,
  `course_id`   INT UNSIGNED NOT NULL,
  `teacher_id`  INT UNSIGNED NOT NULL,
  `file_name`   VARCHAR(255) NOT NULL,
  `file_path`   VARCHAR(500) NOT NULL,
  `file_size`   INT UNSIGNED DEFAULT 0,
  `file_type`   VARCHAR(100) DEFAULT 'application/pdf',
  `downloads`   INT UNSIGNED DEFAULT 0,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`)  REFERENCES `subjects`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`course_id`)   REFERENCES `courses`(`id`)   ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`)  REFERENCES `teachers`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── materials (PDF modules uploaded by teachers) ─
CREATE TABLE IF NOT EXISTS `materials` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT,
  `file_name`   VARCHAR(255) NOT NULL,
  `file_path`   VARCHAR(500) NOT NULL,
  `file_size`   INT UNSIGNED DEFAULT 0,
  `course_id`   INT UNSIGNED NOT NULL,
  `subject_id`  INT UNSIGNED,
  `uploaded_by` INT UNSIGNED NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`)   REFERENCES `courses`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`)  REFERENCES `subjects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
