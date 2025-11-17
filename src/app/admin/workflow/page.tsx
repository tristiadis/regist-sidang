'use client';

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { showError } from "@/lib/toast";

function WorkflowBuilderContent() {
  const [sidangTypes, setSidangTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [newStepRole, setNewStepRole] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");

  useEffect(() => {
    fetchSidangTypes();
  }, []);

  useEffect(() => {
    if (selectedType) fetchSteps();
  }, [selectedType]);

  const fetchSidangTypes = async () => {
    const res = await fetch("/api/sidang-types");
    setSidangTypes(await res.json());
  };

  const fetchSteps = async () => {
    const res = await fetch(`/api/workflow-steps?sidangTypeId=${selectedType}`);
    setSteps(await res.json());
  };

  const addStep = async () => {
    if (!newStepRole) {
      showError("Mohon isi role terlebih dahulu");
      return;
    }

    await fetch("/api/workflow-steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sidangTypeId: selectedType,
        role: newStepRole,
        description: newStepDesc
      })
    });
    setNewStepRole("");
    setNewStepDesc("");
    fetchSteps();
  };

  const deleteStep = async (id: number) => {
    if (!confirm("Yakin ingin menghapus step ini?")) return;

    await fetch(`/api/workflow-steps/${id}`, { method: "DELETE" });
    fetchSteps();
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Workflow Builder</h1>

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
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg">Langkah-langkah Workflow</h2>
                <div className="space-y-3 mt-4">
                  {steps.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada langkah workflow</p>
                  ) : (
                    steps.map((step, idx) => (
                      <div key={step.id} className="card bg-base-200">
                        <div className="card-body p-4 flex flex-row justify-between items-center">
                          <div>
                            <span className="badge badge-primary mr-2">Step {idx + 1}</span>
                            <span className="font-medium">{step.role}</span>
                            {step.description && (
                              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                            )}
                          </div>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => deleteStep(step.id)}
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

            <div className="card bg-purple-100">
              <div className="card-body">
                <h3 className="font-semibold mb-2">Tambah Step Baru</h3>
                <div className="form-control mb-2">
                  <label className="label">
                    <span className="label-text">Role (misal: dosen_pembimbing_1)</span>
                  </label>
                  <input
                    placeholder="Role"
                    className="input input-bordered w-full"
                    value={newStepRole}
                    onChange={(e) => setNewStepRole(e.target.value)}
                  />
                </div>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Deskripsi (opsional)</span>
                  </label>
                  <input
                    placeholder="Deskripsi"
                    className="input input-bordered w-full"
                    value={newStepDesc}
                    onChange={(e) => setNewStepDesc(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary bg-purple-600 hover:bg-purple-700"
                  onClick={addStep}
                >
                  Tambah Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <WorkflowBuilderContent />
    </AuthGuard>
  );
}
