import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
import api from "../api/axios";

import koniLogo from "../assets/koni-sumbar.jpg";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Format email tidak valid");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/forgot-password", { email: trimmedEmail });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengirim permintaan reset password. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-red-600 to-red-700 clip-path-slant opacity-10 sm:opacity-100"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-100/50 backdrop-blur-3xl"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-red-500 rounded-full blur-3xl"
        />
      </div>

      <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-12 text-white">
        <div className="absolute inset-0 bg-red-600 skew-x-12 -translate-x-32 shadow-2xl"></div>
        <div className="active relative pl-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 p-2">
              <img src={koniLogo} alt="Logo KONI Sumbar" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight">Reset<br />Password</h1>
            <p className="text-red-100 text-xl max-w-md leading-relaxed">
              Masukkan email akun Anda untuk menerima tautan reset password yang aman.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-20">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 sm:p-10"
        >
          <div className="mb-10">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke login
            </Link>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Lupa Password</h2>
            <p className="text-slate-500">Kami akan mengirimkan link reset jika email terdaftar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-green-100"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Jika email terdaftar, link reset password akan dikirim melalui email.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-red-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all outline-none text-slate-700 font-medium"
                  placeholder="email@konisumbar.or.id"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Kirim Link Reset</span>}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400">&copy; 2026 KONI Sumatera Barat.<br />All rights reserved.</p>
          </div>
        </motion.div>
      </div>

      <style>{`
        .clip-path-slant {
          clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
}
