ALTER TABLE "schools" ADD COLUMN "region" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "city" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "rating" integer DEFAULT 5 NOT NULL;