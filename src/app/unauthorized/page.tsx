'use client';

import { useRouter } from "next/navigation";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="card w-96 bg-white shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-red-600">Akses Ditolak</h2>
          <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-primary bg-purple-600 hover:bg-purple-700"
              onClick={() => router.back()}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
