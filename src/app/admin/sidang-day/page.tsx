'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { showSuccess, showError } from "@/lib/toast";

function AdminSidangDayContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitingAdmin();
  }, []);

  const fetchWaitingAdmin = async () => {
    setLoading(true);
    const res = await fetch("/api/requests?status=waiting_admin");
    setRequests(await res.json());
    setLoading(false);
  };

  const updateStatus = async (requestId: number, newStatus: string) => {
    const res = await fetch(`/api/requests/${requestId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      showSuccess("Status berhasil diupdate");
      fetchWaitingAdmin();
    } else {
      showError("Gagal update status");
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Manajemen Sidang</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-purple-600"></span>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center py-8">
                  <p className="text-gray-500">Tidak ada request yang menunggu jadwal sidang</p>
                </div>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="card bg-white shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title text-purple-600">{req.sidangType.name}</h2>
                    <p className="text-lg font-medium">Mahasiswa: {req.mahasiswa.name}</p>
                    <p className="text-sm text-gray-600">Semua approval selesai, siap untuk sidang</p>

                    <div className="card-actions justify-end mt-6">
                      <button
                        className="btn btn-success"
                        onClick={() => updateStatus(req.id, "sidang_berlangsung")}
                      >
                        ▶️ Sidang Berlangsung
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <h2 className="text-2xl font-bold text-purple-600 mt-10 mb-4">Sidang yang Sedang Berlangsung</h2>
        <SidangBerlangsungList />
      </div>
    </div>
  );
}

function SidangBerlangsungList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSidangBerlangsung();
  }, []);

  const fetchSidangBerlangsung = async () => {
    setLoading(true);
    const res = await fetch("/api/requests?status=sidang_berlangsung");
    setRequests(await res.json());
    setLoading(false);
  };

  const completeSidang = async (requestId: number) => {
    if (!confirm("Tandai sidang ini selesai?")) return;

    const res = await fetch(`/api/requests/${requestId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sidang_selesai" })
    });

    if (res.ok) {
      showSuccess("Sidang berhasil ditandai selesai");
      fetchSidangBerlangsung();
    } else {
      showError("Gagal update status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg text-purple-600"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="card bg-white shadow-xl">
          <div className="card-body text-center py-8">
            <p className="text-gray-500">Tidak ada sidang yang sedang berlangsung</p>
          </div>
        </div>
      ) : (
        requests.map(req => (
          <div key={req.id} className="card bg-white shadow-xl border-l-4 border-yellow-500">
            <div className="card-body">
              <h2 className="card-title text-yellow-600">🔴 LIVE: {req.sidangType.name}</h2>
              <p className="text-lg font-medium">Mahasiswa: {req.mahasiswa.name}</p>
              <p className="text-sm text-gray-600">Dosen dapat menginput catatan revisi pada sesi ini</p>

              {req.revisiNotes && req.revisiNotes.length > 0 && (
                <div className="mt-3">
                  <h3 className="font-semibold text-sm">Catatan Revisi:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {req.revisiNotes.map((note: any) => (
                      <li key={note.id}>
                        {note.catatan} - <span className="text-purple-600">{note.dosen?.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="card-actions justify-end mt-6">
                <button
                  className="btn btn-success"
                  onClick={() => completeSidang(req.id)}
                >
                  ✅ Sidang Selesai
                </button>
              </div>
            </div>
          </div>
        ))
      )}
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
