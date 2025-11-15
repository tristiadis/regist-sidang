'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import * as XLSX from 'xlsx';

function AdminDashboardContent() {
  const [stats, setStats] = useState<any>({});
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAllRequests();
  }, []);

  const fetchStats = async () => {
    const res = await fetch("/api/admin/stats");
    setStats(await res.json());
  };

  const fetchAllRequests = async () => {
    setLoading(true);
    const res = await fetch("/api/requests?all=true");
    setRequests(await res.json());
    setLoading(false);
  };

  const exportExcel = () => {
    const exportData = requests.map(req => ({
      'ID': req.id,
      'Mahasiswa': req.mahasiswa.name,
      'Email': req.mahasiswa.email,
      'Jenis Sidang': req.sidangType.name,
      'Status': req.status,
      'Step Saat Ini': req.currentStep?.role || '-',
      'Tanggal Pengajuan': new Date(req.createdAt).toLocaleDateString('id-ID'),
      'Terakhir Update': new Date(req.updatedAt).toLocaleDateString('id-ID'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Requests");

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `sidang_requests_${date}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Dashboard Admin</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-white shadow-lg rounded-lg p-4">
            <div className="stat-title text-gray-600">Total Request</div>
            <div className="stat-value text-2xl text-purple-600">{stats.total || 0}</div>
          </div>
          <div className="stat bg-white shadow-lg rounded-lg p-4">
            <div className="stat-title text-gray-600">Pending</div>
            <div className="stat-value text-2xl text-yellow-600">{stats.pending || 0}</div>
          </div>
          <div className="stat bg-white shadow-lg rounded-lg p-4">
            <div className="stat-title text-gray-600">Approved</div>
            <div className="stat-value text-2xl text-green-600">{stats.approved || 0}</div>
          </div>
          <div className="stat bg-white shadow-lg rounded-lg p-4">
            <div className="stat-title text-gray-600">Rejected</div>
            <div className="stat-value text-2xl text-red-600">{stats.rejected || 0}</div>
          </div>
        </div>

        <div className="card bg-white shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Semua Request</h2>
              <button
                className="btn btn-primary bg-purple-600 hover:bg-purple-700"
                onClick={exportExcel}
                disabled={requests.length === 0}
              >
                📊 Export ke Excel
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-lg text-purple-600"></span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Mahasiswa</th>
                      <th>Jenis Sidang</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-500 py-8">
                          Belum ada request
                        </td>
                      </tr>
                    ) : (
                      requests.map(req => (
                        <tr key={req.id} className="hover">
                          <td>{req.id}</td>
                          <td>
                            <div>
                              <div className="font-medium">{req.mahasiswa.name}</div>
                              <div className="text-sm text-gray-500">{req.mahasiswa.email}</div>
                            </div>
                          </td>
                          <td>{req.sidangType.name}</td>
                          <td>
                            <span className={`badge ${
                              req.status === 'approved' ? 'badge-success' :
                              req.status === 'rejected' ? 'badge-error' :
                              req.status === 'pending' ? 'badge-warning' :
                              'badge-info'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td>{new Date(req.createdAt).toLocaleDateString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
