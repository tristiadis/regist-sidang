'use client';

import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="card w-96 bg-white shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-purple-600 text-2xl mb-4">Login Sidang Workflow</h2>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Email"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full bg-purple-600 hover:bg-purple-700 border-0"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Login"}
            </button>
          </form>

          <div className="divider">Demo Credentials</div>

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><strong>Admin:</strong> admin@prodi.ac.id | admin123</p>
            <p><strong>Mahasiswa:</strong> mahasiswa@example.com | mahasiswa123</p>
            <p><strong>Dosen:</strong> dosen@example.com | dosen123</p>
            <p><strong>Akademik:</strong> akademik@example.com | akademik123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
