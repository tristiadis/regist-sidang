# Sidang Workflow System

Sistem manajemen workflow sidang untuk program studi yang dibangun dengan Next.js 14, Prisma, PostgreSQL, dan NextAuth.js.

## Fitur Utama

- 🔐 **Autentikasi Multi-Role**: Admin, Akademik, Dosen, dan Mahasiswa
- 📋 **Workflow Builder**: Admin dapat mengatur alur persetujuan sidang
- ✅ **Manajemen Persyaratan**: Akademik dapat mengelola persyaratan sidang
- 📤 **Pengajuan Sidang**: Mahasiswa dapat mengajukan sidang dengan upload dokumen
- ✓ **Sistem Approval**: Dosen dan akademik dapat menyetujui/menolak pengajuan
- 📊 **Dashboard Admin**: Monitoring dan export data ke Excel
- 🎨 **Purple Theme**: Desain UI yang menarik dengan DaisyUI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI**: TailwindCSS + DaisyUI
- **File Upload**: Native Next.js API Routes
- **Excel Export**: xlsx

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm atau yarn

## Setup Instructions

### 1. Clone dan Install Dependencies

```bash
# Clone repository (jika dari git)
git clone <repository-url>
cd regist-sidang

# Install dependencies
npm install
```

### 2. Setup Database (PostgreSQL)

#### Windows:

```bash
# Buka Command Prompt atau PowerShell
# Masuk ke PostgreSQL shell
psql -U postgres

# Di dalam psql, eksekusi:
CREATE USER sidang_user WITH PASSWORD 'sidang123';
CREATE DATABASE sidang_db OWNER sidang_user;
GRANT ALL PRIVILEGES ON DATABASE sidang_db TO sidang_user;
\q
```

#### Linux/Mac:

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Eksekusi perintah yang sama seperti di atas
```

### 3. Setup Environment Variables

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi Anda:

```env
# Database
DATABASE_URL="postgresql://sidang_user:sidang123@localhost:5432/sidang_db?schema=public"

# NextAuth (generate secret dengan: openssl rand -base64 32)
NEXTAUTH_SECRET="your-32-char-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional - untuk fitur notifikasi email)
EMAIL_SERVER="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

**Note untuk Gmail:**
- Buat App Password di Google Account Settings
- Enable 2-Factor Authentication terlebih dahulu
- Gunakan App Password, bukan password biasa

### 4. Jalankan Database Migration

```bash
# Generate Prisma Client dan jalankan migration
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed Database dengan Data Sample

```bash
npm run seed
```

Ini akan membuat user sample:
- **Admin**: admin@prodi.ac.id / admin123
- **Mahasiswa**: mahasiswa@example.com / mahasiswa123
- **Dosen**: dosen@example.com / dosen123
- **Akademik**: akademik@example.com / akademik123

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka browser dan akses: `http://localhost:3000`

## Struktur Role & Fitur

### 👨‍💼 Admin
- Dashboard overview dengan statistik
- Workflow builder (mengatur alur approval)
- Manajemen jadwal sidang
- Manajemen masa revisi
- Export data ke Excel

### 📚 Akademik
- Input dan kelola persyaratan sidang
- Approve/reject pengajuan mahasiswa (sesuai workflow)

### 👨‍🏫 Dosen
- Approve/reject pengajuan sidang mahasiswa
- Lihat detail pengajuan

### 🎓 Mahasiswa
- Ajukan sidang
- Upload dokumen persyaratan
- Track status pengajuan

## Alur Kerja Sistem

1. **Admin** mengatur workflow steps untuk setiap jenis sidang
2. **Akademik** menambahkan persyaratan yang diperlukan
3. **Mahasiswa** mengajukan sidang dan upload dokumen
4. **Dosen/Akademik** melakukan approval sesuai urutan workflow
5. **Admin** mengatur jadwal sidang dan masa revisi
6. Sistem update status otomatis sesuai approval

## API Routes

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Sidang Types
- `GET /api/sidang-types` - List semua tipe sidang

### Workflow Steps
- `GET /api/workflow-steps?sidangTypeId={id}` - Get steps by sidang type
- `POST /api/workflow-steps` - Create new workflow step
- `DELETE /api/workflow-steps/[id]` - Delete workflow step

### Requirements
- `GET /api/requirements?sidangTypeId={id}&role={role}` - Get requirements
- `POST /api/requirements` - Create new requirement
- `DELETE /api/requirements/[id]` - Delete requirement

### Requests
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new request (mahasiswa)
- `PATCH /api/requests/[id]` - Update request status

### Approvals
- `GET /api/approvals/pending?role={role}` - Get pending approvals
- `POST /api/approvals` - Approve or reject request

### Upload
- `POST /api/upload?reqId={id}&requestId={id}` - Upload file

### Stats
- `GET /api/admin/stats` - Get dashboard statistics

## Development

### Menambah Tipe Sidang Baru

1. Login sebagai admin
2. Masuk ke database dan tambah record di tabel `sidang_types`:

```sql
INSERT INTO sidang_types (name, is_active) VALUES ('Nama Sidang Baru', true);
```

Atau gunakan Prisma Studio:

```bash
npx prisma studio
```

### Prisma Studio

Untuk melihat dan edit database secara visual:

```bash
npx prisma studio
```

Akses di `http://localhost:5555`

## Build for Production

```bash
# Build aplikasi
npm run build

# Jalankan production server
npm start
```

## Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Tambahkan environment variables
4. Deploy!

**Note**: Pastikan PostgreSQL database sudah tersedia (bisa gunakan Railway, Supabase, atau Neon).

### Manual (VPS/Server)

```bash
# Install PM2
npm install -g pm2

# Build dan start dengan PM2
npm run build
pm2 start npm --name "sidang-app" -- start

# Auto-restart on reboot
pm2 startup
pm2 save
```

## Troubleshooting

### Error: Cannot connect to database

- Pastikan PostgreSQL service running
- Check DATABASE_URL di file .env
- Pastikan database sudah dibuat

### Error: Module not found

```bash
# Clear cache dan reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### Prisma Client Error

```bash
# Regenerate Prisma Client
npx prisma generate
```

## License

MIT

## Support

Untuk bantuan atau pertanyaan, silakan buat issue di repository ini.
