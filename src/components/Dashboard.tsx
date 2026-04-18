import React, { useState } from 'react';
import { UserProfile, CalorieEntry, OperationType } from '../types';
import { format, isSameDay } from 'date-fns';
import { Utensils, Dumbbell, Target, Flame, Pencil, Trash2, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../lib/utils';
import { ConfirmModal } from './ui/ConfirmModal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { subDays, eachDayOfInterval, startOfDay } from 'date-fns';

interface DashboardProps {
  profile: UserProfile | null;
  entries: CalorieEntry[];
  user: User;
  onEdit: (entry: CalorieEntry) => void;
}

export default function Dashboard({ profile, entries, user, onEdit }: DashboardProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<7 | 14 | 30>(7);
  const today = new Date();
  const todayEntries = entries.filter(e => isSameDay(new Date(e.timestamp), today));
  
  const calIn = todayEntries.filter(e => e.type === 'food').reduce((acc, curr) => acc + curr.calories, 0);
  const exerciseOut = todayEntries.filter(e => e.type === 'exercise').reduce((acc, curr) => acc + curr.calories, 0);
  const baseBurn = profile?.defaultDailyBurn || 0;
  const calOut = exerciseOut + baseBurn;
  const target = profile?.targetCalories || 2000;
  const net = calIn - calOut;
  const weightChangeGrams = -(net / 7.7);
  const todayCost = todayEntries.reduce((acc, curr) => acc + (curr.price || 0), 0);

  const spendingData = React.useMemo(() => {
    const end = today;
    const start = subDays(end, chartPeriod - 1);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayCost = entries
        .filter(e => isSameDay(new Date(e.timestamp), day))
        .reduce((acc, curr) => acc + (curr.price || 0), 0);
      
      return {
        date: format(day, 'dd/MM'),
        'Chi phí': dayCost
      };
    });
  }, [entries, chartPeriod]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/entries`, deleteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/entries/${deleteId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-title">TỔNG QUAN HÔM NAY</div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="stat-card-density border-l-accent-in">
          <div className="text-[10px] sm:text-[11px] text-text-secondary font-bold whitespace-nowrap uppercase">CALO IN</div>
          <div className="text-xl sm:text-2xl font-bold text-accent-in mt-1 truncate">{calIn.toLocaleString()}</div>
        </div>
        <div className="stat-card-density border-l-accent-out">
          <div className="text-[10px] sm:text-[11px] text-text-secondary font-bold whitespace-nowrap uppercase">CALO OUT</div>
          <div className="text-xl sm:text-2xl font-bold text-accent-out mt-1 truncate">{calOut.toLocaleString()}</div>
        </div>
        <div className="stat-card-density border-l-accent-net">
          <div className="text-[10px] sm:text-[11px] text-text-secondary font-bold whitespace-nowrap uppercase">CÂN BẰNG</div>
          <div className="text-xl sm:text-2xl font-bold text-accent-net mt-1 truncate">{net > 0 ? '+' : ''}{net.toLocaleString()}</div>
        </div>
        <div className="stat-card-density border-l-purple-500">
          <div className="text-[10px] sm:text-[11px] text-text-secondary font-bold whitespace-nowrap uppercase">CÂN NẶNG +/-</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1 truncate">
            {weightChangeGrams > 0 ? '-' : '+'}{Math.abs(weightChangeGrams).toFixed(1)}g
          </div>
        </div>
        <div className="stat-card-density border-l-rose-500">
          <div className="text-[10px] sm:text-[11px] text-text-secondary font-bold whitespace-nowrap uppercase">TỔNG CHI PHÍ</div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1 truncate">{todayCost.toLocaleString()}đ</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Food Log */}
        <div className="lg:col-span-1">
          <div className="section-title">
            <span>NHẬT KÝ ĂN UỐNG (IN)</span>
          </div>
          <div className="card-density max-h-[500px] overflow-y-auto">
            {todayEntries.filter(e => e.type === 'food').length === 0 ? (
              <p className="text-text-secondary text-xs italic text-center py-4">Chưa có dữ liệu ăn uống</p>
            ) : (
              <ul className="space-y-0">
                {todayEntries.filter(e => e.type === 'food').map((entry) => (
                  <li key={entry.id} className="data-item-density group">
                    <div className="flex-1">
                      <div className="font-bold">{entry.name}</div>
                      <div className="item-meta-density">
                        {format(new Date(entry.timestamp), 'HH:mm')}
                        {entry.price ? ` • ${entry.price.toLocaleString()}đ` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold">{entry.calories} kcal</div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onEdit(entry)}
                          className="p-1.5 text-neutral-300 hover:text-accent-net transition-colors opacity-0 group-hover:opacity-100"
                          title="Sửa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(entry.id)}
                          className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Center Column: Exercise Log */}
        <div className="lg:col-span-1">
          <div className="section-title">
            <span>TẬP LUYỆN (OUT)</span>
          </div>
          <div className="card-density max-h-[500px] overflow-y-auto">
            <div className="data-item-density border-b border-neutral-100 bg-neutral-50/50">
              <div>
                <div className="font-bold text-accent-net">Mặc định (BMR)</div>
                <div className="item-meta-density">Tiêu thụ cơ bản hàng ngày</div>
              </div>
              <div className="font-bold text-accent-out">-{baseBurn} kcal</div>
            </div>
            {todayEntries.filter(e => e.type === 'exercise').length === 0 && baseBurn === 0 ? (
              <p className="text-text-secondary text-xs italic text-center py-4">Chưa có dữ liệu tập luyện</p>
            ) : (
              <ul className="space-y-0">
                {todayEntries.filter(e => e.type === 'exercise').map((entry) => (
                  <li key={entry.id} className="data-item-density group">
                    <div className="flex-1">
                      <div className="font-bold">{entry.name}</div>
                      <div className="item-meta-density">
                        {format(new Date(entry.timestamp), 'HH:mm')}
                        {entry.price ? ` • ${entry.price.toLocaleString()}đ` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-accent-out">-{entry.calories} kcal</div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onEdit(entry)}
                          className="p-1.5 text-neutral-300 hover:text-accent-net transition-colors opacity-0 group-hover:opacity-100"
                          title="Sửa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(entry.id)}
                          className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>


        {/* Right Column: Analysis */}
        <div className="lg:col-span-1">
          <div className="section-title">DỰ ĐOÁN THÁNG</div>
          <div className="card-density bg-slate-800 text-white border-none">
            <div className="text-[11px] opacity-70">Nếu duy trì phong độ này:</div>
            <div className="text-2xl font-bold my-2">
              {net > 0 ? '+' : ''}{(net * 30 / 7700).toFixed(1)} kg / tháng
            </div>
            <div className="text-[11px] text-accent-in font-bold">
              ★ {net < 0 ? 'Đang thâm hụt calo tốt' : 'Cần vận động nhiều hơn'}
            </div>
          </div>

          <div className="section-title mt-6">MỤC TIÊU NGÀY</div>
          <div className="card-density">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] font-bold text-text-secondary">TIẾN ĐỘ</span>
              <span className="text-[13px] font-bold">{Math.round(Math.min((net/target)*100, 100))}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-net rounded-full" 
                style={{ width: `${Math.min((net/target)*100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="section-title flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-rose-500" />
            <span>XU HƯỚNG CHI TIÊU</span>
          </div>
          <div className="flex p-1 bg-neutral-100 rounded-lg">
            {[7, 14, 30].map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p as any)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                  chartPeriod === p ? "bg-white text-rose-600 shadow-sm" : "text-text-secondary"
                )}
              >
                {p === 7 ? '7 NGÀY' : p === 14 ? '14 NGÀY' : '30 NGÀY'}
              </button>
            ))}
          </div>
        </div>
        <div className="card-density">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(value) => `${value.toLocaleString()}đ`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '12px' }}
                  formatter={(value: any) => [`${value.toLocaleString()}đ`, 'Chi phí']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Chi phí" 
                  stroke="#f43f5e" 
                  fillOpacity={1} 
                  fill="url(#colorSpending)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa dữ liệu"
        message="Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác."
      />
    </div>
  );
}

function StatCard({ title, value, unit, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-neutral-900">{value}</span>
          <span className="text-xs text-neutral-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
