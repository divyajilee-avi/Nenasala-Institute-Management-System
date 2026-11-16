-- ============================================================
-- FIX PASSWORDS — Run this in phpMyAdmin → SQL tab
-- Paste ALL of this and click GO
-- ============================================================
USE `nenasala_ims`;

-- Update admin password  →  Admin@123
UPDATE `users` SET `password` = '$2y$12$zp06M7vXuQMyarSSCOYIEeZ91dsmm8nAdBlcVpzCsjJYvQozP.23m'
WHERE `email` = 'admin@nenasala.lk';

-- Update teacher passwords  →  Teacher@123
UPDATE `users` SET `password` = '$2y$12$dGVId8NIOtQNC2wTwUVTgujwHRn9GSQLQ16S44BZR7XnwPPoT12Q.'
WHERE `email` IN ('kamal.silva@nenasala.lk', 'nimali.perera@nenasala.lk');

-- Update student passwords  →  Student@123
UPDATE `users` SET `password` = '$2y$12$b4OoHYcvF4pFXwH0eSYzGOr8gsoxgYmiFpvPBX0nrh3iNljgRy/6y'
WHERE `email` IN ('ashan.fernando@nenasala.lk', 'dilani.j@nenasala.lk', 'kasun.r@nenasala.lk');

-- Verify — you should see all 6 users
SELECT id, name, email, role, status,
       LEFT(password,20) AS hash_preview
FROM `users`
ORDER BY id;
