-- AlterTable: Add approved_at column to approvals table
ALTER TABLE "approvals" ADD COLUMN "approved_at" TIMESTAMP(3);

-- CreateIndex: Optimize RBAC queries on users table
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex: Optimize role-based requirement queries
CREATE INDEX "requirements_role_idx" ON "requirements"("role");

-- CreateIndex: Optimize sidang type queries on requirements
CREATE INDEX "requirements_sidang_type_id_idx" ON "requirements"("sidang_type_id");

-- CreateIndex: Optimize student-owned request queries
CREATE INDEX "requests_mahasiswa_id_idx" ON "requests"("mahasiswa_id");

-- CreateIndex: Optimize status filtering on requests
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex: Optimize sidang type queries on requests
CREATE INDEX "requests_sidang_type_id_idx" ON "requests"("sidang_type_id");

-- CreateIndex: Optimize current step lookups on requests
CREATE INDEX "requests_current_step_id_idx" ON "requests"("current_step_id");

-- CreateIndex: Optimize sorting by creation date on requests
CREATE INDEX "requests_created_at_idx" ON "requests"("created_at");

-- CreateIndex: Optimize student dashboard queries (composite index)
CREATE INDEX "requests_mahasiswa_id_status_idx" ON "requests"("mahasiswa_id", "status");

-- CreateIndex: Optimize request fulfillment queries
CREATE INDEX "requirement_fulfillments_request_id_idx" ON "requirement_fulfillments"("request_id");

-- CreateIndex: Optimize requirement-based queries on fulfillments
CREATE INDEX "requirement_fulfillments_requirement_id_idx" ON "requirement_fulfillments"("requirement_id");

-- CreateIndex: Optimize confirmer queries on fulfillments
CREATE INDEX "requirement_fulfillments_confirmed_by_idx" ON "requirement_fulfillments"("confirmed_by");

-- CreateIndex: Optimize request approval queries
CREATE INDEX "approvals_request_id_idx" ON "approvals"("request_id");

-- CreateIndex: Optimize dosen-assigned approval queries (RBAC)
CREATE INDEX "approvals_approved_by_idx" ON "approvals"("approved_by");

-- CreateIndex: Optimize step-based queries on approvals
CREATE INDEX "approvals_step_id_idx" ON "approvals"("step_id");

-- CreateIndex: Optimize sorting by creation date on approvals
CREATE INDEX "approvals_created_at_idx" ON "approvals"("created_at");

-- CreateIndex: Optimize authorization checks (composite index)
CREATE INDEX "approvals_request_id_step_id_approved_by_idx" ON "approvals"("request_id", "step_id", "approved_by");

-- CreateIndex: Optimize request revision queries
CREATE INDEX "revisi_notes_request_id_idx" ON "revisi_notes"("request_id");

-- CreateIndex: Optimize dosen revision queries
CREATE INDEX "revisi_notes_dosen_id_idx" ON "revisi_notes"("dosen_id");

-- CreateIndex: Optimize sorting by creation date on revisi notes
CREATE INDEX "revisi_notes_created_at_idx" ON "revisi_notes"("created_at");
