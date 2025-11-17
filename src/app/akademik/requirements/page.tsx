'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { showError } from "@/lib/toast";

function RequirementInputContent() {
  const [sidangTypes, setSidangTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [newReq, setNewReq] = useState({ name: "", desc: "", needsFile: false });

  useEffect(() => {
    fetchSidangTypes();
  }, []);

  useEffect(() => {
    if (selectedType) fetchRequirements();
  }, [selectedType]);

  const fetchSidangTypes = async () => {
    const res = await fetch("/api/sidang-types");
    setSidangTypes(await res.json());
  };

  const fetchRequirements = async () => {
    const res = await fetch(`/api/requirements?sidangTypeId=${selectedType}&role=akademik`);
    setRequirements(await res.json());
  };

  const addRequirement = async () => {
    if (!newReq.name) {
      showError("Mohon isi nama persyaratan terlebih dahulu");
      return;
    }

    await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "akademik",
        sidangTypeId: selectedType,
        name: newReq.name,
        description: newReq.desc,
        needsFile: newReq.needsFile
      })
    });
    setNewReq({ name: "", desc: "", needsFile: false });
    fetchRequirements();
  };

  const deleteRequirement = async (id: number) => {
    if (!confirm("Yakin ingin menghapus persyaratan ini?")) return;

    await fetch(`/api/requirements/${id}`, { method: "DELETE" });
    fetchRequirements();
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Input Persyaratan</h1>

        <div className="card bg-white shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Pilih Tipe Sidang</h2>
            <select
              className="select select-bordered w-full"
              onChange={(e) => setSelectedType(Number(e.target.value))}
              value={selectedType || ""}
            >
              <option value="">Pilih Tipe Sidang</option>
              {sidangTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedType && (
          <div className="space-y-4">
            <div className="card bg-purple-100">
              <div className="card-body">
                <h3 className="font-semibold mb-2">Tambah Persyaratan Baru</h3>
                <div className="form-control mb-2">
                  <label className="label">
                    <span className="label-text">Nama Persyaratan</span>
                  </label>
                  <input
                    placeholder="Contoh: Bukti Pembayaran UKT"
                    className="input input-bordered w-full"
                    value={newReq.name}
                    onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                  />
                </div>
                <div className="form-control mb-2">
                  <label className="label">
                    <span className="label-text">Deskripsi</span>
                  </label>
                  <input
                    placeholder="Deskripsi persyaratan"
                    className="input input-bordered w-full"
                    value={newReq.desc}
                    onChange={(e) => setNewReq({ ...newReq, desc: e.target.value })}
                  />
                </div>
                <label className="label cursor-pointer justify-start gap-2 mb-4">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={newReq.needsFile}
                    onChange={(e) => setNewReq({ ...newReq, needsFile: e.target.checked })}
                  />
                  <span className="label-text">Wajib upload file?</span>
                </label>
                <button
                  className="btn btn-primary bg-purple-600 hover:bg-purple-700"
                  onClick={addRequirement}
                >
                  Tambah Persyaratan
                </button>
              </div>
            </div>

            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg">Daftar Persyaratan</h2>
                <div className="space-y-3 mt-4">
                  {requirements.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada persyaratan</p>
                  ) : (
                    requirements.map(req => (
                      <div key={req.id} className="card bg-base-200">
                        <div className="card-body p-4 flex flex-row justify-between items-center">
                          <div>
                            <span className="font-medium">{req.name}</span>
                            {req.description && (
                              <p className="text-sm text-gray-500">{req.description}</p>
                            )}
                            <p className="text-xs text-purple-600 mt-1">
                              {req.needsFile ? "✅ Wajib file" : "✅ Tanpa file"}
                            </p>
                          </div>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => deleteRequirement(req.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequirementInput() {
  return (
    <AuthGuard allowedRoles={['akademik', 'admin']}>
      <RequirementInputContent />
    </AuthGuard>
  );
}
