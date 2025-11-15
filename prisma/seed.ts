import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create Admin
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@prodi.ac.id" },
    update: {},
    create: {
      email: "admin@prodi.ac.id",
      password: adminPass,
      name: "Admin Prodi",
      role: "admin"
    }
  });
  console.log("✅ Admin user created:", admin.email);

  // Create Mahasiswa Sample
  const mhsPass = await bcrypt.hash("mahasiswa123", 10);
  const mahasiswa = await prisma.user.upsert({
    where: { email: "mahasiswa@example.com" },
    update: {},
    create: {
      email: "mahasiswa@example.com",
      password: mhsPass,
      name: "Budi Santoso",
      role: "mahasiswa"
    }
  });
  console.log("✅ Mahasiswa user created:", mahasiswa.email);

  // Create Dosen Sample
  const dosenPass = await bcrypt.hash("dosen123", 10);
  const dosen = await prisma.user.upsert({
    where: { email: "dosen@example.com" },
    update: {},
    create: {
      email: "dosen@example.com",
      password: dosenPass,
      name: "Dr. Ahmad Fauzi",
      role: "dosen"
    }
  });
  console.log("✅ Dosen user created:", dosen.email);

  // Create Akademik Sample
  const akademikPass = await bcrypt.hash("akademik123", 10);
  const akademik = await prisma.user.upsert({
    where: { email: "akademik@example.com" },
    update: {},
    create: {
      email: "akademik@example.com",
      password: akademikPass,
      name: "Siti Nurhaliza",
      role: "akademik"
    }
  });
  console.log("✅ Akademik user created:", akademik.email);

  // Create Sidang Types
  const sidangTypes = [
    "Sidang Tugas Akhir Skripsi",
    "Seminar Usulan Penelitian",
    "Sidang Job Training",
    "Sidang Tugas Akhir Jurnal",
    "Daftar Wisuda"
  ];

  for (const name of sidangTypes) {
    const sidangType = await prisma.sidangType.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    console.log("✅ Sidang type created:", sidangType.name);
  }

  console.log("✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
