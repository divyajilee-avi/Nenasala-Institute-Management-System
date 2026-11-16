-- Run this in phpMyAdmin → SQL tab if database already exists
USE `nenasala_ims`;

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

SELECT 'modules table created successfully' AS result;
