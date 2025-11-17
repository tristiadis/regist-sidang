/**
 * Test Data Factories
 *
 * Helper functions to create test data easily.
 * Use these factories instead of manually creating test data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ======================
// USER FACTORIES
// ======================

export const createTestUser = async (overrides?: Partial<{
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'akademik' | 'dosen' | 'mahasiswa';
  nim?: string;
  prodi?: string;
}>) => {
  const defaultPassword = await bcrypt.hash('test123', 10);

  return prisma.user.create({
    data: {
      email: overrides?.email || `test${Date.now()}@test.com`,
      password: overrides?.password || defaultPassword,
      name: overrides?.name || 'Test User',
      role: overrides?.role || 'mahasiswa',
      nim: overrides?.nim,
      prodi: overrides?.prodi,
    },
  });
};

export const createAdmin = () => createTestUser({ role: 'admin', name: 'Admin Test' });
export const createAkademik = () => createTestUser({ role: 'akademik', name: 'Akademik Test' });
export const createDosen = (name?: string) => createTestUser({ role: 'dosen', name: name || 'Dosen Test' });
export const createMahasiswa = (nim?: string, prodi?: string) => createTestUser({
  role: 'mahasiswa',
  name: 'Mahasiswa Test',
  nim: nim || '1234567890',
  prodi: prodi || 'Teknik Informatika',
});

// ======================
// SIDANG TYPE FACTORIES
// ======================

export const createSidangType = async (name?: string) => {
  return prisma.sidangType.create({
    data: {
      name: name || `Sidang Test ${Date.now()}`,
    },
  });
};

// ======================
// WORKFLOW STEP FACTORIES
// ======================

export const createWorkflowStep = async (
  sidangTypeId: number,
  role: 'dosen' | 'akademik',
  stepOrder: number
) => {
  return prisma.workflowStep.create({
    data: {
      sidangTypeId,
      role,
      stepOrder,
    },
  });
};

export const createCompleteWorkflow = async (sidangTypeId: number) => {
  // Creates a 3-step workflow: dosen → dosen → akademik
  const step1 = await createWorkflowStep(sidangTypeId, 'dosen', 1);
  const step2 = await createWorkflowStep(sidangTypeId, 'dosen', 2);
  const step3 = await createWorkflowStep(sidangTypeId, 'akademik', 3);

  return { step1, step2, step3 };
};

// ======================
// REQUIREMENT FACTORIES
// ======================

export const createRequirement = async (sidangTypeId: number, name?: string) => {
  return prisma.requirement.create({
    data: {
      sidangTypeId,
      name: name || `Requirement Test ${Date.now()}`,
    },
  });
};

export const createRequirements = async (sidangTypeId: number, count: number = 3) => {
  const requirements = [];
  for (let i = 1; i <= count; i++) {
    requirements.push(
      await createRequirement(sidangTypeId, `Test Requirement ${i}`)
    );
  }
  return requirements;
};

// ======================
// REQUEST FACTORIES
// ======================

export const createRequest = async (
  mahasiswaId: number,
  sidangTypeId: number,
  status: 'pending' | 'approved' | 'rejected' | 'waiting_admin' | 'completed' = 'pending',
  currentStepId?: number | null
) => {
  return prisma.request.create({
    data: {
      mahasiswaId,
      sidangTypeId,
      status,
      currentStepId,
    },
  });
};

// ======================
// APPROVAL FACTORIES
// ======================

export const createApproval = async (
  requestId: number,
  stepId: number,
  approverId: number,
  action: 'pending' | 'approve' | 'reject' = 'pending',
  notes?: string
) => {
  return prisma.approval.create({
    data: {
      requestId,
      stepId,
      approvedBy: approverId,
      action,
      notes,
    },
  });
};

// ======================
// SIDANG SESSION FACTORIES
// ======================

export const createSidang = async (
  requestId: number,
  scheduledAt?: Date,
  location?: string,
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' = 'scheduled'
) => {
  return prisma.sidang.create({
    data: {
      requestId,
      scheduledAt: scheduledAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      location: location || 'Ruang Sidang Test',
      status,
    },
  });
};

// ======================
// REVISION NOTE FACTORIES
// ======================

export const createRevisionNote = async (
  sidangId: number,
  dosenId: number,
  content?: string
) => {
  return prisma.revisiNote.create({
    data: {
      sidangId,
      dosenId,
      content: content || 'Test revision note',
    },
  });
};

// ======================
// COMPLEX SCENARIO FACTORIES
// ======================

/**
 * Creates a complete sidang request scenario with workflow
 * Returns: mahasiswa, sidangType, request, steps, approvals
 */
export const createCompleteScenario = async () => {
  // Create users
  const mahasiswa = await createMahasiswa();
  const dosen1 = await createDosen('Dr. Dosen Satu');
  const dosen2 = await createDosen('Dr. Dosen Dua');
  const akademik = await createAkademik();

  // Create sidang type
  const sidangType = await createSidangType('Sidang Skripsi Test');

  // Create workflow
  const { step1, step2, step3 } = await createCompleteWorkflow(sidangType.id);

  // Create requirements
  const requirements = await createRequirements(sidangType.id, 3);

  // Create request
  const request = await createRequest(mahasiswa.id, sidangType.id, 'pending', step1.id);

  // Create pending approval
  const approval = await createApproval(request.id, step1.id, dosen1.id, 'pending');

  return {
    mahasiswa,
    dosen1,
    dosen2,
    akademik,
    sidangType,
    steps: { step1, step2, step3 },
    requirements,
    request,
    approval,
  };
};

/**
 * Creates a request that has been approved and is waiting for admin
 */
export const createApprovedRequest = async () => {
  const { mahasiswa, dosen1, akademik, sidangType, steps, request } = await createCompleteScenario();

  // Approve step 1
  await prisma.approval.updateMany({
    where: { requestId: request.id, stepId: steps.step1.id },
    data: { action: 'approve', notes: 'Disetujui' },
  });

  // Create and approve step 2
  await createApproval(request.id, steps.step2.id, dosen1.id, 'approve', 'Disetujui');

  // Create and approve step 3
  await createApproval(request.id, steps.step3.id, akademik.id, 'approve', 'Disetujui');

  // Update request status
  await prisma.request.update({
    where: { id: request.id },
    data: { status: 'waiting_admin', currentStepId: null },
  });

  return { mahasiswa, sidangType, request };
};

/**
 * Creates a completed sidang with revision notes
 */
export const createCompletedSidang = async () => {
  const { mahasiswa, dosen1, dosen2, sidangType, request } = await createApprovedRequest();

  // Create sidang session
  const sidang = await createSidang(request.id, new Date(), 'Ruang 301', 'completed');

  // Add revision notes
  await createRevisionNote(sidang.id, dosen1.id, 'Perbaiki metodologi');
  await createRevisionNote(sidang.id, dosen2.id, 'Tambahkan diagram');

  // Update request to completed
  await prisma.request.update({
    where: { id: request.id },
    data: { status: 'completed' },
  });

  return { mahasiswa, sidangType, request, sidang };
};

// ======================
// CLEANUP UTILITIES
// ======================

/**
 * Clears all test data from database
 * WARNING: Use only in tests!
 */
export const clearTestData = async () => {
  await prisma.revisiNote.deleteMany();
  await prisma.sidang.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.requirementFulfillment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.sidangType.deleteMany();
  await prisma.user.deleteMany();
};

/**
 * Disconnect prisma client
 * Call this in afterAll() hooks
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};
