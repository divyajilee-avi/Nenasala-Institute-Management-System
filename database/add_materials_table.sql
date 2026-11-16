-- Run this in phpMyAdmin → SQL tab to add materials table
USE `nenasala_ims`;

CREATE TABLE IF NOT EXISTS `materials` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT,
  `file_name`   VARCHAR(255) NOT NULL,
  `file_path`   VARCHAR(500) NOT NULL,
  `file_size`   INT UNSIGNED DEFAULT 0,
  `course_id`   INT UNSIGNED NOT NULL,
  `subject_id`  INT UNSIGNED NULL,
  `uploaded_by` INT UNSIGNED NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`)   REFERENCES `courses`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`)  REFERENCES `subjects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
