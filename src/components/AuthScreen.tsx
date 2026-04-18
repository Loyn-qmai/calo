import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { KeyRound, User, Lock, ArrowRight, Loader2, Sparkles, Dumbbell } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length !== 6 || !/^\d+$/.test(password)) {
      setError('Mật khẩu phải đúng 6 chữ số');
      return;
    }

    setLoading(true);
    setError(null);

    // We use a fake email format for Firebase Auth: username@calotrack.app
    const fakeEmail = `${username.toLowerCase().trim()}@calotrack.app`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, fakeEmail, password);
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        const user = userCredential.user;

        // Create default profile
        const newProfile: UserProfile = {
          userId: user.uid,
          email: fakeEmail,
          targetCalories: 2000,
          defaultDailyBurn: 1500,
        };

        await setDoc(doc(db, 'users', user.uid), newProfile);
        await updateProfile(user, { displayName: username });
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Tên đăng nhập này đã được sử dụng');
      } else {
        setError('Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-xl shadow-orange-500/10 mb-6 border border-border overflow-hidden p-2">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-text-primary mb-2">TÔI SẼ GẦY</h1>
          <p className="text-text-secondary text-sm">Bạn Cũng Thế - Hành trình thay đổi bản thân</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-200/50 p-8 border border-border">
          <div className="flex bg-neutral-100 p-1 rounded-xl mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                isLogin ? "bg-white text-accent-net shadow-sm" : "text-text-secondary hover:text-text-primary"
              )}
            >
              ĐĂNG NHẬP
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                !isLogin ? "bg-white text-accent-net shadow-sm" : "text-text-secondary hover:text-text-primary"
              )}
            >
              ĐĂNG KÝ MỚI
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-text-secondary uppercase px-1">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-border rounded-xl text-sm outline-none focus:border-accent-net transition-all placeholder:text-neutral-400"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-text-secondary uppercase px-1">Mật khẩu (6 chữ số)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-border rounded-xl text-sm outline-none focus:border-accent-net transition-all placeholder:text-neutral-400 tracking-[0.5em]"
                  placeholder="******"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="w-1 h-1 rounded-full bg-rose-600"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-text-primary hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-xl shadow-lg shadow-neutral-900/10 transition-all flex items-center justify-center gap-3 group"
            >
              <span className="text-sm font-bold tracking-tight">
                {loading ? 'ĐANG XỬ LÝ...' : isLogin ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN'}
              </span>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-[11px] text-text-secondary leading-relaxed px-4">
            Bằng cách tiếp tục, bạn đồng ý với mục tiêu hành trình sức khỏe của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}
