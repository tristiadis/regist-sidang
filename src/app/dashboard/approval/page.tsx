'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";

function ApprovalDashboardContent() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) fetchPendingRequests();
  }, [session]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    const res = await fetch(`/api/approvals/pending?role=${session?.user.role}`);
    setRequests(await res.json());
    setLoading(false);
  };

  const handleApprove = async (
    requestId: number,
    action: 'approve' | 'reject',
    notes?: string
  ) => {
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, notes })
      });

      if (res.ok) {
        alert(
          action === 'approve'
            ? "Request berhasil disetujui"
            : "Request berhasil ditolak"
        );
        fetchPendingRequests();
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
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Approval Dashboard</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-purple-600"></span>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center">
                  <p className="text-gray-500">Tidak ada request yang menunggu approval</p>
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
                      <p><strong>Email Mahasiswa:</strong> {req.mahasiswa.email}</p>
                      <p><strong>Tanggal Pengajuan:</strong> {new Date(req.createdAt).toLocaleDateString('id-ID')}</p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className="badge badge-warning">
                          Pending Step: {req.currentStep?.role || 'Menunggu Admin'}
                        </span>
                      </p>
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprove(req.id, 'approve')}
                      >
                        ✓ Setuju
                      </button>
                      <button
                        className="btn btn-error"
                        onClick={() => {
                          const notes = prompt('Catatan penolakan:');
                          if (notes) handleApprove(req.id, 'reject', notes);
                        }}
                      >
                        ✗ Tolak
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

export default function ApprovalDashboard() {
  return (
    <AuthGuard allowedRoles={['dosen', 'akademik']}>
      <ApprovalDashboardContent />
    </AuthGuard>
  );
}
