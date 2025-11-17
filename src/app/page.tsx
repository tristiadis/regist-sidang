import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Redirect berdasarkan role
  switch (session.user.role) {
    case "admin":
      redirect("/admin/dashboard");
    case "akademik":
      redirect("/akademik/requirements");
    case "dosen":
      redirect("/dosen/approvals");
    case "mahasiswa":
      redirect("/mahasiswa/request");
    default:
      redirect("/login");
  }
}
