'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import RevisiInputModal from "@/components/RevisiInputModal";
import { showSuccess, showError } from "@/lib/toast";

function DosenApprovalContent() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [sidangRequests, setSidangRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showRevisiModal, setShowRevisiModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (session) {
      fetchPendingRequests();
      fetchSidangBerlangsung();
    }
  }, [session]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    const res = await fetch(`/api/approvals/pending-dashboard?role=${session?.user.role}`);
    setRequests(await res.json());
    setLoading(false);
  };

  const fetchSidangBerlangsung = async () => {
    const res = await fetch("/api/requests?status=sidang_berlangsung");
    setSidangRequests(await res.json());
  };

  const handleApprove = async (requestId: number, action: 'approve' | 'reject') => {
    const notes = action === 'reject' ? prompt('Catatan penolakan:') : '';

    if (action === 'reject' && !notes) {
      showError('Catatan penolakan harus diisi');
      return;
    }

    setProcessingId(requestId);

    const res = await fetch("/api/approvals/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, notes })
    });

    if (res.ok) {
      showSuccess(`Berhasil ${action === 'approve' ? 'menyetujui' : 'menolak'} permintaan`);
      fetchPendingRequests();
    } else {
      showError('Gagal memproses permintaan');
    }

    setProcessingId(null);
  };

  const handleInputRevisi = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowRevisiModal(true);
  };

  const handleCloseModal = () => {
    setShowRevisiModal(false);
    setSelectedRequestId(null);
    fetchSidangBerlangsung();
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">
          Approval Dashboard - {session?.user.role}
        </h1>

        {/* Pending Approvals */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Menunggu Approval Anda</h2>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-purple-600"></span>
          </div>
        ) : (
          <div className="grid gap-4 mb-10">
            {requests.length === 0 && (
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center py-12">
                  <p className="text-gray-500">Tidak ada permintaan yang menunggu approval</p>
                </div>
              </div>
            )}

            {requests.map(req => (
              <div key={req.id} className="card bg-white shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-purple-600">{req.sidangType.name}</h2>
                  <p className="text-lg font-medium">Mahasiswa: {req.mahasiswa.name}</p>
                  <p className="text-sm text-gray-600">Email: {req.mahasiswa.email}</p>
                  <p className="text-sm">Tanggal Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID')}</p>

                  <div className="mt-4">
                    <h3 className="font-semibold">Syarat yang sudah dipenuhi:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                      {req.fulfillments.map((f: any) => (
                        <li key={f.id}>
                          {f.requirement.name}
                          {f.fileUrl && (
                            <span className="text-purple-600 ml-2">
                              📎 <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">Lihat file</a>
                            </span>
                          )}
                          {f.isConfirmed && <span className="badge badge-success ml-2">✓</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(req.id, 'approve')}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id && <span className="loading loading-spinner loading-sm"></span>}
                      ✅ Setuju
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => handleApprove(req.id, 'reject')}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id && <span className="loading loading-spinner loading-sm"></span>}
                      ❌ Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sidang Berlangsung - For Revision Notes */}
        {sidangRequests.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sidang Berlangsung</h2>
            <div className="grid gap-4">
              {sidangRequests.map(req => (
                <div key={req.id} className="card bg-white shadow-xl border-l-4 border-yellow-500">
                  <div className="card-body">
                    <h2 className="card-title text-yellow-600">🔴 LIVE: {req.sidangType.name}</h2>
                    <p className="text-lg font-medium">Mahasiswa: {req.mahasiswa.name}</p>
                    <p className="text-sm text-gray-600">Anda dapat menginput catatan revisi untuk sidang ini</p>

                    <div className="card-actions justify-end mt-6">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleInputRevisi(req.id)}
                      >
                        📝 Input Revisi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showRevisiModal && selectedRequestId && (
        <RevisiInputModal
          requestId={selectedRequestId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default function DosenApproval() {
  return (
    <AuthGuard allowedRoles={['dosen', 'akademik', 'perpustakaan', 'keuangan']}>
      <DosenApprovalContent />
    </AuthGuard>
  );
}
