import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError, calculateBMR, calculateTDEE } from '../lib/utils';
import { User as UserIcon, Scale, Ruler, Calendar, Activity, Save, Target, Flame } from 'lucide-react';

interface ProfileSettingsProps {
  profile: UserProfile | null;
  user: User;
}

export default function ProfileSettings({ profile, user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    targetCalories: 2000,
    weight: 0,
    height: 0,
    age: 0,
    gender: 'male',
    activityLevel: 'sedentary',
    defaultDailyBurn: 1500
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        targetCalories: profile.targetCalories || 2000,
        weight: profile.weight || 0,
        height: profile.height || 0,
        age: profile.age || 0,
        gender: profile.gender || 'male',
        activityLevel: profile.activityLevel || 'sedentary',
        defaultDailyBurn: profile.defaultDailyBurn || 1500
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setMessage('Cập nhật thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const bmr = calculateBMR(formData);
  const tdee = calculateTDEE(bmr, formData.activityLevel);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="section-title">CÀI ĐẶT CÁ NHÂN</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card-density border-l-blue-500">
          <div className="text-[11px] font-bold text-text-secondary uppercase">BMR</div>
          <div className="text-xl font-bold text-blue-900">{Math.round(bmr)} kcal</div>
        </div>
        <div className="stat-card-density border-l-accent-out">
          <div className="text-[11px] font-bold text-text-secondary uppercase">TDEE</div>
          <div className="text-xl font-bold text-orange-900">{tdee} kcal</div>
        </div>
      </div>

      <div className="card-density">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                <Scale className="w-3.5 h-3.5" /> Cân nặng (kg)
              </label>
              <input
                type="number"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                <Ruler className="w-3.5 h-3.5" /> Chiều cao (cm)
              </label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                <Calendar className="w-3.5 h-3.5" /> Tuổi
              </label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                <UserIcon className="w-3.5 h-3.5" /> Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                <Activity className="w-3.5 h-3.5" /> Mức độ hoạt động
              </label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
              >
                <option value="sedentary">Ít vận động</option>
                <option value="light">Vận động nhẹ</option>
                <option value="moderate">Vận động vừa phải</option>
                <option value="active">Vận động nhiều</option>
                <option value="very_active">Vận động rất nhiều</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                <Target className="w-3.5 h-3.5" /> Mục tiêu calo hàng ngày
              </label>
              <input
                type="number"
                value={formData.targetCalories || ''}
                onChange={(e) => setFormData({ ...formData, targetCalories: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all font-bold text-accent-net"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                <Flame className="w-3.5 h-3.5" /> Calo tiêu thụ mặc định (BMR)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.defaultDailyBurn || ''}
                  onChange={(e) => setFormData({ ...formData, defaultDailyBurn: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all font-bold text-accent-out"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, defaultDailyBurn: Math.round(bmr) })}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-[10px] font-bold transition-all"
                >
                  DÙNG BMR
                </button>
              </div>
            </div>
        </div>

          <div className="pt-4 flex items-center justify-between">
            <p className="text-[12px] text-accent-in font-bold">{message}</p>
            <button
              type="submit"
              disabled={loading}
              className="btn-density btn-density-primary px-8 py-2.5 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-neutral-100 p-4 rounded-xl text-center">
        <p className="text-text-secondary text-[11px]">
          {user.isAnonymous 
            ? "Bạn đang sử dụng chế độ ẩn danh. Dữ liệu được lưu trên trình duyệt này." 
            : `Đang đăng nhập với: ${user.email}`}
        </p>
      </div>
    </div>
  );
}
