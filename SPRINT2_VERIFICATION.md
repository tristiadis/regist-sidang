# Sprint 2 Verification Guide

## ✅ Sprint 2 Status: COMPLETE

All Sprint 2 features have been implemented and refined to match exact specifications.

## What's Been Built

### LANGKAH 8: Admin Workflow Builder ✅
**Files:**
- `src/app/admin/workflow/page.tsx` - Full workflow management UI
- `src/app/api/workflow-steps/route.ts` - GET & POST endpoints
- `src/app/api/workflow-steps/[id]/route.ts` - DELETE endpoint
- `src/app/api/sidang-types/route.ts` - List all sidang types

**Features:**
- Select sidang type from dropdown
- View all workflow steps in order
- Add new steps with role and description
- Delete existing steps
- Steps are automatically ordered (stepOrder)

### LANGKAH 9: Akademik Requirement Input ✅
**Files:**
- `src/app/akademik/requirements/page.tsx` - Requirements management UI
- `src/app/api/requirements/route.ts` - GET & POST endpoints
- `src/app/api/requirements/[id]/route.ts` - DELETE endpoint
- `src/app/api/requirements/all/route.ts` - Get all requirements for a type

**Features:**
- Role-based requirement creation
- Select sidang type
- Add requirement name and description
- Toggle "needs file" checkbox
- Delete requirements
- View all requirements filtered by role

### LANGKAH 10: File Upload & Integration ✅
**Files:**
- `src/app/mahasiswa/request/page.tsx` - Request submission with file upload
- `src/app/api/upload/route.ts` - File upload handler (using FormData)
- `src/app/api/requests/route.ts` - Request creation with workflow
- `public/uploads/` - Upload directory created

**Features:**
- Select sidang type
- View all requirements (from all roles)
- File upload for requirements marked "needsFile"
- Validation for required files
- Upload files to `public/uploads/{requestId}/`
- Store file metadata in `requirement_fulfillments` table
- Automatic workflow step assignment

## Verification Steps

### 1️⃣ Test Workflow Builder (Admin)

```bash
# 1. Login as admin
Email: admin@prodi.ac.id
Password: admin123

# 2. Navigate to /admin/workflow

# 3. Select "Sidang Tugas Akhir Skripsi"

# 4. Add the following workflow steps:
   - dosen_pembimbing_1 (Approval Dosen Pembimbing 1)
   - dosen_pembimbing_2 (Approval Dosen Pembimbing 2)
   - perpustakaan (Verifikasi Bebas Pustaka)
   - akademik (Verifikasi Akademik)
   - keuangan (Verifikasi Keuangan)
   - admin (Final Approval Admin)

# 5. Verify steps appear in order with step numbers
# 6. Try deleting one step and verify it's removed
# 7. Check database:
```

**Database Check:**
```bash
npx prisma studio
# Open WorkflowStep table
# Should see 6 records with stepOrder 1-6
```

### 2️⃣ Test Requirement Input (Akademik)

```bash
# 1. Login as akademik
Email: akademik@example.com
Password: akademik123

# 2. Navigate to /akademik/requirements

# 3. Select "Sidang Tugas Akhir Skripsi"

# 4. Add the following requirements:
   - Name: "Bukti Pembayaran UKT"
     Description: "Upload bukti pembayaran UKT semester terakhir"
     Needs File: ✅ YES

   - Name: "Kartu Rencana Studi (KRS)"
     Description: "KRS yang sudah disetujui PA"
     Needs File: ✅ YES

   - Name: "Transkrip Nilai Sementara"
     Description: "Transkrip nilai terbaru"
     Needs File: ❌ NO

# 5. Verify requirements appear in the list
# 6. Try deleting one and verify it's removed
```

**Create Additional Test Users (for testing different roles):**

Add this to `prisma/seed.ts` and run `npm run seed`:

```typescript
// Add perpustakaan user
const perpustakaanPass = await bcrypt.hash("perpustakaan123", 10);
await prisma.user.upsert({
  where: { email: "perpustakaan@example.com" },
  update: {},
  create: {
    email: "perpustakaan@example.com",
    password: perpustakaanPass,
    name: "Petugas Perpustakaan",
    role: "perpustakaan"
  }
});
```

Then login as `perpustakaan@example.com` and add:
```
- Bebas Pustaka (wajib file)
- Surat Keterangan Tidak Ada Pinjaman Buku (tanpa file)
```

### 3️⃣ Test Mahasiswa Request with File Upload

```bash
# 1. Login as mahasiswa
Email: mahasiswa@example.com
Password: mahasiswa123

# 2. Navigate to /mahasiswa/request

# 3. Select "Sidang Tugas Akhir Skripsi"

# 4. You should see ALL requirements from ALL roles:
   - Bukti Pembayaran UKT (akademik) - FILE REQUIRED
   - KRS (akademik) - FILE REQUIRED
   - Transkrip Nilai (akademik) - NO FILE
   - Bebas Pustaka (perpustakaan) - FILE REQUIRED
   - Surat Keterangan (perpustakaan) - NO FILE

# 5. Upload test files for all required ones:
   - Create dummy PDFs or images
   - Select files for each requirement

# 6. Click "🚀 Submit Pengajuan"

# 7. Should see: "✅ Pengajuan berhasil! Menunggu approval dosen pembimbing."
```

**Verify Upload Success:**

1. Check database:
```bash
npx prisma studio
# Open Request table - should have new record
# Note the request ID (e.g., 1)

# Open RequirementFulfillment table
# Should see records for each uploaded file
# fileUrl should be like: /uploads/1/7_a3f2b9c4d5e6f7a8.pdf
```

2. Check file system:
```bash
ls -la public/uploads/1/
# Should see uploaded files with format:
# {requirementId}_{randomhex}.{ext}
```

3. Test file access:
```bash
# In browser, visit:
http://localhost:3000/uploads/1/7_a3f2b9c4d5e6f7a8.pdf
# Should download/show the file
```

### 4️⃣ Test Validation

```bash
# 1. Login as mahasiswa
# 2. Go to /mahasiswa/request
# 3. Select a sidang type
# 4. DON'T upload required files
# 5. Click submit
# 6. Should see alert: "File untuk persyaratan "[name]" wajib diupload"
```

### 5️⃣ Test Workflow Integration

```bash
# After submitting a request, check database:
npx prisma studio

# Open Request table, find your request
# Fields should be:
# - mahasiswaId: Your user ID
# - sidangTypeId: Selected type
# - currentStepId: ID of FIRST workflow step (dosen_pembimbing_1)
# - status: "pending"
```

## Common Issues & Solutions

### Issue: "File tidak ditemukan" error
**Solution:** Make sure you're actually selecting a file in the file input.

### Issue: Files not appearing in public/uploads/
**Solution:**
```bash
# Ensure directory exists and has write permissions
mkdir -p public/uploads
chmod 755 public/uploads
```

### Issue: Database shows NULL for currentStepId
**Solution:** Make sure you've created workflow steps for that sidang type in the Workflow Builder.

### Issue: Requirements not showing up
**Solution:**
- Ensure you selected the correct sidang type
- Check that requirements were created with the same sidangTypeId
- Try refreshing the page

## Next Steps: Sprint 3

Sprint 3 will implement:
- Approval Dashboard for Dosen/Akademik
- Status tracking for mahasiswa
- Admin Sidang D-Day management
- Revision notes system
- Excel export functionality

All foundational pieces are now in place! 🎉
