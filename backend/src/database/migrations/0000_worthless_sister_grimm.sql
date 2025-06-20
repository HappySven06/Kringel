CREATE TABLE `answer_variant` (
	`id` char(36) NOT NULL,
	`correct` boolean NOT NULL DEFAULT false,
	`answer` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `answer_variant_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `block` (
	`id` char(36) NOT NULL,
	`test_id` char(36) NOT NULL,
	`block_number` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `block_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question` (
	`id` char(36) NOT NULL,
	`block_id` char(36) NOT NULL,
	`matrix_id` char(36),
	`type` int NOT NULL,
	`order_number` int NOT NULL,
	`description` text NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_matrix` (
	`id` char(36) NOT NULL,
	`block_id` char(36) NOT NULL,
	`name` varchar(255),
	`description` text,
	`order_number` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_matrix_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` char(36) NOT NULL,
	`attempt_id` char(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_answer` (
	`id` char(36) NOT NULL,
	`team_id` char(36) NOT NULL,
	`question_id` char(36) NOT NULL,
	`answer` text,
	`points` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_answer_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start` datetime NOT NULL,
	`end` datetime NOT NULL,
	`time_limit` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_attempt` (
	`id` char(36) NOT NULL,
	`test_id` char(36) NOT NULL,
	`team_id` char(36) NOT NULL,
	`start` datetime NOT NULL,
	`end` datetime NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_attempt_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` char(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `block` ADD CONSTRAINT `block_test_id_test_id_fk` FOREIGN KEY (`test_id`) REFERENCES `test`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question` ADD CONSTRAINT `question_block_id_block_id_fk` FOREIGN KEY (`block_id`) REFERENCES `block`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question` ADD CONSTRAINT `question_matrix_id_question_matrix_id_fk` FOREIGN KEY (`matrix_id`) REFERENCES `question_matrix`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_matrix` ADD CONSTRAINT `question_matrix_block_id_block_id_fk` FOREIGN KEY (`block_id`) REFERENCES `block`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team` ADD CONSTRAINT `team_attempt_id_test_attempt_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `test_attempt`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_answer` ADD CONSTRAINT `team_answer_team_id_team_id_fk` FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_answer` ADD CONSTRAINT `team_answer_question_id_question_id_fk` FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test` ADD CONSTRAINT `test_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_attempt` ADD CONSTRAINT `test_attempt_test_id_test_id_fk` FOREIGN KEY (`test_id`) REFERENCES `test`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_attempt` ADD CONSTRAINT `test_attempt_team_id_team_id_fk` FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE no action ON UPDATE no action;