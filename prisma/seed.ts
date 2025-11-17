import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seeding...");

  // Clear existing data (for testing only - use with caution!)
  console.log("🧹 Cleaning existing data...");
  await prisma.revisiNote.deleteMany();
  await prisma.sidang.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.requirementFulfillment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.sidangType.deleteMany();
  await prisma.user.deleteMany();

  // ======================
  // USERS
  // ======================
  console.log("\n👥 Creating users...");

  const defaultPassword = await bcrypt.hash("test123", 10);

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: defaultPassword,
      name: "Admin Test",
      role: "admin",
    },
  });
  console.log("✅ Admin:", admin.email);

  // Akademik
  const akademik = await prisma.user.create({
    data: {
      email: "akademik@test.com",
      password: defaultPassword,
      name: "Akademik Test",
      role: "akademik",
    },
  });
  console.log("✅ Akademik:", akademik.email);

  // Dosen (3 users)
  const dosen1 = await prisma.user.create({
    data: {
      email: "dosen1@test.com",
      password: defaultPassword,
      name: "Prof. Dr. Dosen Satu, M.Kom",
      role: "dosen",
    },
  });

  const dosen2 = await prisma.user.create({
    data: {
      email: "dosen2@test.com",
      password: defaultPassword,
      name: "Dr. Dosen Dua, M.T",
      role: "dosen",
    },
  });

  const dosen3 = await prisma.user.create({
    data: {
      email: "dosen3@test.com",
      password: defaultPassword,
      name: "Dr. Dosen Tiga, S.Kom, M.Sc",
      role: "dosen",
    },
  });
  console.log("✅ Dosen: 3 users created");

  // Mahasiswa (5 users)
  const mahasiswa1 = await prisma.user.create({
    data: {
      email: "mahasiswa1@test.com",
      password: defaultPassword,
      name: "Budi Santoso",
      role: "mahasiswa",
      nim: "1234567890",
      prodi: "Teknik Informatika",
    },
  });

  const mahasiswa2 = await prisma.user.create({
    data: {
      email: "mahasiswa2@test.com",
      password: defaultPassword,
      name: "Siti Nurhaliza",
      role: "mahasiswa",
      nim: "0987654321",
      prodi: "Sistem Informasi",
    },
  });

  const mahasiswa3 = await prisma.user.create({
    data: {
      email: "mahasiswa3@test.com",
      password: defaultPassword,
      name: "Ahmad Rizki",
      role: "mahasiswa",
      nim: "1122334455",
      prodi: "Teknik Informatika",
    },
  });

  const mahasiswa4 = await prisma.user.create({
    data: {
      email: "mahasiswa4@test.com",
      password: defaultPassword,
      name: "Dewi Lestari",
      role: "mahasiswa",
      nim: "5544332211",
      prodi: "Sistem Informasi",
    },
  });

  const mahasiswa5 = await prisma.user.create({
    data: {
      email: "mahasiswa5@test.com",
      password: defaultPassword,
      name: "Rudi Hermawan",
      role: "mahasiswa",
      nim: "9988776655",
      prodi: "Teknik Informatika",
    },
  });
  console.log("✅ Mahasiswa: 5 users created");

  // ======================
  // SIDANG TYPES
  // ======================
  console.log("\n📋 Creating sidang types...");

  const sidangSkripsi = await prisma.sidangType.create({
    data: { name: "Sidang Skripsi" },
  });

  const sidangProposal = await prisma.sidangType.create({
    data: { name: "Sidang Proposal" },
  });

  const sidangKompre = await prisma.sidangType.create({
    data: { name: "Sidang Komprehensif" },
  });

  const sidangJobTraining = await prisma.sidangType.create({
    data: { name: "Sidang Job Training" },
  });

  console.log("✅ Created 4 sidang types");

  // ======================
  // WORKFLOW STEPS
  // ======================
  console.log("\n⚙️ Creating workflow steps...");

  // Workflow for Sidang Skripsi (3 steps: dosen → dosen → akademik)
  const skripsiStep1 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: sidangSkripsi.id,
      role: "dosen",
      stepOrder: 1,
    },
  });

  const skripsiStep2 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: sidangSkripsi.id,
      role: "dosen",
      stepOrder: 2,
    },
  });

  const skripsiStep3 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: sidangSkripsi.id,
      role: "akademik",
      stepOrder: 3,
    },
  });

  // Workflow for Sidang Proposal (2 steps: dosen → akademik)
  const proposalStep1 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: sidangProposal.id,
      role: "dosen",
      stepOrder: 1,
    },
  });

  const proposalStep2 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: sidangProposal.id,
      role: "akademik",
      stepOrder: 2,
    },
  });

  // Workflow for Sidang Kompre (4 steps)
  await prisma.workflowStep.createMany({
    data: [
      { sidangTypeId: sidangKompre.id, role: "dosen", stepOrder: 1 },
      { sidangTypeId: sidangKompre.id, role: "dosen", stepOrder: 2 },
      { sidangTypeId: sidangKompre.id, role: "dosen", stepOrder: 3 },
      { sidangTypeId: sidangKompre.id, role: "akademik", stepOrder: 4 },
    ],
  });

  // Workflow for Job Training (1 step: akademik only)
  await prisma.workflowStep.create({
    data: {
      sidangTypeId: sidangJobTraining.id,
      role: "akademik",
      stepOrder: 1,
    },
  });

  console.log("✅ Created workflow steps for all sidang types");

  // ======================
  // REQUIREMENTS
  // ======================
  console.log("\n📄 Creating requirements...");

  // Requirements for Sidang Skripsi
  await prisma.requirement.createMany({
    data: [
      { sidangTypeId: sidangSkripsi.id, name: "Lembar Persetujuan Pembimbing" },
      { sidangTypeId: sidangSkripsi.id, name: "Draft Skripsi" },
      { sidangTypeId: sidangSkripsi.id, name: "Kartu Bimbingan" },
      { sidangTypeId: sidangSkripsi.id, name: "Transkrip Nilai" },
      { sidangTypeId: sidangSkripsi.id, name: "Sertifikat TOEFL" },
      { sidangTypeId: sidangSkripsi.id, name: "Bukti Pembayaran UKT" },
    ],
  });

  // Requirements for Sidang Proposal
  await prisma.requirement.createMany({
    data: [
      { sidangTypeId: sidangProposal.id, name: "Proposal Penelitian" },
      { sidangTypeId: sidangProposal.id, name: "Lembar Persetujuan Pembimbing" },
      { sidangTypeId: sidangProposal.id, name: "Transkrip Nilai Sementara" },
      { sidangTypeId: sidangProposal.id, name: "Form Pendaftaran Proposal" },
    ],
  });

  // Requirements for Sidang Kompre
  await prisma.requirement.createMany({
    data: [
      { sidangTypeId: sidangKompre.id, name: "Transkrip Nilai Lengkap" },
      { sidangTypeId: sidangKompre.id, name: "Sertifikat Kompetensi" },
      { sidangTypeId: sidangKompre.id, name: "Bukti Pembayaran" },
      { sidangTypeId: sidangKompre.id, name: "Form Pendaftaran Kompre" },
    ],
  });

  // Requirements for Job Training
  await prisma.requirement.createMany({
    data: [
      { sidangTypeId: sidangJobTraining.id, name: "Laporan Job Training" },
      { sidangTypeId: sidangJobTraining.id, name: "Lembar Pengesahan Perusahaan" },
      { sidangTypeId: sidangJobTraining.id, name: "Logbook Kegiatan" },
    ],
  });

  console.log("✅ Created requirements for all sidang types");

  // ======================
  // SAMPLE REQUESTS & APPROVALS
  // ======================
  console.log("\n📝 Creating sample requests...");

  // Request 1: Mahasiswa 1 - Sidang Skripsi (waiting approval at step 1)
  const request1 = await prisma.request.create({
    data: {
      mahasiswaId: mahasiswa1.id,
      sidangTypeId: sidangSkripsi.id,
      status: "pending",
      currentStepId: skripsiStep1.id,
    },
  });

  await prisma.approval.create({
    data: {
      requestId: request1.id,
      stepId: skripsiStep1.id,
      approvedBy: dosen1.id,
      action: "pending",
    },
  });

  // Request 2: Mahasiswa 2 - Sidang Skripsi (approved step 1, waiting step 2)
  const request2 = await prisma.request.create({
    data: {
      mahasiswaId: mahasiswa2.id,
      sidangTypeId: sidangSkripsi.id,
      status: "pending",
      currentStepId: skripsiStep2.id,
    },
  });

  await prisma.approval.create({
    data: {
      requestId: request2.id,
      stepId: skripsiStep1.id,
      approvedBy: dosen1.id,
      action: "approve",
      notes: "Disetujui, dokumen sudah lengkap",
    },
  });

  await prisma.approval.create({
    data: {
      requestId: request2.id,
      stepId: skripsiStep2.id,
      approvedBy: dosen2.id,
      action: "pending",
    },
  });

  // Request 3: Mahasiswa 3 - Sidang Proposal (all approved, waiting admin)
  const request3 = await prisma.request.create({
    data: {
      mahasiswaId: mahasiswa3.id,
      sidangTypeId: sidangProposal.id,
      status: "waiting_admin",
      currentStepId: null,
    },
  });

  await prisma.approval.createMany({
    data: [
      {
        requestId: request3.id,
        stepId: proposalStep1.id,
        approvedBy: dosen1.id,
        action: "approve",
        notes: "Proposal bagus, lanjutkan",
      },
      {
        requestId: request3.id,
        stepId: proposalStep2.id,
        approvedBy: akademik.id,
        action: "approve",
        notes: "Disetujui untuk sidang proposal",
      },
    ],
  });

  // Request 4: Mahasiswa 4 - Sidang Skripsi (rejected)
  const request4 = await prisma.request.create({
    data: {
      mahasiswaId: mahasiswa4.id,
      sidangTypeId: sidangSkripsi.id,
      status: "rejected",
      currentStepId: null,
    },
  });

  await prisma.approval.create({
    data: {
      requestId: request4.id,
      stepId: skripsiStep1.id,
      approvedBy: dosen1.id,
      action: "reject",
      notes: "Dokumen belum lengkap, mohon dilengkapi terlebih dahulu",
    },
  });

  // Request 5: Mahasiswa 5 - Sidang Proposal (completed with sidang)
  const request5 = await prisma.request.create({
    data: {
      mahasiswaId: mahasiswa5.id,
      sidangTypeId: sidangProposal.id,
      status: "completed",
      currentStepId: null,
    },
  });

  await prisma.approval.createMany({
    data: [
      {
        requestId: request5.id,
        stepId: proposalStep1.id,
        approvedBy: dosen2.id,
        action: "approve",
        notes: "Disetujui",
      },
      {
        requestId: request5.id,
        stepId: proposalStep2.id,
        approvedBy: akademik.id,
        action: "approve",
        notes: "Disetujui",
      },
    ],
  });

  // Create sidang session for request 5
  const sidang1 = await prisma.sidang.create({
    data: {
      requestId: request5.id,
      scheduledAt: new Date("2025-01-15T10:00:00"),
      location: "Ruang Sidang 301",
      status: "completed",
    },
  });

  // Add revision notes from dosen for completed sidang
  await prisma.revisiNote.createMany({
    data: [
      {
        sidangId: sidang1.id,
        dosenId: dosen1.id,
        content: "Perbaiki bagian metode penelitian, tambahkan referensi yang lebih baru",
      },
      {
        sidangId: sidang1.id,
        dosenId: dosen2.id,
        content: "Tambahkan diagram alur sistem dan perbaiki formatting",
      },
    ],
  });

  console.log("✅ Created 5 sample requests with various statuses");

  // ======================
  // SUMMARY
  // ======================
  console.log("\n✨ Seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log("   Users: 12 (1 admin, 1 akademik, 3 dosen, 5 mahasiswa, 2 others)");
  console.log("   Sidang Types: 4");
  console.log("   Workflow Steps: 10");
  console.log("   Requirements: 17");
  console.log("   Requests: 5 (various statuses)");
  console.log("   Approvals: 9");
  console.log("   Sidang Sessions: 1");
  console.log("   Revision Notes: 2");

  console.log("\n🔑 Test User Credentials:");
  console.log("   All users have password: test123");
  console.log("\n   Admin:");
  console.log("   - admin@test.com");
  console.log("\n   Akademik:");
  console.log("   - akademik@test.com");
  console.log("\n   Dosen:");
  console.log("   - dosen1@test.com");
  console.log("   - dosen2@test.com");
  console.log("   - dosen3@test.com");
  console.log("\n   Mahasiswa:");
  console.log("   - mahasiswa1@test.com (has pending request)");
  console.log("   - mahasiswa2@test.com (has request in progress)");
  console.log("   - mahasiswa3@test.com (has request waiting admin)");
  console.log("   - mahasiswa4@test.com (has rejected request)");
  console.log("   - mahasiswa5@test.com (has completed request)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
