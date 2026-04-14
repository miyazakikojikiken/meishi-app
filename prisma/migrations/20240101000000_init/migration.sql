-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "card_side" AS ENUM ('FRONT', 'BACK');

-- CreateEnum
CREATE TYPE "ocr_status" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_kana" TEXT,
    "name_en" TEXT,
    "name_normalized" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "legacy_no" INTEGER,
    "company_id" TEXT,
    "company_name" TEXT NOT NULL,
    "company_name_kana" TEXT,
    "company_name_en" TEXT,
    "company_name_normalized" TEXT,
    "department" TEXT,
    "title" TEXT,
    "last_name" TEXT,
    "first_name" TEXT,
    "full_name" TEXT,
    "last_name_kana" TEXT,
    "first_name_kana" TEXT,
    "full_name_kana" TEXT,
    "full_name_en" TEXT,
    "full_name_normalized" TEXT,
    "postal_code" TEXT,
    "address" TEXT,
    "country" TEXT DEFAULT 'Japan',
    "tel" TEXT,
    "tel_normalized" TEXT,
    "fax" TEXT,
    "mobile" TEXT,
    "mobile_normalized" TEXT,
    "email" TEXT,
    "email_normalized" TEXT,
    "card_exchange_place" TEXT,
    "contact_memo" TEXT,
    "note" TEXT,
    "category" TEXT,
    "sub_category" TEXT,
    "status" TEXT DEFAULT 'active',
    "next_action" TEXT,
    "last_contacted_at" DATE,
    "acquired_at" DATE,
    "ocr_accuracy" DECIMAL(5,2),
    "duplicate_candidates" JSONB DEFAULT '[]',
    "owner_user_id" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_cards" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "side" "card_side" NOT NULL DEFAULT 'FRONT',
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_jobs" (
    "id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "status" "ocr_status" NOT NULL DEFAULT 'PENDING',
    "front_image_path" TEXT,
    "back_image_path" TEXT,
    "raw_ocr_result" JSONB,
    "extracted_fields" JSONB,
    "confidence_scores" JSONB,
    "overall_accuracy" DECIMAL(5,2),
    "result_contact_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_histories" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "contacted_at" DATE NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "title" TEXT,
    "place" TEXT,
    "memo" TEXT,
    "next_action" TEXT,
    "status" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "interaction_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "status" "import_status" NOT NULL DEFAULT 'PENDING',
    "total_rows" INTEGER,
    "success_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "skip_rows" INTEGER NOT NULL DEFAULT 0,
    "duplicate_policy" TEXT NOT NULL DEFAULT 'skip',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_job_rows" (
    "id" TEXT NOT NULL,
    "import_job_id" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "error_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_job_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "companies_name_normalized_idx" ON "companies"("name_normalized");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "contacts_company_name_idx" ON "contacts"("company_name");

-- CreateIndex
CREATE INDEX "contacts_full_name_idx" ON "contacts"("full_name");

-- CreateIndex
CREATE INDEX "contacts_email_normalized_idx" ON "contacts"("email_normalized");

-- CreateIndex
CREATE INDEX "contacts_tel_normalized_idx" ON "contacts"("tel_normalized");

-- CreateIndex
CREATE INDEX "contacts_mobile_normalized_idx" ON "contacts"("mobile_normalized");

-- CreateIndex
CREATE INDEX "contacts_company_name_normalized_idx" ON "contacts"("company_name_normalized");

-- CreateIndex
CREATE INDEX "contacts_full_name_normalized_idx" ON "contacts"("full_name_normalized");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_last_contacted_at_idx" ON "contacts"("last_contacted_at");

-- CreateIndex
CREATE INDEX "contacts_owner_user_id_idx" ON "contacts"("owner_user_id");

-- CreateIndex
CREATE INDEX "contacts_deleted_at_idx" ON "contacts"("deleted_at");

-- CreateIndex
CREATE INDEX "business_cards_contact_id_idx" ON "business_cards"("contact_id");

-- CreateIndex
CREATE INDEX "ocr_jobs_created_by_idx" ON "ocr_jobs"("created_by");

-- CreateIndex
CREATE INDEX "ocr_jobs_status_idx" ON "ocr_jobs"("status");

-- CreateIndex
CREATE INDEX "interaction_histories_contact_id_idx" ON "interaction_histories"("contact_id");

-- CreateIndex
CREATE INDEX "interaction_histories_contacted_at_idx" ON "interaction_histories"("contacted_at");

-- CreateIndex
CREATE INDEX "import_jobs_created_by_idx" ON "import_jobs"("created_by");

-- CreateIndex
CREATE INDEX "import_job_rows_import_job_id_idx" ON "import_job_rows"("import_job_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_idx" ON "audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_cards" ADD CONSTRAINT "business_cards_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_histories" ADD CONSTRAINT "interaction_histories_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_histories" ADD CONSTRAINT "interaction_histories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_rows" ADD CONSTRAINT "import_job_rows_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

