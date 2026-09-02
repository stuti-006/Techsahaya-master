import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DotmHex4, DotMatrixLoaderModal } from "../components/ui/DotmHex4";
import { useAppContext } from "../context/AppContext";

export function LoginPage() {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember_session: false });
  const [error, setError] = useState("");
  const redirect = new URLSearchParams(location.search).get("redirect") || "/dashboard";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(form);
      if (result) {
        setError(result);
        setLoading(false);
      } else {
        setTimeout(() => {
          navigate(redirect);
        }, 500);
      }
    } catch {
      setError("Failed to sign in. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10">
      {loading && (
        <DotMatrixLoaderModal
          title="Logging in to Tech Sahaya..."
          subtitle="Loading your personalized citizen profile and saved benefits"
        />
      )}
      <div className="grid w-full gap-6 rounded-3xl border bg-white p-6 shadow-card lg:grid-cols-2">
        <div className="rounded-3xl bg-sahaya-green p-8 text-white">
          <h1 className="text-3xl font-bold">Login to Tech Sahaya</h1>
          <p className="mt-3 text-emerald-50">
            Secure citizen access for personalized benefits, welfare gaps, documents, and journey tracking.
          </p>
          <div className="mt-6 text-sm">
            Authorized access is available for citizen, CSC, and admin roles.
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <input
            className="min-h-12 w-full rounded-xl border px-4"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <div className="relative">
            <input
              className="min-h-12 w-full rounded-xl border px-4 pr-12"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-3"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.remember_session}
              onChange={(e) => setForm({ ...form, remember_session: e.target.checked })}
            />{" "}
            Remember session
          </label>
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sahaya-green font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <DotmHex4 size={24} dotSize={3.5} color="#FFFFFF" /> Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-sahaya-green">
              Forgot password?
            </Link>
            <Link to="/signup" className="text-sahaya-green underline underline-offset-2 font-medium">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
