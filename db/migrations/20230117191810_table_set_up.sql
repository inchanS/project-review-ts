-- migrate:up

CREATE TABLE `users` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `nickname` varchar(20) UNIQUE NOT NULL,
  `password` varchar(100) NOT NULL,
  `email` varchar(20) UNIQUE NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `feeds` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(250) NOT NULL,
  `content` varchar(10000) NOT NULL,
  `estimation_id` tinyint,
  `category_id` int NOT NULL,
  `status_id` tinyint NOT NULL,
  `posted_at` datetime,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `feed_status` (
  `id` tinyint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `status` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `estimation` (
  `id` tinyint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `estimation` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `symbol` (
  `id` tinyint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `symbol` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `feed_symbol` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `feed_id` int NOT NULL,
  `symbol_id` tinyint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `upload_files` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `is_img` boolean NOT NULL,
  `file_link` varchar(500) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `feed_uploadFiles` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `feed_id` int NOT NULL,
  `upload_files_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `categories` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `category` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE TABLE `comments` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `feed_id` int NOT NULL,
  `comment` varchar(1000) NOT NULL,
  `reply_id` int DEFAULT (0),
  `is_private` boolean DEFAULT (false),
  `is_deleted` boolean DEFAULT (false),
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'update time'
);

CREATE UNIQUE INDEX `feed_symbol_index_0` ON `feed_symbol` (`user_id`, `feed_id`);

ALTER TABLE `feeds` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `feeds` ADD FOREIGN KEY (`estimation_id`) REFERENCES `estimation` (`id`);

ALTER TABLE `feeds` ADD FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

ALTER TABLE `feeds` ADD FOREIGN KEY (`status_id`) REFERENCES `feed_status` (`id`);

ALTER TABLE `feed_symbol` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `feed_symbol` ADD FOREIGN KEY (`feed_id`) REFERENCES `feeds` (`id`);

ALTER TABLE `feed_symbol` ADD FOREIGN KEY (`symbol_id`) REFERENCES `symbol` (`id`);

ALTER TABLE `feed_uploadFiles` ADD FOREIGN KEY (`feed_id`) REFERENCES `feeds` (`id`);

ALTER TABLE `feed_uploadFiles` ADD FOREIGN KEY (`upload_files_id`) REFERENCES `upload_files` (`id`);

ALTER TABLE `comments` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `comments` ADD FOREIGN KEY (`feed_id`) REFERENCES `feeds` (`id`);


-- migrate:down

