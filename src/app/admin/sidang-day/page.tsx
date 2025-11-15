'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";

function AdminSidangDayContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitingAdminRequests();
  }, []);

  const fetchWaitingAdminRequests = async () => {
    setLoading(true);
    const res = await fetch("/api/requests?status=waiting_admin");
    setRequests(await res.json());
    setLoading(false);
  };

  const updateStatus = async (requestId: number, status: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        alert("Status berhasil diupdate");
        fetchWaitingAdminRequests();
      } else {
        alert("Terjadi kesalahan");
      }
    } catch (error) {
      alert("Terjadi kesalahan");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Jadwal Sidang</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-purple-600"></span>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center">
                  <p className="text-gray-500">Tidak ada request yang menunggu jadwal sidang</p>
                </div>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="card bg-white shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title">
                      {req.sidangType.name} - {req.mahasiswa.name}
                    </h2>
                    <div className="space-y-1 text-sm">
                      <p><strong>Email:</strong> {req.mahasiswa.email}</p>
                      <p><strong>Tanggal Pengajuan:</strong> {new Date(req.createdAt).toLocaleDateString('id-ID')}</p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className="badge badge-info">Menunggu Jadwal</span>
                      </p>
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-success"
                        onClick={() => updateStatus(req.id, 'sidang_berlangsung')}
                      >
                        Sidang Dimulai
                      </button>
                      <button
                        className="btn btn-primary bg-purple-600"
                        onClick={() => updateStatus(req.id, 'sidang_selesai')}
                      >
                        Sidang Selesai
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSidangDay() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminSidangDayContent />
    </AuthGuard>
  );
}
