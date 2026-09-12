import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-glow w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <p className="text-2xl mb-1">⚔️</p>
          <h1 className="font-display text-xl font-semibold">Welcome Back, Adventurer</h1>
        </div>
        {error && <p role="alert" className="text-sm text-red-300 bg-red-950/60 border border-red-500/30 rounded-lg px-3 py-2 mb-4">⚠️ {error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Logging in…" : "Login"}
          </button>
        </form>
        <p className="text-sm text-slate-400 text-center mt-6">
          New here? <Link to="/signup" className="text-arcane hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
