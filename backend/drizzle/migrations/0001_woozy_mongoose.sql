CREATE TABLE "lesson_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_slot_id" uuid NOT NULL,
	"state" text DEFAULT 'PLANNED' NOT NULL,
	"start_code_hash" text,
	"start_code_issued_at" timestamp,
	"start_code_expires_at" timestamp,
	"started_at" timestamp,
	"started_by_student_at" timestamp,
	"end_requested_at" timestamp,
	"ended_by_student_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_sessions_time_slot_id_unique" UNIQUE("time_slot_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" uuid NOT NULL,
	"week_start_date" timestamp NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"schedule_snapshot" jsonb NOT NULL,
	"sent_at" timestamp,
	"allocation_started_at" timestamp,
	"allocation_completed_at" timestamp,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_schedule_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"student_profile_id" uuid NOT NULL,
	"unavailable_slot_keys" jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_slots" ADD COLUMN "schedule_cycle_id" uuid;--> statement-breakpoint
ALTER TABLE "time_slots" ADD COLUMN "day_key" text;--> statement-breakpoint
ALTER TABLE "time_slots" ADD COLUMN "slot_key" text;--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_time_slot_id_time_slots_id_fk" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_cycles" ADD CONSTRAINT "schedule_cycles_instructor_id_instructor_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_schedule_replies" ADD CONSTRAINT "student_schedule_replies_cycle_id_schedule_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."schedule_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_schedule_replies" ADD CONSTRAINT "student_schedule_replies_student_profile_id_student_profiles_id_fk" FOREIGN KEY ("student_profile_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_cycles_instructor_week_uq" ON "schedule_cycles" USING btree ("instructor_id","week_start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "student_schedule_replies_cycle_student_uq" ON "student_schedule_replies" USING btree ("cycle_id","student_profile_id");--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_schedule_cycle_id_schedule_cycles_id_fk" FOREIGN KEY ("schedule_cycle_id") REFERENCES "public"."schedule_cycles"("id") ON DELETE set null ON UPDATE no action;