CREATE TABLE `family_settings` (
	`family_id` text PRIMARY KEY NOT NULL,
	`timezone` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "family_settings_timezone_supported" CHECK("family_settings"."timezone" in (
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Phoenix',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu'
      ))
);
