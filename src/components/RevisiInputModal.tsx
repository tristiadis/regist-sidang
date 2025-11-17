'use client';

import { useState } from "react";

export default function RevisiInputModal({ requestId, onClose }: { requestId: number, onClose: () => void }) {
  const [catatan, setCatatan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRevisi = async () => {
    if (!catatan) {
      alert("Catatan harus diisi!");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("catatan", catatan);
    formData.append("requestId", requestId.toString());
    if (file) formData.append("file", file);

    const res = await fetch("/api/revisi", { method: "POST", body: formData });

    if (res.ok) {
      alert("✅ Catatan revisi berhasil disimpan");
      onClose();
    } else {
      alert("❌ Gagal menyimpan");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card bg-white w-full max-w-2xl">
        <div className="card-body">
          <h2 className="card-title text-purple-600 mb-4">Input Catatan Revisi</h2>

          <textarea
            className="textarea textarea-bordered w-full h-32 mb-4"
            placeholder="Tulis catatan revisi di sini..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />

          <input
            type="file"
            className="file-input file-input-bordered file-input-primary w-full mb-4"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <div className="card-actions justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button
              className="btn btn-primary bg-purple-600"
              onClick={submitRevisi}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Loading..." : "Simpan Catatan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
