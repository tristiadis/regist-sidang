'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthGuard } from "@/components/AuthGuard";

function MahasiswaTrackerContent() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchMyRequests();
    }
  }, [session]);

  const fetchMyRequests = async () => {
    setLoading(true);
    const res = await fetch("/api/requests/my-requests");
    const data = await res.json();
    setRequests(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      pending: { color: "badge-warning", label: "Menunggu Approval" },
      waiting_admin: { color: "badge-info", label: "Menunggu Admin" },
      sidang_berlangsung: { color: "badge-warning", label: "Sidang Berlangsung" },
      sidang_selesai: { color: "badge-success", label: "Sidang Selesai" },
      done: { color: "badge-success", label: "Selesai" },
      rejected: { color: "badge-error", label: "Ditolak" }
    };

    const badge = badges[status] || { color: "badge-ghost", label: status };
    return <span className={`badge ${badge.color}`}>{badge.label}</span>;
  };

  const getStatusProgress = (status: string) => {
    const progress: Record<string, number> = {
      pending: 25,
      waiting_admin: 50,
      sidang_berlangsung: 75,
      sidang_selesai: 90,
      done: 100,
      rejected: 0
    };
    return progress[status] || 0;
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">📍 Status Tracking Pengajuan Sidang</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-purple-600"></span>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.length === 0 ? (
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center py-12">
                  <p className="text-gray-500 text-lg">Anda belum memiliki pengajuan sidang</p>
                  <p className="text-sm text-gray-400 mt-2">Silakan ajukan sidang terlebih dahulu</p>
                  <a href="/mahasiswa/request" className="btn btn-primary bg-purple-600 mt-4">
                    📤 Ajukan Sidang
                  </a>
                </div>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="card bg-white shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="card-title text-purple-600 text-2xl">{req.sidangType.name}</h2>
                        <p className="text-sm text-gray-500">
                          Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>{getStatusBadge(req.status)}</div>
                    </div>

                    {/* Progress Bar */}
                    {req.status !== 'rejected' && (
                      <div className="mb-6">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{getStatusProgress(req.status)}%</span>
                        </div>
                        <progress
                          className="progress progress-primary w-full"
                          value={getStatusProgress(req.status)}
                          max="100"
                        ></progress>
                      </div>
                    )}

                    {/* Current Step Info */}
                    {req.status === 'pending' && req.currentStep && (
                      <div className="alert alert-info mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Menunggu approval dari: <strong>{req.currentStep.role}</strong></span>
                      </div>
                    )}

                    {req.status === 'waiting_admin' && (
                      <div className="alert alert-info mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Semua approval selesai! Menunggu admin untuk menjadwalkan sidang.</span>
                      </div>
                    )}

                    {req.status === 'sidang_berlangsung' && (
                      <div className="alert alert-warning mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <span>🔴 LIVE: Sidang Anda sedang berlangsung!</span>
                      </div>
                    )}

                    {req.status === 'rejected' && (
                      <div className="alert alert-error mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Pengajuan ditolak. Silakan cek catatan penolakan di bawah.</span>
                      </div>
                    )}

                    {req.status === 'done' && (
                      <div className="alert alert-success mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Selamat! Sidang Anda telah selesai.</span>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="mt-6">
                      <h3 className="font-semibold text-lg mb-3">Timeline Approval</h3>
                      <div className="space-y-3">
                        {req.approvals && req.approvals.length > 0 ? (
                          req.approvals.map((approval: any, idx: number) => (
                            <div key={approval.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${
                                  approval.action === 'approve' ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                {idx < req.approvals.length - 1 && (
                                  <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-medium">
                                  {approval.action === 'approve' ? '✅ Disetujui' : '❌ Ditolak'} oleh {approval.approver.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(approval.createdAt).toLocaleDateString('id-ID')} - {approval.approver.role}
                                </p>
                                {approval.notes && (
                                  <p className="text-sm text-gray-600 mt-1 italic">"{approval.notes}"</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Belum ada approval</p>
                        )}
                      </div>
                    </div>

                    {/* Revision Notes */}
                    {req.revisiNotes && req.revisiNotes.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-lg mb-3">📝 Catatan Revisi</h3>
                        <div className="space-y-2">
                          {req.revisiNotes.map((note: any) => (
                            <div key={note.id} className="card bg-yellow-50 border-l-4 border-yellow-500">
                              <div className="card-body p-4">
                                <p className="text-sm">{note.catatan}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-xs text-gray-600">
                                    - {note.dosen?.name} ({new Date(note.createdAt).toLocaleDateString('id-ID')})
                                  </p>
                                  {note.fileUrl && (
                                    <a
                                      href={note.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-purple-600 underline"
                                    >
                                      📎 Lihat File
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    <div className="mt-6">
                      <h3 className="font-semibold text-lg mb-3">📄 Dokumen yang Diupload</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {req.fulfillments && req.fulfillments.length > 0 ? (
                          req.fulfillments.map((f: any) => (
                            <div key={f.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                              <span className="text-sm flex-1">{f.requirement.name}</span>
                              {f.fileUrl ? (
                                <a
                                  href={f.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-xs btn-primary bg-purple-600"
                                >
                                  Lihat
                                </a>
                              ) : (
                                <span className="badge badge-ghost badge-sm">No File</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Tidak ada dokumen</p>
                        )}
                      </div>
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

export default function MahasiswaTracker() {
  return (
    <AuthGuard allowedRoles={['mahasiswa']}>
      <MahasiswaTrackerContent />
    </AuthGuard>
  );
}
