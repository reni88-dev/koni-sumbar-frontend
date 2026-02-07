import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../api/axios';

import koniLogo from '../assets/koni-sumbar.jpg';

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password konfirmasi tidak cocok');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/api/reset-password', {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      setSuccess(true);
      
      // Refresh user data to update must_reset_password flag
      await fetchUser();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah password. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-amber-600 to-amber-700 clip-path-slant opacity-10 sm:opacity-100"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-100/50 backdrop-blur-3xl"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-amber-500 rounded-full blur-3xl"
        />
      </div>

      {/* Left Side - Hero/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-12 text-white">
        <div className="absolute inset-0 bg-amber-600 skew-x-12 -translate-x-32 shadow-2xl"></div>
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
            <h1 className="text-5xl font-bold mb-4 tracking-tight">Keamanan<br/>Akun</h1>
            <p className="text-amber-100 text-xl max-w-md leading-relaxed">
              Demi keamanan, Anda wajib membuat password baru untuk melanjutkan.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 text-amber-50"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <span>Gunakan kombinasi huruf, angka, dan simbol</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <span>Minimal 8 karakter</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <span>Jangan gunakan password yang mudah ditebak</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-20">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 sm:p-10"
        >
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Berhasil Diubah!</h2>
              <p className="text-slate-500">Mengalihkan ke dashboard...</p>
            </motion.div>
          ) : (
            <>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Buat Password Baru 🔐</h2>
                <p className="text-slate-500">
                  Halo <span className="font-semibold text-slate-700">{user?.name}</span>,<br/>
                  silakan buat password baru untuk keamanan akun Anda.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Password Baru</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all outline-none text-slate-700 font-medium"
                        placeholder="Minimal 8 karakter"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Konfirmasi Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all outline-none text-slate-700 font-medium"
                        placeholder="Ulangi password baru"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Simpan Password Baru</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400">
              &copy; 2026 KONI Sumatera Barat.<br/>All rights reserved.
            </p>
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
