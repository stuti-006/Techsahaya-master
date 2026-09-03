import { Eye, EyeOff, ShieldCheck, Mail, ArrowRight, RotateCcw, CheckCircle2, Sparkles } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { DotmHex4 } from "../components/ui/DotmHex4";
import { SUPPORTED_LANGUAGES } from "../utils/languages";

export function SignupPage() {
  const { signup, sendOtp, verifyOtp, language, setLanguage } = useAppContext();
  const navigate = useNavigate();

  const [step, setStep] = useState<"register" | "verify_otp">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm: "",
    preferred_language: language || "en",
    phone_number: "",
    consent_given: false,
  });

  // 2-Step OTP Verification State
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password Strength Calculation
  const strength = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[a-z]/.test(form.password)) score++;
    if (/\d/.test(form.password)) score++;
    if (/[^A-Za-z0-9]/.test(form.password)) score++;
    return score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong";
  }, [form.password]);

  // Cooldown countdown timer for resend
  useEffect(() => {
    if (step !== "verify_otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!form.consent_given) {
      setError("You must accept the DPDP Act privacy consent to proceed");
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        preferred_language: form.preferred_language,
        phone_number: form.phone_number || undefined,
        consent_given: form.consent_given,
      });

      if (typeof res === "string") {
        setError(res);
        setLoading(false);
        return;
      }

      if (res && res.requires_otp) {
        setDevOtp(res.dev_otp || null);
        setStep("verify_otp");
        setResendCooldown(30);
        setSuccessMsg("Verification code sent to your email!");
      } else {
        navigate("/profile-setup");
      }
    } catch {
      setError("Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("").trim();
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const err = await verifyOtp({
        email: form.email,
        otp_code: code,
        purpose: "signup_2fa",
        remember_session: true,
      });

      if (err) {
        setError(err);
        setLoading(false);
      } else {
        setSuccessMsg("Email verified successfully! Setting up your citizen profile...");
        setTimeout(() => {
          navigate("/profile-setup");
        }, 600);
      }
    } catch {
      setError("Verification failed. Please check your code or request a new one.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await sendOtp(form.email, "signup_2fa");
      if (typeof res === "string") {
        setError(res);
      } else {
        setDevOtp(res.dev_otp || null);
        setResendCooldown(30);
        setSuccessMsg("A new verification code has been dispatched to your email.");
      }
    } catch {
      setError("Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center px-4 py-8 sm:py-12">
      <div className="grid w-full gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card lg:grid-cols-[1.1fr_1.3fr] overflow-hidden">
        {/* Left Side: Brand & Trust Pillar */}
        <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#164E35] via-[#1F5F3A] to-[#164E35] p-6 sm:p-8 text-white relative overflow-hidden">
          {/* Subtle Watermelon Glow in Background */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#FF4365]/20 blur-2xl" />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-sm">
              <ShieldCheck size={14} className="text-[#94C59D]" />
              <span>DPDP Act 2023 Compliant</span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold leading-tight">
              {step === "register" ? "Create your Citizen Account" : "Two-Step Email Verification"}
            </h1>

            <p className="mt-3 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {step === "register"
                ? "Join Tech Sahaya for transparent eligibility calculation, proactive scheme notifications, and explainable assistance."
                : "We verify every email with a secure one-time passcode to safeguard citizen welfare access and prevent unauthorized lookups."}
            </p>
          </div>

          <div className="mt-8 space-y-3 pt-6 border-t border-white/10 text-xs text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#94C59D] shrink-0" />
              <span>Zero raw credential storage (in-memory parsing)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#94C59D] shrink-0" />
              <span>Available in 9 regional Indic languages</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#94C59D] shrink-0" />
              <span>Instant explainable eligibility matching</span>
            </div>
          </div>
        </div>

        {/* Right Side: Step 1 (Register) or Step 2 (Two-Step OTP) */}
        <div className="flex flex-col justify-center">
          {step === "register" ? (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sign Up</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your basic citizen credentials</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  Step 1 of 2
                </span>
              </div>

              {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</div>}

              <form className="mt-5 space-y-3.5" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus:border-[#164E35] focus:outline-none"
                    placeholder="e.g. Ramesh Kumar"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus:border-[#164E35] focus:outline-none"
                    placeholder="name@example.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
                    <div className="relative">
                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 pr-10 text-sm focus:border-[#164E35] focus:outline-none"
                        placeholder="Min 8 chars"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        aria-label="Toggle password"
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 pr-10 text-sm focus:border-[#164E35] focus:outline-none"
                        placeholder="Re-enter password"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirm}
                        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        aria-label="Toggle confirm password"
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowConfirm((s) => !s)}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Preferred Language</label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#164E35] focus:outline-none"
                      value={form.preferred_language}
                      onChange={(e) => {
                        setForm({ ...form, preferred_language: e.target.value });
                        setLanguage(e.target.value);
                      }}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.nativeLabel} ({lang.label})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Phone (Optional)</label>
                    <input
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus:border-[#164E35] focus:outline-none"
                      placeholder="e.g. 9876543210"
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Password Security:</span>
                  <span className={`font-bold ${strength === "Strong" ? "text-emerald-600" : strength === "Medium" ? "text-amber-600" : "text-rose-600"}`}>
                    {strength}
                  </span>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-[#164E35] focus:ring-[#164E35]"
                    checked={form.consent_given}
                    onChange={(e) => setForm({ ...form, consent_given: e.target.checked })}
                  />
                  <span>
                    I agree to the Digital Personal Data Protection (DPDP) Act privacy terms and voluntary welfare evaluation consent.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#164E35] to-[#205C3B] font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <DotmHex4 size={20} dotSize={3} color="#FFFFFF" /> Processing...
                    </span>
                  ) : (
                    <>
                      Continue to 2-Step Verification <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-xs text-slate-600">
                  Already registered?{" "}
                  <Link to="/login" className="font-bold text-[#164E35] underline underline-offset-2 hover:text-[#1F5F3A]">
                    Login directly
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            /* STEP 2: Two-Step Email Verification */
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="text-[#FF4365]" size={20} />
                    Enter Verification Code
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Sent to <strong className="text-slate-900">{form.email}</strong>
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-[#C9183C] border border-rose-200">
                  Step 2 of 2
                </span>
              </div>

              {devOtp && (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FF4365] shrink-0" />
                    <span>
                      Demo Verification Code: <strong className="font-mono text-sm tracking-wider text-[#C9183C]">{devOtp}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtp.split("");
                      setOtpDigits(digits);
                    }}
                    className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#C9183C] border border-rose-300 shadow-xs hover:bg-rose-100 transition cursor-pointer"
                  >
                    Quick Fill
                  </button>
                </div>
              )}

              {error && <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</div>}
              {successMsg && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">{successMsg}</div>}

              <form className="mt-5 space-y-5" onSubmit={handleVerifyOtp}>
                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="h-13 w-11 sm:h-14 sm:w-12 rounded-2xl border-2 border-slate-200 bg-stone-50 text-center text-xl font-bold text-slate-800 focus:border-[#FF4365] focus:bg-white focus:outline-none transition shadow-xs"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1 font-bold text-[#164E35] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.some((d) => !d)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4365] via-[#E8254E] to-[#C9183C] font-bold text-white shadow-lg shadow-[#FF4365]/25 hover:opacity-95 transition disabled:opacity-50 cursor-pointer text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <DotmHex4 size={20} dotSize={3} color="#FFFFFF" /> Verifying...
                    </span>
                  ) : (
                    <>
                      Verify & Setup Profile <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep("register")}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    ← Edit registration details
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
