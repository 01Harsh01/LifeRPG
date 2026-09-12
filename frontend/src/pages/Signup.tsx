import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(name, email, password, confirmPassword);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-glow w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <p className="text-2xl mb-1">🛡️</p>
          <h1 className="font-display text-xl font-semibold">Begin Your Journey</h1>
        </div>
        {error && <p role="alert" className="text-sm text-red-300 bg-red-950/60 border border-red-500/30 rounded-lg px-3 py-2 mb-4">⚠️ {error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input id="name" required minLength={2} className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">Confirm Password</label>
            <input id="confirmPassword" type="password" required minLength={8} className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Creating account…" : "Start Your Journey"}
          </button>
        </form>
        <p className="text-sm text-slate-400 text-center mt-6">
          Already an adventurer? <Link to="/login" className="text-arcane hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
