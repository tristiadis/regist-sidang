'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";

function MahasiswaRequestContent() {
  const [sidangTypes, setSidangTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [files, setFiles] = useState<Record<number, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchActiveSidangTypes();
  }, []);

  const fetchActiveSidangTypes = async () => {
    const res = await fetch("/api/sidang-types?active=true");
    setSidangTypes(await res.json());
  };

  const handleTypeSelect = async (typeId: number) => {
    setSelectedType(typeId);
    // Fetch requirements for all roles
    const res = await fetch(`/api/requirements/all?sidangTypeId=${typeId}`);
    setRequirements(await res.json());
  };

  const handleFileChange = (reqId: number, file: File | null) => {
    if (file) {
      setFiles({ ...files, [reqId]: file });
    } else {
      const newFiles = { ...files };
      delete newFiles[reqId];
      setFiles(newFiles);
    }
  };

  const submitRequest = async () => {
    // Validate required files
    for (const req of requirements) {
      if (req.needsFile && !files[req.id]) {
        alert(`File untuk persyaratan "${req.name}" wajib diupload`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Create request
      const requestRes = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sidangTypeId: selectedType })
      });

      if (!requestRes.ok) {
        throw new Error("Gagal membuat request");
      }

      const request = await requestRes.json();

      // 2. Upload files & confirm requirements
      for (const req of requirements) {
        if (req.needsFile && files[req.id]) {
          const formData = new FormData();
          formData.append("file", files[req.id]);
          await fetch(`/api/upload?reqId=${req.id}&requestId=${request.id}`, {
            method: "POST",
            body: formData
          });
        }
      }

      alert("Request berhasil dibuat! Menunggu approval dosen pembimbing.");
      // Reset form
      setSelectedType(null);
      setRequirements([]);
      setFiles({});
    } catch (error) {
      alert("Terjadi kesalahan. Silakan coba lagi.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Pengajuan Sidang</h1>

        <div className="card bg-white shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Pilih Jenis Sidang</h2>
            <select
              className="select select-bordered w-full"
              onChange={(e) => handleTypeSelect(Number(e.target.value))}
              value={selectedType || ""}
            >
              <option value="">Pilih Jenis Sidang</option>
              {sidangTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedType && (
          <div className="space-y-4">
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg">Persyaratan yang harus dipenuhi</h2>
                <div className="space-y-3 mt-4">
                  {requirements.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Belum ada persyaratan untuk jenis sidang ini
                    </p>
                  ) : (
                    requirements.map(req => (
                      <div key={req.id} className="card bg-purple-50">
                        <div className="card-body p-4">
                          <h3 className="font-medium">
                            {req.name}{" "}
                            <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded">
                              {req.role}
                            </span>
                          </h3>
                          {req.description && (
                            <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                          )}
                          {req.needsFile && (
                            <div className="mt-3">
                              <label className="label">
                                <span className="label-text">Upload File <span className="text-red-500">*</span></span>
                              </label>
                              <input
                                type="file"
                                className="file-input file-input-bordered w-full"
                                onChange={(e) =>
                                  e.target.files && handleFileChange(req.id, e.target.files[0])
                                }
                              />
                              {files[req.id] && (
                                <p className="text-sm text-green-600 mt-1">
                                  ✓ File terpilih: {files[req.id].name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary bg-purple-600 hover:bg-purple-700 w-full text-lg"
              onClick={submitRequest}
              disabled={isSubmitting || requirements.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Loading...
                </>
              ) : (
                "Submit Pengajuan"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MahasiswaRequest() {
  return (
    <AuthGuard allowedRoles={['mahasiswa']}>
      <MahasiswaRequestContent />
    </AuthGuard>
  );
}
