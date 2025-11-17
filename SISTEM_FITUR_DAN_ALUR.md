# Sistem Sidang Workflow - Fitur & Alur Lengkap

## Daftar Isi
1. [Overview Sistem](#overview-sistem)
2. [User Roles & Access](#user-roles--access)
3. [Fitur per Role](#fitur-per-role)
4. [Alur Workflow Sidang](#alur-workflow-sidang)
5. [CRUD Operations](#crud-operations)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)

---

## Overview Sistem

**Sistem Sidang Workflow** adalah aplikasi manajemen proses sidang (thesis defense) untuk program studi yang mendukung:
- Multiple jenis sidang (Proposal, Seminar Hasil, Sidang Akhir, dll)
- Dynamic workflow approval (bisa disesuaikan per jenis sidang)
- Multi-role access (Admin, Akademik, Dosen, Mahasiswa)
- File upload & management
- Real-time status tracking
- Revision notes during sidang

---

## User Roles & Access

### 1. Admin (Program Studi)
**Access Level**: Full Control
- Mengelola seluruh sistem
- Konfigurasi workflow
- Manajemen sidang D-Day
- Laporan & export Excel
- Soft-delete requests

### 2. Akademik
**Access Level**: Requirement Management + Approval
- Input & manage requirements (syarat administratif)
- Approve/reject mahasiswa requests
- View reports

### 3. Dosen
**Access Level**: Approval + Revision
- Approve/reject mahasiswa requests
- Input revision notes during sidang
- Attach files to revision notes
- View approval history

### 4. Mahasiswa
**Access Level**: Submit + Track
- Submit sidang requests
- Upload required documents
- Track request status real-time
- View approval timeline
- Access revision notes
- Download documents

---

## Fitur per Role

### 👨‍💼 Admin Features

#### 1. Workflow Builder (`/admin/workflow`)
**Purpose**: Konfigurasi approval steps untuk setiap jenis sidang

**CRUD Operations**:
- **Create**: Tambah workflow step baru
  - Input: Jenis Sidang, Role (dosen_pembimbing_1, akademik, dll), Description
  - Auto-increment stepOrder

- **Read**: Lihat semua workflow steps per jenis sidang
  - Sorted by stepOrder (urutan approval)

- **Delete**: Hapus workflow step
  - Confirmation dialog

**Alur**:
1. Admin pilih jenis sidang
2. Sistem show existing workflow steps
3. Admin tambah/hapus steps sesuai kebutuhan
4. Steps ditampilkan dengan badge order (Step 1, Step 2, dst)

**Use Case**:
```
Sidang Proposal:
- Step 1: dosen_pembimbing_1
- Step 2: dosen_pembimbing_2
- Step 3: akademik
```

#### 2. Admin Dashboard (`/admin/dashboard`)
**Purpose**: Monitoring & reporting semua requests

**Features**:
- **Search**: Real-time search (nama, email, NIM)
- **Filter**:
  - Status (pending, waiting_admin, sidang_berlangsung, dll)
  - Tanggal pengajuan
- **Pagination**: 10 items per page
- **Statistics**: Total, Berlangsung, Selesai, Ditolak
- **Export Excel**: Download laporan dengan formatting
- **Soft Delete**: Hapus request dengan confirmation
- **Keyboard Shortcuts**:
  - Ctrl+K: Search
  - Ctrl+←/→: Navigate pages
  - Ctrl+R: Refresh

**Data Displayed**:
- No, Mahasiswa, Email, Jenis Sidang, Status, Tanggal (relative), Step saat ini

#### 3. Sidang D-Day Management (`/admin/sidang-day`)
**Purpose**: Kelola sidang yang sedang/akan berlangsung

**Sections**:

**A. Waiting Admin (Status: waiting_admin)**
- Request yang sudah approve semua step
- Siap dijadwalkan sidang
- Action: Start Sidang → ubah status ke "sidang_berlangsung"

**B. Sidang Berlangsung (Status: sidang_berlangsung)**
- Sidang yang sedang live
- Dosen bisa input revision notes
- Display semua revision notes
- Action: Mark as Complete → ubah status ke "sidang_selesai"

**Status Flow**:
```
waiting_admin → sidang_berlangsung → sidang_selesai
```

#### 4. Requirements Management (`/admin/requirements`)
**Purpose**: Sama seperti Akademik (shared access)

---

### 📋 Akademik Features

#### 1. Requirements Input (`/akademik/requirements`)
**Purpose**: Manage persyaratan administratif untuk setiap jenis sidang

**CRUD Operations**:
- **Create**: Tambah persyaratan baru
  - Input: Jenis Sidang, Nama persyaratan, Deskripsi (optional), Needs File (checkbox)
  - Role: Auto-set ke "akademik"

- **Read**: Lihat semua requirements per jenis sidang
  - Filtered by: sidangTypeId + role=akademik

- **Delete**: Hapus persyaratan
  - Confirmation dialog

**Fields**:
- `name`: Nama persyaratan (e.g., "Bukti Pembayaran UKT")
- `description`: Penjelasan detail (optional)
- `needsFile`: Boolean - apakah wajib upload file?

**Display**:
- Badge: "Wajib file" atau "Tanpa file"
- Color-coded card per requirement

#### 2. Approval Dashboard (`/akademik/approvals`)
**Purpose**: Sama seperti Dosen Approvals

---

### 👨‍🏫 Dosen Features

#### 1. Approval Dashboard (`/dosen/approvals`)
**Purpose**: Approve/Reject mahasiswa requests di step mereka

**Sections**:

**A. Pending Approvals**
- Requests yang currentStep.role === dosen's role
- Display:
  - Jenis Sidang
  - Mahasiswa (nama, email)
  - Tanggal pengajuan
  - Syarat yang sudah dipenuhi (dengan link file)

- Actions:
  - **Approve**: Move ke next step atau waiting_admin
  - **Reject**: Set status ke "rejected" + input catatan

**B. Sidang Berlangsung**
- Requests dengan status "sidang_berlangsung"
- Display sama seperti Pending
- Action:
  - **Input Revisi**: Modal untuk input revision notes + upload file

**Approval Logic**:
```javascript
if (action === 'approve') {
  // Find next step
  const nextStep = WorkflowStep.findFirst({
    sidangTypeId: request.sidangTypeId,
    stepOrder: currentStep.stepOrder + 1
  });

  if (nextStep) {
    // Move to next step
    request.currentStepId = nextStep.id;
  } else {
    // All approvals complete
    request.status = "waiting_admin";
    request.currentStepId = null;
  }
} else {
  // Reject
  request.status = "rejected";
}

// Create approval record
Approval.create({
  requestId,
  approverId: dosen.id,
  action,
  notes
});
```

#### 2. Revision Input Modal
**Purpose**: Input catatan revisi saat sidang berlangsung

**Fields**:
- `catatan`: Text area (required)
- `file`: File upload (optional)

**File Storage**:
```
public/uploads/revisi/{requestId}/{fileName}
```

**Process**:
1. Dosen klik "Input Revisi"
2. Modal muncul
3. Isi catatan + upload file (optional)
4. Submit → save to RevisiNote table
5. Auto-refresh list

---

### 👨‍🎓 Mahasiswa Features

#### 1. Ajukan Sidang (`/mahasiswa/request`)
**Purpose**: Submit pengajuan sidang dengan upload dokumen

**Alur Submit**:

**Step 1: Pilih Jenis Sidang**
- Dropdown semua active sidang types
- OnChange: Fetch requirements

**Step 2: Upload Dokumen per Requirement**
- Display semua requirements (akademik + dosen + dll)
- Untuk requirement dengan needsFile=true:
  - Show FileUploadWithPreview component
  - Drag & drop support
  - Preview untuk images
  - Validation: max 10MB, allowed types (.pdf, .doc, .jpg, dll)

**Step 3: Submit**
- Validate: Semua required files uploaded
- Process:
  1. Create Request
     - mahasiswaId: current user
     - sidangTypeId: selected
     - status: "pending"
     - currentStepId: first workflow step

  2. Upload Files & Create Fulfillments
     - For each requirement with file:
       - Upload to `/uploads/{requestId}/{fileName}`
       - Create RequirementFulfillment record

  3. Success → Toast notification + redirect

**Validation Rules**:
- File size: Max 10MB
- File types: .pdf, .doc, .docx, .jpg, .jpeg, .png, .zip
- All required files must be uploaded

#### 2. Status Tracking (`/mahasiswa/tracker`)
**Purpose**: Track semua pengajuan sidang secara real-time

**Display per Request**:

**Header**:
- Jenis Sidang (title)
- Status badge (color-coded)
- Tanggal pengajuan (relative: "2 jam yang lalu")

**Progress Bar**:
- 0-100% based on status
- Hidden if status = "rejected"

**Status Alerts** (Context-aware):
- **Pending**: "Menunggu approval dari: {currentStep.role}"
- **Waiting Admin**: "Semua approval selesai! Menunggu admin jadwalkan sidang"
- **Sidang Berlangsung**: "🔴 LIVE: Sidang Anda sedang berlangsung!"
- **Rejected**: "Pengajuan ditolak. Cek catatan penolakan"
- **Done**: "Selamat! Sidang Anda telah selesai"

**Timeline Approval**:
- Vertical timeline dengan dots
- Setiap approval record:
  - ✅ Disetujui / ❌ Ditolak
  - Approver name + role
  - Tanggal (id-ID format)
  - Notes (if any)

**Revision Notes Section**:
- Yellow card per revision
- Catatan text
- Dosen name + tanggal
- Link to file (if any)

**Documents Section**:
- Grid 2 columns (mobile: 1)
- Setiap fulfillment:
  - Requirement name
  - "Lihat" button to file
  - Badge "No File" if no upload

**Empty State**:
- Icon: 📋
- Title: "Belum ada pengajuan sidang"
- CTA: Button ke /mahasiswa/request

---

## Alur Workflow Sidang

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ MAHASISWA: Submit Request                                    │
│ - Pilih jenis sidang                                        │
│ - Upload dokumen persyaratan                                │
│ - Submit                                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ SISTEM: Create Request                                       │
│ - status: "pending"                                         │
│ - currentStepId: First workflow step                       │
│ - Create RequirementFulfillments                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ APPROVAL LOOP (Sequential per Workflow Steps)               │
│                                                             │
│ ┌────────────────────────────────────────────────┐        │
│ │ Step 1: dosen_pembimbing_1                     │        │
│ │ - Dosen lihat di /dosen/approvals              │        │
│ │ - Review dokumen                               │        │
│ │ - Approve or Reject                            │        │
│ └───────────┬────────────────────────────────────┘        │
│             │ Approve                                      │
│             ▼                                              │
│ ┌────────────────────────────────────────────────┐        │
│ │ Step 2: dosen_pembimbing_2                     │        │
│ │ - Process sama seperti Step 1                  │        │
│ └───────────┬────────────────────────────────────┘        │
│             │ Approve                                      │
│             ▼                                              │
│ ┌────────────────────────────────────────────────┐        │
│ │ Step 3: akademik                               │        │
│ │ - Akademik approve                             │        │
│ └───────────┬────────────────────────────────────┘        │
│             │ Last step approve                            │
│             ▼                                              │
└─────────────┼───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ SISTEM: All Approvals Complete                              │
│ - status: "waiting_admin"                                  │
│ - currentStepId: null                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ADMIN: Sidang D-Day Management                              │
│ - View di /admin/sidang-day                                │
│ - Klik "Sidang Berlangsung"                                │
│ - status: "sidang_berlangsung"                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ DOSEN: Input Revision Notes (During Sidang)                 │
│ - Lihat di section "Sidang Berlangsung"                   │
│ - Klik "Input Revisi"                                     │
│ - Isi catatan + upload file (optional)                    │
│ - Can input multiple revisions                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ADMIN: Complete Sidang                                       │
│ - Klik "Sidang Selesai"                                    │
│ - status: "sidang_selesai"                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ MAHASISWA: Access Revision Notes                            │
│ - View di /mahasiswa/tracker                               │
│ - Download revision files                                  │
│ - Complete revisions                                       │
└─────────────────────────────────────────────────────────────┘
```

### Status State Machine

```
pending
  │
  ├─ Approve all steps ─→ waiting_admin
  │                          │
  │                          ├─ Start sidang ─→ sidang_berlangsung
  │                          │                     │
  │                          │                     └─ Complete ─→ sidang_selesai
  │
  └─ Reject (any step) ──→ rejected
```

### Rejection Flow

```
┌─────────────────────────────────────────────────────────────┐
│ DOSEN/AKADEMIK: Reject Request                              │
│ - Klik "Tolak"                                              │
│ - Input catatan penolakan (prompt)                         │
│ - Submit                                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ SISTEM: Update Request                                       │
│ - status: "rejected"                                        │
│ - Create Approval record with action="reject"              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ MAHASISWA: See Rejection                                     │
│ - View di tracker                                           │
│ - See rejection notes                                       │
│ - Can submit new request                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## CRUD Operations

### 1. SidangType (Jenis Sidang)

**Model**:
```prisma
model SidangType {
  id        Int      @id @default(autoincrement())
  name      String   // "Sidang Proposal", "Seminar Hasil", dll
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Operations**:
- **Create**: Seed data (admin can add via DB)
- **Read**:
  - GET `/api/sidang-types` - All types
  - GET `/api/sidang-types?active=true` - Only active
- **Update**: Via DB (isActive toggle)
- **Delete**: Soft delete (isActive = false)

**Seed Data**:
```
1. Sidang Proposal
2. Seminar Hasil
3. Sidang Akhir/Komprehensif
4. Sidang Skripsi/Tesis
5. Ujian Tutup
```

---

### 2. WorkflowStep

**Model**:
```prisma
model WorkflowStep {
  id           Int      @id @default(autoincrement())
  sidangTypeId Int
  stepOrder    Int      // 1, 2, 3, ...
  role         String   // "dosen_pembimbing_1", "akademik", dll
  description  String?

  @@unique([sidangTypeId, stepOrder])
}
```

**CRUD**:

**Create** (Admin):
```
POST /api/workflow-steps
Body: {
  sidangTypeId: 1,
  role: "dosen_pembimbing_1",
  description: "Approval dari dosen pembimbing pertama"
}

Logic:
- Auto-increment stepOrder (get max + 1)
- Unique constraint: (sidangTypeId, stepOrder)
```

**Read**:
```
GET /api/workflow-steps?sidangTypeId=1
Response: [
  { id: 1, stepOrder: 1, role: "dosen_pembimbing_1", ... },
  { id: 2, stepOrder: 2, role: "akademik", ... }
]
Sorted by: stepOrder ASC
```

**Delete**:
```
DELETE /api/workflow-steps/{id}
- Hard delete (permanent)
- Should reorder remaining steps? (Current: No)
```

---

### 3. Requirement

**Model**:
```prisma
model Requirement {
  id           Int      @id @default(autoincrement())
  role         String   // "akademik", "dosen", dll
  sidangTypeId Int
  name         String   // "Bukti Pembayaran UKT"
  description  String?
  needsFile    Boolean  @default(false)
  createdAt    DateTime @default(now())
}
```

**CRUD**:

**Create** (Akademik/Admin):
```
POST /api/requirements
Body: {
  role: "akademik",
  sidangTypeId: 1,
  name: "Bukti Pembayaran UKT",
  description: "Bukti lunas UKT semester ini",
  needsFile: true
}
```

**Read**:
```
# By role and sidang type
GET /api/requirements?sidangTypeId=1&role=akademik

# All requirements for a sidang type
GET /api/requirements/all?sidangTypeId=1
```

**Delete**:
```
DELETE /api/requirements/{id}
- Hard delete
- Should check if used in fulfillments? (Current: No)
```

---

### 4. Request (Pengajuan Sidang)

**Model**:
```prisma
model Request {
  id            Int      @id @default(autoincrement())
  mahasiswaId   Int
  sidangTypeId  Int
  status        String   @default("pending")
  currentStepId Int?     // null when waiting_admin or done
  deletedAt     DateTime? // soft delete
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  mahasiswa     User     @relation("MahasiswaRequests")
  sidangType    SidangType
  currentStep   WorkflowStep?
  fulfillments  RequirementFulfillment[]
  approvals     Approval[]
  revisiNotes   RevisiNote[]
}
```

**CRUD**:

**Create** (Mahasiswa):
```
POST /api/requests
Body: {
  sidangTypeId: 1
}

Logic:
1. Get first workflow step for sidang type
2. Create request with:
   - mahasiswaId: session.user.id
   - status: "pending"
   - currentStepId: firstStep.id
3. Return request (for file uploads)
```

**Read**:
```
# All requests (Admin)
GET /api/requests?all=true

# By status
GET /api/requests?status=waiting_admin

# Pending for specific role
GET /api/approvals/pending-dashboard?role=dosen

# Mahasiswa's own requests
GET /api/requests/my-requests
- Filter by: mahasiswaId = session.user.id
- Include: approvals, revisions, fulfillments, sidangType, currentStep
```

**Update**:
```
# Update status
PATCH /api/requests/{id}/status
Body: { status: "sidang_berlangsung" }

# Approve/Reject (moves workflow)
POST /api/approvals/action
Body: {
  requestId: 1,
  action: "approve",
  notes: "Approved"
}

Logic:
if (action === 'approve') {
  const nextStep = await findNextStep(currentStep.stepOrder + 1);
  if (nextStep) {
    request.currentStepId = nextStep.id;
  } else {
    request.status = "waiting_admin";
    request.currentStepId = null;
  }
} else {
  request.status = "rejected";
}
```

**Delete**:
```
DELETE /api/requests/{id}
- Soft delete: set deletedAt = now()
- Not permanently removed
```

---

### 5. RequirementFulfillment

**Model**:
```prisma
model RequirementFulfillment {
  id            Int      @id @default(autoincrement())
  requestId     Int
  requirementId Int
  isConfirmed   Boolean  @default(false)
  fileUrl       String?  // "/uploads/{requestId}/{fileName}"
  createdAt     DateTime @default(now())

  request       Request
  requirement   Requirement

  @@unique([requestId, requirementId])
}
```

**CRUD**:

**Create** (via Upload):
```
POST /api/upload
FormData: {
  file: File,
  requestId: "1",
  requirementId: "5"
}

Process:
1. Validate file (size, type)
2. Generate safe filename
3. Save to: public/uploads/{requestId}/{fileName}
4. Create fulfillment:
   - requestId, requirementId
   - isConfirmed: true
   - fileUrl: "/uploads/{requestId}/{fileName}"
```

**Read**:
```
# Included in Request queries via relation
request.fulfillments.forEach(f => {
  console.log(f.requirement.name, f.fileUrl);
});
```

**Delete**:
- No direct delete endpoint
- Deleted when request is deleted (cascade)

---

### 6. Approval

**Model**:
```prisma
model Approval {
  id         Int      @id @default(autoincrement())
  requestId  Int
  approverId Int      // dosen or akademik user
  action     String   // "approve" or "reject"
  notes      String?
  createdAt  DateTime @default(now())

  request    Request
  approver   User     @relation("UserApprovals")
}
```

**CRUD**:

**Create** (Dosen/Akademik):
```
POST /api/approvals/action
Body: {
  requestId: 1,
  action: "approve",
  notes: "Looks good"
}

Logic:
1. Create approval record
2. Update request status/currentStep
3. Return success
```

**Read**:
```
# Included in Request queries
request.approvals.forEach(a => {
  console.log(a.approver.name, a.action, a.createdAt);
});
```

**Delete**:
- No delete (audit trail)

---

### 7. RevisiNote

**Model**:
```prisma
model RevisiNote {
  id        Int      @id @default(autoincrement())
  requestId Int
  dosenId   Int
  catatan   String   @db.Text
  fileUrl   String?  // "/uploads/revisi/{requestId}/{fileName}"
  createdAt DateTime @default(now())

  request   Request
  dosen     User     @relation("DosenRevisions")
}
```

**CRUD**:

**Create** (Dosen during sidang):
```
POST /api/revisi
FormData: {
  requestId: "1",
  catatan: "Perbaiki bab 3",
  file: File (optional)
}

Logic:
1. Validate: only dosen can create
2. Validate: catatan is required
3. If file: save to public/uploads/revisi/{requestId}/
4. Create RevisiNote:
   - requestId, dosenId: session.user.id
   - catatan, fileUrl
```

**Read**:
```
# Included in Request queries
request.revisiNotes.forEach(r => {
  console.log(r.dosen.name, r.catatan, r.fileUrl);
});
```

**Delete**:
- No delete endpoint (permanent record)

---

### 8. User

**Model**:
```prisma
model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  password String   // bcrypt hashed
  name     String
  role     String   // "admin", "akademik", "dosen", "mahasiswa"
  nim      String?  // for mahasiswa only

  // Relations
  requests       Request[]  @relation("MahasiswaRequests")
  approvals      Approval[] @relation("UserApprovals")
  revisiNotes    RevisiNote[] @relation("DosenRevisions")
}
```

**CRUD**:

**Create** (Seed only):
```typescript
await bcrypt.hash("password", 10);
await prisma.user.create({
  email: "admin@prodi.ac.id",
  password: hashedPassword,
  name: "Admin Prodi",
  role: "admin"
});
```

**Read** (Auth):
```
POST /api/auth/signin
Body: { email, password }

Logic:
1. Find user by email
2. Compare password with bcrypt
3. Create JWT session with user id, role
4. Return session
```

**Update**:
- No update endpoint currently
- Can be added for profile management

**Delete**:
- No delete (users are permanent)

---

## Database Schema

### ER Diagram

```
┌──────────────┐
│     User     │
├──────────────┤
│ id (PK)      │
│ email        │◄──────────┐
│ password     │           │
│ name         │           │
│ role         │           │
│ nim          │           │
└──────┬───────┘           │
       │                   │
       │ mahasiswaId       │
       │                   │
       │                   │ dosenId
       ▼                   │
┌──────────────┐           │
│   Request    │           │
├──────────────┤           │
│ id (PK)      │           │
│ mahasiswaId  │           │
│ sidangTypeId │───┐       │
│ status       │   │       │
│ currentStepId│───│──┐    │
│ deletedAt    │   │  │    │
│ createdAt    │   │  │    │
└──┬───────────┘   │  │    │
   │               │  │    │
   │ requestId     │  │    │
   │               │  │    │
   ├───────────────┼──┼────┼──────┐
   │               │  │    │      │
   ▼               │  │    │      ▼
┌──────────────────┐ │  │    │ ┌──────────────┐
│ Fulfillment      │ │  │    │ │  Approval    │
├──────────────────┤ │  │    │ ├──────────────┤
│ id (PK)          │ │  │    │ │ id (PK)      │
│ requestId        │ │  │    │ │ requestId    │
│ requirementId ───┼─│──│────┼─┤ approverId   │───┘
│ isConfirmed      │ │  │    │ │ action       │
│ fileUrl          │ │  │    │ │ notes        │
└──────────────────┘ │  │    │ │ createdAt    │
                     │  │    │ └──────────────┘
                     │  │    │
                     │  │    │
                     ▼  │    ▼
              ┌──────────────┐
              │ SidangType   │
              ├──────────────┤
              │ id (PK)      │
              │ name         │
              │ isActive     │
              └──────┬───────┘
                     │
                     │ sidangTypeId
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ WorkflowStep │ │ Requirement  │ │ RevisiNote   │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ id (PK)      │ │ id (PK)      │ │ id (PK)      │
│ sidangTypeId │ │ role         │ │ requestId    │
│ stepOrder    │ │ sidangTypeId │ │ dosenId      │
│ role         │ │ name         │ │ catatan      │
│ description  │ │ description  │ │ fileUrl      │
└──────────────┘ │ needsFile    │ │ createdAt    │
                 └──────────────┘ └──────────────┘
```

### Relasi Tabel

**One-to-Many**:
- User (mahasiswa) → Request
- User (dosen) → Approval
- User (dosen) → RevisiNote
- SidangType → Request
- SidangType → WorkflowStep
- SidangType → Requirement
- Request → RequirementFulfillment
- Request → Approval
- Request → RevisiNote
- Requirement → RequirementFulfillment

**Many-to-One**:
- Request → WorkflowStep (currentStep)

**Unique Constraints**:
- User.email
- WorkflowStep (sidangTypeId, stepOrder)
- RequirementFulfillment (requestId, requirementId)

---

## API Endpoints

### Authentication

```
POST /api/auth/[...nextauth]
- Login via credentials
- Returns session with user id, role
```

### Sidang Types

```
GET /api/sidang-types
- Get all sidang types
- Query: ?active=true (filter active only)
```

### Workflow Steps

```
GET /api/workflow-steps?sidangTypeId={id}
- Get workflow steps for sidang type
- Sorted by stepOrder

POST /api/workflow-steps
- Create new workflow step
- Body: { sidangTypeId, role, description }
- Auto-increment stepOrder

DELETE /api/workflow-steps/{id}
- Delete workflow step
```

### Requirements

```
GET /api/requirements?sidangTypeId={id}&role={role}
- Get requirements filtered

GET /api/requirements/all?sidangTypeId={id}
- Get all requirements for sidang type

POST /api/requirements
- Create requirement
- Body: { role, sidangTypeId, name, description, needsFile }

DELETE /api/requirements/{id}
- Delete requirement
```

### Requests

```
GET /api/requests?all=true
- Admin: Get all requests

GET /api/requests?status={status}
- Get requests by status

GET /api/requests/my-requests
- Mahasiswa: Get own requests

POST /api/requests
- Create new request
- Body: { sidangTypeId }

PATCH /api/requests/{id}/status
- Update request status
- Body: { status }

DELETE /api/requests/{id}
- Soft delete request
```

### Approvals

```
GET /api/approvals/pending-dashboard?role={role}
- Get pending requests for role

POST /api/approvals/action
- Approve or reject request
- Body: { requestId, action, notes }
- Handles workflow progression
```

### File Upload

```
POST /api/upload
- Upload requirement file
- FormData: { file, requestId, requirementId }
- Returns: { success, path, message }
- Validations: size (10MB), type, etc.
```

### Revision Notes

```
POST /api/revisi
- Create revision note
- FormData: { requestId, catatan, file (optional) }
- Only dosen can create
- Saves file to /uploads/revisi/{requestId}/
```

---

## File Storage Structure

```
public/
  uploads/
    {requestId}/           # Requirement files
      {requirementId}_{hash}.pdf
      {requirementId}_{hash}.jpg
      ...

    revisi/               # Revision files
      {requestId}/
        revisi_{hash}.pdf
        revisi_{hash}.docx
        ...
```

**File Naming**:
- Requirement: `{requirementId}_{randomHash}{ext}`
- Revision: `revisi_{randomHash}{ext}`
- Hash: 16 characters (randomBytes(8).toString('hex'))

**Security**:
- Max size: 10MB
- Allowed types: .pdf, .doc, .docx, .jpg, .jpeg, .png, .zip
- Server-side validation
- Client-side preview & validation

---

## Summary Fitur Utama

### ✅ Dynamic Workflow System
- Admin dapat konfigurasi approval steps per jenis sidang
- Sequential approval dengan auto-progression
- Flexible roles (dosen_pembimbing_1, dosen_pembimbing_2, akademik, dll)

### ✅ Complete Request Management
- Mahasiswa submit dengan upload dokumen
- Real-time status tracking dengan timeline
- Approval/rejection workflow
- Revision notes during sidang

### ✅ Role-Based Access Control
- 4 roles: Admin, Akademik, Dosen, Mahasiswa
- Route protection dengan AuthGuard
- API authorization per endpoint

### ✅ Professional UX
- Toast notifications
- Loading states
- Empty states
- Keyboard shortcuts
- Mobile-responsive
- Search & pagination
- Relative dates

### ✅ File Management
- Drag & drop upload
- Preview untuk images
- Multiple file types support
- Size & type validation
- Secure storage

### ✅ Reporting & Export
- Admin dashboard dengan filtering
- Excel export dengan formatting
- Statistics cards
- Soft delete dengan audit trail

---

**Total Features**: 20+
**Total CRUD Operations**: 25+
**Total API Endpoints**: 15+
**Database Tables**: 8
**User Roles**: 4

**Status**: ✅ Production Ready
