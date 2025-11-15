'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";

function AdminRevisiContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevisiRequests();
  }, []);

  const fetchRevisiRequests = async () => {
    setLoading(true);
    const res = await fetch("/api/requests?status=sidang_selesai");
    setRequests(await res.json());
    setLoading(false);
  };

  const markAsComplete = async (requestId: number) => {
    if (!confirm("Tandai sidang ini sebagai selesai dan disetujui?")) return;

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      });

      if (res.ok) {
        alert("Request berhasil ditandai selesai");
        fetchRevisiRequests();
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
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Masa Revisi</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-purple-600"></span>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center">
                  <p className="text-gray-500">Tidak ada request dalam masa revisi</p>
                </div>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="card bg-white shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title">
                      {req.sidangType.name} - {req.mahasiswa.name}
                    </h2>
                    <div className="space-y-1 text-sm mb-4">
                      <p><strong>Email:</strong> {req.mahasiswa.email}</p>
                      <p><strong>Tanggal Pengajuan:</strong> {new Date(req.createdAt).toLocaleDateString('id-ID')}</p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className="badge badge-warning">Menunggu Revisi</span>
                      </p>
                    </div>

                    {req.revisiNotes && req.revisiNotes.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Catatan Revisi Dosen:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {req.revisiNotes.map((note: any, i: number) => (
                            <li key={i} className="text-sm text-gray-600">
                              {note.catatan} -{" "}
                              <span className="text-purple-600">{note.dosen.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-primary bg-purple-600"
                        onClick={() => markAsComplete(req.id)}
                      >
                        Tandai Selesai
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

export default function AdminRevisi() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminRevisiContent />
    </AuthGuard>
  );
}
