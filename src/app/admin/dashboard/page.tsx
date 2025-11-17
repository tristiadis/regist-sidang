'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import * as XLSX from 'xlsx';

function AdminDashboardContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRequests();
  }, []);

  useEffect(() => {
    // Filter logic
    let filtered = requests;

    if (filter !== "all") {
      filtered = filtered.filter(req => req.status === filter);
    }

    if (dateFilter) {
      filtered = filtered.filter(req =>
        new Date(req.createdAt).toISOString().split('T')[0] === dateFilter
      );
    }

    setFilteredRequests(filtered);
  }, [filter, dateFilter, requests]);

  const fetchAllRequests = async () => {
    setLoading(true);
    const res = await fetch("/api/requests?all=true");
    const data = await res.json();
    setRequests(data);
    setFilteredRequests(data);
    setLoading(false);
  };

  const exportExcel = () => {
    const exportData = filteredRequests.map(req => ({
      "No": req.id,
      "Mahasiswa": req.mahasiswa.name,
      "Email": req.mahasiswa.email,
      "Jenis Sidang": req.sidangType.name,
      "Status": req.status,
      "Tanggal Pengajuan": new Date(req.createdAt).toLocaleDateString('id-ID'),
      "Step Saat Ini": req.currentStep?.role || "-",
      "Jumlah Revisi": req.revisiNotes?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Sidang");

    // Auto-width columns
    const colWidths = [
      { wch: 8 },  // No
      { wch: 25 }, // Mahasiswa
      { wch: 25 }, // Email
      { wch: 30 }, // Jenis Sidang
      { wch: 20 }, // Status
      { wch: 20 }, // Tanggal
      { wch: 25 }, // Step
      { wch: 15 }  // Jumlah Revisi
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Laporan_Sidang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const deleteRequest = async (id: number) => {
    if (!confirm("Hapus request ini? Data akan di-soft-delete.")) return;

    await fetch(`/api/requests/${id}`, { method: "DELETE" });
    fetchAllRequests();
  };

  const totalRequests = requests.length;
  const sidangBerlangsung = requests.filter(r => r.status === "sidang_berlangsung").length;
  const selesai = requests.filter(r => r.status === "done").length;
  const ditolak = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-purple-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-600 mb-4 sm:mb-6">Dashboard Laporan Sidang</h1>

        {/* Filter Section */}
        <div className="card bg-white shadow-xl mb-6">
          <div className="card-body p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <select
                className="select select-bordered select-sm sm:select-md"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="waiting_admin">Menunggu Admin</option>
                <option value="sidang_berlangsung">Sidang Berlangsung</option>
                <option value="sidang_selesai">Sidang Selesai</option>
                <option value="done">Selesai</option>
                <option value="rejected">Ditolak</option>
              </select>

              <input
                type="date"
                className="input input-bordered input-sm sm:input-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />

              <button
                className="btn btn-primary bg-purple-600 btn-sm sm:btn-md sm:col-span-2 md:col-span-2"
                onClick={exportExcel}
                disabled={filteredRequests.length === 0}
              >
                📊 Export ke Excel ({filteredRequests.length} data)
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="stat bg-white shadow-xl rounded-lg p-3 sm:p-4">
            <div className="stat-title text-xs">Total Request</div>
            <div className="stat-value text-purple-600 text-2xl sm:text-3xl">{totalRequests}</div>
          </div>
          <div className="stat bg-white shadow-xl rounded-lg p-3 sm:p-4">
            <div className="stat-title text-xs">Sidang Berlangsung</div>
            <div className="stat-value text-yellow-600 text-2xl sm:text-3xl">{sidangBerlangsung}</div>
          </div>
          <div className="stat bg-white shadow-xl rounded-lg p-3 sm:p-4">
            <div className="stat-title text-xs">Selesai</div>
            <div className="stat-value text-green-600 text-2xl sm:text-3xl">{selesai}</div>
          </div>
          <div className="stat bg-white shadow-xl rounded-lg p-3 sm:p-4">
            <div className="stat-title text-xs">Ditolak</div>
            <div className="stat-value text-red-600 text-2xl sm:text-3xl">{ditolak}</div>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-purple-600"></span>
          </div>
        ) : (
          <div className="card bg-white shadow-xl">
            <div className="card-body p-2 sm:p-6">
              <h2 className="card-title mb-4 px-2 sm:px-0">Daftar Request</h2>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="table w-full table-compact sm:table-normal">
                  <thead>
                    <tr className="bg-purple-50">
                      <th>No</th>
                      <th>Mahasiswa</th>
                      <th>Jenis Sidang</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                      <th>Step</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req, idx) => (
                        <tr key={req.id} className="hover:bg-purple-50">
                          <td>{idx + 1}</td>
                          <td>
                            <div className="font-medium">{req.mahasiswa.name}</div>
                            <div className="text-sm text-gray-500">{req.mahasiswa.email}</div>
                          </td>
                          <td>{req.sidangType.name}</td>
                          <td>
                            <span className={`badge ${req.status === 'done' ? 'badge-success' :
                                req.status === 'rejected' ? 'badge-error' :
                                  req.status === 'sidang_berlangsung' ? 'badge-warning' :
                                    'badge-ghost'
                              }`}>
                              {req.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(req.createdAt).toLocaleDateString('id-ID')}</td>
                          <td>{req.currentStep?.role || "-"}</td>
                          <td>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => deleteRequest(req.id)}
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}
