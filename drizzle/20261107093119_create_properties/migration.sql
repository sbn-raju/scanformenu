CREATE TYPE "member_role" AS ENUM('owner', 'manager', 'staff');--> statement-breakpoint
CREATE TYPE "property_scale" AS ENUM('small', 'medium', 'large', 'enterprise');--> statement-breakpoint
CREATE TYPE "property_type" AS ENUM('restaurant', 'cafe', 'bar', 'hotel', 'resort', 'bakery', 'cloud_kitchen', 'food_court', 'other');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"type" "property_type" NOT NULL,
	"description" text,
	"owner_name" text NOT NULL,
	"legal_name" text,
	"tax_id" text,
	"established_on" date,
	"scale" "property_scale" NOT NULL,
	"seating_capacity" integer,
	"room_count" integer,
	"floor_count" integer,
	"staff_count" integer,
	"area_sq_ft" integer,
	"email" text,
	"phone" text,
	"website" text,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text,
	"postal_code" text,
	"country" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_counts_non_negative" CHECK (coalesce("seating_capacity", 0) >= 0
        and coalesce("room_count", 0) >= 0
        and coalesce("floor_count", 0) >= 0
        and coalesce("staff_count", 0) >= 0
        and coalesce("area_sq_ft", 0) >= 0)
);
--> statement-breakpoint
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "property_members" (
	"property_id" uuid,
	"user_id" uuid,
	"role" "member_role" DEFAULT 'staff'::"member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "property_members_pkey" PRIMARY KEY("property_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "property_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY,
	"email_product_updates" boolean DEFAULT true NOT NULL,
	"email_weekly_summary" boolean DEFAULT true NOT NULL,
	"email_security_alerts" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "property_members_user_id_idx" ON "property_members" ("user_id");--> statement-breakpoint
ALTER TABLE "property_members" ADD CONSTRAINT "property_members_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "property_members" ADD CONSTRAINT "property_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;