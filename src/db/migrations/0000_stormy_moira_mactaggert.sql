CREATE TABLE `persons` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`name` text NOT NULL,
	`display_order` integer NOT NULL,
	`emoji` text NOT NULL,
	CONSTRAINT "persons_display_order_nonnegative" CHECK("persons"."display_order" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `persons_family_display_order_unique` ON `persons` (`family_id`,`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `persons_family_id_id_unique` ON `persons` (`family_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `persons_family_name_unique` ON `persons` (`family_id`,`name`);--> statement-breakpoint
CREATE TABLE `skip_days` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`date` text NOT NULL,
	`reason` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skip_days_family_date_unique` ON `skip_days` (`family_id`,`date`);--> statement-breakpoint
CREATE TABLE `streaks` (
	`person_id` text PRIMARY KEY NOT NULL,
	`current_count` integer NOT NULL,
	`best_count` integer NOT NULL,
	`last_qualifying_date` text,
	FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "streaks_current_count_nonnegative" CHECK("streaks"."current_count" >= 0),
	CONSTRAINT "streaks_best_count_nonnegative" CHECK("streaks"."best_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE `task_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`date` text NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_completions_task_date_unique` ON `task_completions` (`task_id`,`date`);--> statement-breakpoint
CREATE INDEX `task_completions_date_idx` ON `task_completions` (`date`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`person_id` text NOT NULL,
	`title` text NOT NULL,
	`emoji` text NOT NULL,
	`schedule_rules` text NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT "tasks_family_person_fk" FOREIGN KEY (`family_id`,`person_id`) REFERENCES `persons`(`family_id`,`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "tasks_schedule_rules_json_valid" CHECK(json_valid("tasks"."schedule_rules"))
);
--> statement-breakpoint
CREATE INDEX `tasks_family_person_idx` ON `tasks` (`family_id`,`person_id`);
