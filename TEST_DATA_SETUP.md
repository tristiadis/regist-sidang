# Test Data Setup Guide

Complete guide for setting up and using test data in the Sidang Workflow System.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Seeding](#database-seeding)
3. [Test Fixtures](#test-fixtures)
4. [Test Helpers](#test-helpers)
5. [Environment Setup](#environment-setup)
6. [Usage Examples](#usage-examples)

---

## Overview

This project includes comprehensive test data setup for:
- **Unit Testing**: Component tests with Jest & React Testing Library
- **Integration Testing**: API endpoint tests
- **E2E Testing**: Full workflow scenarios
- **Manual Testing**: Pre-populated data for UI testing

---

## Database Seeding

### Quick Start

```bash
# Seed the database with test data
npm run seed
```

### What Gets Created

The seed script (`prisma/seed.ts`) creates:

**Users (10 total)**:
- 1 Admin
- 1 Akademik
- 3 Dosen
- 5 Mahasiswa (with different request statuses)

**Sidang Types (4)**:
- Sidang Skripsi
- Sidang Proposal
- Sidang Komprehensif
- Sidang Job Training

**Workflow Steps (10 total)**:
- Skripsi: 3 steps (dosen → dosen → akademik)
- Proposal: 2 steps (dosen → akademik)
- Kompre: 4 steps (dosen × 3 → akademik)
- Job Training: 1 step (akademik)

**Requirements (17 total)**:
- 6 for Sidang Skripsi
- 4 for Sidang Proposal
- 4 for Sidang Kompre
- 3 for Job Training

**Sample Requests (5)**:
- Request 1: Pending at step 1
- Request 2: In progress at step 2
- Request 3: Waiting for admin
- Request 4: Rejected
- Request 5: Completed with sidang and revisions

### Test User Credentials

All test users have password: **`test123`**

| Role | Email | Name | Status |
|------|-------|------|--------|
| Admin | admin@test.com | Admin Test | - |
| Akademik | akademik@test.com | Akademik Test | - |
| Dosen | dosen1@test.com | Prof. Dr. Dosen Satu, M.Kom | - |
| Dosen | dosen2@test.com | Dr. Dosen Dua, M.T | - |
| Dosen | dosen3@test.com | Dr. Dosen Tiga, S.Kom, M.Sc | - |
| Mahasiswa | mahasiswa1@test.com | Budi Santoso | Has pending request |
| Mahasiswa | mahasiswa2@test.com | Siti Nurhaliza | Has request in progress |
| Mahasiswa | mahasiswa3@test.com | Ahmad Rizki | Has request waiting admin |
| Mahasiswa | mahasiswa4@test.com | Dewi Lestari | Has rejected request |
| Mahasiswa | mahasiswa5@test.com | Rudi Hermawan | Has completed request |

---

## Test Fixtures

### File Fixtures

Located in: `tests/fixtures/files/`

**Available Files**:

1. **`valid-document.pdf`**
   - Size: ~500 bytes
   - Type: PDF
   - Purpose: Testing successful upload
   - Usage:
     ```typescript
     import fs from 'fs';
     import path from 'path';

     const pdfBuffer = fs.readFileSync(
       path.join(__dirname, '../fixtures/files/valid-document.pdf')
     );
     const file = new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' });
     ```

2. **`invalid-type.txt`**
   - Type: Text file
   - Purpose: Testing file type validation (should be rejected)
   - Expected: Upload fails with "unsupported file type" error

### Generating Large Files

For file size testing:

```bash
# Create 11MB file (should fail - exceeds 10MB limit)
dd if=/dev/zero of=tests/fixtures/files/too-large.bin bs=1M count=11

# Create 5MB file (should pass)
dd if=/dev/zero of=tests/fixtures/files/medium-file.pdf bs=1M count=5
```

---

## Test Helpers

### Test Factories

Located in: `tests/helpers/factories.ts`

Factory functions to create test data easily:

#### User Factories

```typescript
import {
  createAdmin,
  createAkademik,
  createDosen,
  createMahasiswa,
} from '@/tests/helpers/factories';

// Create test users
const admin = await createAdmin();
const dosen = await createDosen('Dr. Test Dosen');
const mahasiswa = await createMahasiswa('1234567890', 'Teknik Informatika');
```

#### Complete Scenario Factory

```typescript
import { createCompleteScenario } from '@/tests/helpers/factories';

// Creates: users, sidang type, workflow, requirements, request, approval
const scenario = await createCompleteScenario();

// Access created data
console.log(scenario.mahasiswa.email);
console.log(scenario.request.id);
console.log(scenario.steps.step1.id);
```

#### Approved Request Factory

```typescript
import { createApprovedRequest } from '@/tests/helpers/factories';

// Creates a request that passed all approvals, waiting for admin
const { mahasiswa, sidangType, request } = await createApprovedRequest();
```

#### Completed Sidang Factory

```typescript
import { createCompletedSidang } from '@/tests/helpers/factories';

// Creates completed sidang with revision notes
const { mahasiswa, request, sidang } = await createCompletedSidang();
```

#### Cleanup

```typescript
import {
  clearTestData,
  disconnectPrisma,
} from '@/tests/helpers/factories';

afterEach(async () => {
  await clearTestData(); // Clear all test data
});

afterAll(async () => {
  await disconnectPrisma(); // Disconnect Prisma client
});
```

### Test Utilities

Located in: `tests/helpers/test-utils.ts`

Utility functions for common testing tasks:

#### File Helpers

```typescript
import {
  createValidPDF,
  createValidImage,
  createLargeFile,
  createTestFile,
} from '@/tests/helpers/test-utils';

// Create test files
const pdf = createValidPDF();
const image = createValidImage();
const largeFile = createLargeFile(11); // 11MB file

// Custom file
const customFile = createTestFile(
  'content here',
  'custom.pdf',
  'application/pdf'
);
```

#### Session Helpers

```typescript
import {
  createMockSession,
  mockServerSession,
} from '@/tests/helpers/test-utils';

// Create mock session
const session = createMockSession('admin', '1');

// Mock getServerSession
mockServerSession(session);
```

#### Assertion Helpers

```typescript
import {
  expectError,
  expectStatus,
  expectResponseData,
} from '@/tests/helpers/test-utils';

// Expect error
await expectError(
  async () => { throw new Error('Test'); },
  'Test'
);

// Expect HTTP status
expectStatus(response, 200);

// Expect response data
await expectResponseData(response, { success: true });
```

#### Random Data Generators

```typescript
import {
  randomString,
  randomEmail,
  randomNIM,
} from '@/tests/helpers/test-utils';

const email = randomEmail();       // test-abc123xy@test.com
const nim = randomNIM();           // 1234567890
const str = randomString(10);      // aBcD1234Xy
```

---

## Environment Setup

### Test Environment Variables

File: `.env.test`

```env
# Database (use separate test database!)
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/regist_sidang_test"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-change-in-production"

# Environment
NODE_ENV="test"

# Test settings
TEST_USER_PASSWORD="test123"
ENABLE_TEST_DATA=true

# Mock services
MOCK_EMAIL_SERVICE=true
MOCK_FILE_STORAGE=true
```

### Using Test Environment

```bash
# Load test environment
export NODE_ENV=test
source .env.test

# Run tests
npm test
```

---

## Usage Examples

### Example 1: Unit Test with Fixtures

```typescript
// src/components/__tests__/FileUpload.test.tsx
import { createValidPDF } from '@/tests/helpers/test-utils';

test('uploads PDF successfully', async () => {
  const file = createValidPDF();
  const onFileSelect = jest.fn();

  const { container } = render(
    <FileUploadWithPreview onFileSelect={onFileSelect} />
  );

  const input = container.querySelector('input[type="file"]');

  Object.defineProperty(input, 'files', {
    value: [file],
    writable: false,
  });

  fireEvent.change(input);

  expect(onFileSelect).toHaveBeenCalledWith(file);
});
```

### Example 2: Integration Test with Factories

```typescript
// tests/integration/approvals.test.ts
import {
  createCompleteScenario,
  clearTestData,
  disconnectPrisma,
} from '@/tests/helpers/factories';

describe('Approval API', () => {
  afterEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  test('dosen can approve request', async () => {
    // Setup test data
    const { request, dosen1, steps } = await createCompleteScenario();

    // Make API call
    const response = await request(app)
      .post('/api/approvals/action')
      .send({
        requestId: request.id,
        action: 'approve',
      })
      .set('Authorization', `Bearer ${dosen1.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Example 3: E2E Test with Seeded Data

```typescript
// e2e/complete-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete sidang workflow', async ({ page }) => {
  // Login as mahasiswa1 (from seed data)
  await page.goto('/login');
  await page.fill('[name="email"]', 'mahasiswa1@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // Navigate to request page
  await page.goto('/mahasiswa/request');

  // Select sidang type (from seed data)
  await page.click('text=Sidang Skripsi');

  // Upload files
  // ... test continues
});
```

### Example 4: Manual Testing

1. **Start with fresh data**:
   ```bash
   npm run seed
   ```

2. **Login as different roles**:
   - Admin: `admin@test.com` / `test123`
   - Dosen: `dosen1@test.com` / `test123`
   - Mahasiswa: `mahasiswa1@test.com` / `test123`

3. **Test different scenarios**:
   - Mahasiswa 1: Test pending request approval
   - Mahasiswa 2: Test request in progress
   - Mahasiswa 3: Test admin starting sidang
   - Mahasiswa 4: View rejected request
   - Mahasiswa 5: View completed sidang with revisions

---

## Best Practices

### 1. Always Clean Up After Tests

```typescript
afterEach(async () => {
  await clearTestData();
});

afterAll(async () => {
  await disconnectPrisma();
});
```

### 2. Use Factories Instead of Manual Creation

```typescript
// ❌ BAD
const user = await prisma.user.create({
  data: {
    email: 'test@test.com',
    password: await bcrypt.hash('password', 10),
    name: 'Test',
    role: 'mahasiswa',
  },
});

// ✅ GOOD
const user = await createMahasiswa();
```

### 3. Isolate Tests

```typescript
// Create test data within each test
test('test something', async () => {
  const scenario = await createCompleteScenario();
  // Use scenario data
  // Test automatically cleans up in afterEach
});
```

### 4. Use Descriptive Names

```typescript
const pendingRequest = await createRequest(
  mahasiswa.id,
  sidangType.id,
  'pending',
  step1.id
);

const rejectedRequest = await createRequest(
  mahasiswa.id,
  sidangType.id,
  'rejected',
  null
);
```

### 5. Avoid Hardcoded IDs

```typescript
// ❌ BAD
const user = await prisma.user.findUnique({ where: { id: 1 } });

// ✅ GOOD
const user = await createMahasiswa();
const request = await createRequest(user.id, sidangType.id);
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check database connection
npm run prisma studio

# Reset database
npm run prisma migrate reset

# Re-seed
npm run seed
```

### Test Data Not Found

```bash
# Clear and re-seed
npm run prisma migrate reset
npm run seed
```

### File Fixtures Missing

```bash
# Recreate fixtures directory
mkdir -p tests/fixtures/files

# Create test files
echo "test content" > tests/fixtures/files/invalid-type.txt
```

---

## Summary

This test data setup provides:

✅ **Complete Database Seeding**: 10 users, 4 sidang types, 10 workflow steps, 17 requirements, 5 sample requests
✅ **Test Fixtures**: Sample files for upload testing
✅ **Factory Functions**: Easy test data creation
✅ **Test Utilities**: Common helpers for testing
✅ **Environment Config**: Separate test environment
✅ **Documentation**: Complete usage guides

Use these tools to write comprehensive, maintainable tests for the Sidang Workflow System!

---

**Last Updated**: 2025-11-17
**Maintained By**: Testing Team
**Questions**: See TESTING_PLAN.md for complete testing documentation
