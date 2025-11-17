'use client';

import { useState, useEffect, useRef } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import * as XLSX from 'xlsx';
import EmptyState from "@/components/EmptyState";
import { TableSkeleton, StatsSkeleton } from "@/components/LoadingSkeleton";
import { useConfirm } from "@/components/ConfirmDialog";
import { useKeyboardShortcut, SHORTCUTS } from "@/hooks/useKeyboardShortcut";
import { getRelativeTime } from "@/lib/dateUtils";

function AdminDashboardContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  useEffect(() => {
    fetchAllRequests();
  }, []);

  useEffect(() => {
    // Filter logic
    let filtered = requests;

    // Status filter
    if (filter !== "all") {
      filtered = filtered.filter(req => req.status === filter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(req =>
        new Date(req.createdAt).toISOString().split('T')[0] === dateFilter
      );
    }

    // Search filter (name, email, NIM)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.mahasiswa.name.toLowerCase().includes(query) ||
        req.mahasiswa.email.toLowerCase().includes(query) ||
        (req.mahasiswa.nim && req.mahasiswa.nim.toLowerCase().includes(query))
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filter, dateFilter, searchQuery, requests]);

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
    const confirmed = await confirm({
      title: "Hapus Request?",
      message: "Data akan di-soft-delete dan dapat dipulihkan oleh administrator.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      confirmColor: "error"
    });

    if (!confirmed) return;

    setDeletingId(id);
    await fetch(`/api/requests/${id}`, { method: "DELETE" });
    await fetchAllRequests();
    setDeletingId(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredRequests.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Keyboard shortcuts
  useKeyboardShortcut([
    {
      ...SHORTCUTS.SEARCH,
      callback: () => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    },
    {
      ...SHORTCUTS.NEXT_PAGE,
      callback: () => {
        if (currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      }
    },
    {
      ...SHORTCUTS.PREV_PAGE,
      callback: () => {
        if (currentPage > 1) {
          goToPage(currentPage - 1);
        }
      }
    },
    {
      ...SHORTCUTS.REFRESH,
      callback: (e) => {
        fetchAllRequests();
      }
    }
  ]);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="relative sm:col-span-2 md:col-span-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="🔍 Cari nama, email, atau NIM... (Ctrl+K)"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

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
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} dari {filteredRequests.length} data
                {searchQuery && ` (hasil pencarian: "${searchQuery}")`}
              </div>
              <button
                className="btn btn-primary bg-purple-600 btn-sm"
                onClick={exportExcel}
                disabled={filteredRequests.length === 0}
              >
                📊 Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 animate-slide-in-up">
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
        )}

        {/* Requests List */}
        {loading ? (
          <div className="card bg-white shadow-xl">
            <div className="card-body p-2 sm:p-6">
              <TableSkeleton rows={10} />
            </div>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="card bg-white shadow-xl">
            <div className="card-body">
              <EmptyState
                icon={searchQuery ? "🔍" : "📭"}
                title={searchQuery ? "Tidak ada hasil" : "Belum ada data"}
                description={
                  searchQuery
                    ? `Tidak ditemukan hasil untuk "${searchQuery}". Coba kata kunci lain.`
                    : "Belum ada pengajuan sidang yang masuk. Data akan muncul ketika mahasiswa mengajukan sidang."
                }
              />
            </div>
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
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Tidak ada data"}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((req, idx) => (
                        <tr key={req.id} className="hover:bg-purple-50">
                          <td>{startIndex + idx + 1}</td>
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
                          <td>
                            <div className="tooltip" data-tip={new Date(req.createdAt).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}>
                              <span className="text-sm">{getRelativeTime(req.createdAt)}</span>
                            </div>
                          </td>
                          <td>{req.currentStep?.role || "-"}</td>
                          <td>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => deleteRequest(req.id)}
                              disabled={deletingId === req.id}
                            >
                              {deletingId === req.id && <span className="loading loading-spinner loading-xs"></span>}
                              {deletingId === req.id ? "" : "Hapus"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredRequests.length > itemsPerPage && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    className="btn btn-sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and adjacent pages
                        return page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, idx, arr) => (
                        <div key={page} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="text-gray-400">...</span>
                          )}
                          <button
                            className={`btn btn-sm ${currentPage === page ? 'btn-primary bg-purple-600' : 'btn-ghost'
                              }`}
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>

                  <button
                    className="btn btn-sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs hidden lg:block">
          <div className="font-semibold mb-1">⌨️ Shortcuts</div>
          <div className="space-y-1 text-gray-600">
            <div><kbd className="kbd kbd-xs">Ctrl</kbd> + <kbd className="kbd kbd-xs">K</kbd> - Search</div>
            <div><kbd className="kbd kbd-xs">Ctrl</kbd> + <kbd className="kbd kbd-xs">←</kbd> - Prev Page</div>
            <div><kbd className="kbd kbd-xs">Ctrl</kbd> + <kbd className="kbd kbd-xs">→</kbd> - Next Page</div>
            <div><kbd className="kbd kbd-xs">Ctrl</kbd> + <kbd className="kbd kbd-xs">R</kbd> - Refresh</div>
          </div>
        </div>
      </div>

      <ConfirmDialogComponent />
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
