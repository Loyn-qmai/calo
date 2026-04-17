import React, { useMemo } from 'react';
import { CalorieEntry, UserProfile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, isSameDay, subMonths } from 'date-fns';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportsProps {
  entries: CalorieEntry[];
  profile: UserProfile | null;
}

export default function Reports({ entries, profile }: ReportsProps) {
  const [period, setPeriod] = React.useState<'week' | 'month'>('week');

  const chartData = useMemo(() => {
    const end = new Date();
    const start = period === 'week' ? subDays(end, 6) : subMonths(end, 1);
    
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayEntries = entries.filter(e => isSameDay(new Date(e.timestamp), day));
      const food = dayEntries.filter(e => e.type === 'food').reduce((acc, curr) => acc + curr.calories, 0);
      const exercise = dayEntries.filter(e => e.type === 'exercise').reduce((acc, curr) => acc + curr.calories, 0);
      const net = food - exercise;
      
      return {
        date: format(day, period === 'week' ? 'EEE' : 'dd/MM'),
        fullDate: format(day, 'dd/MM/yyyy'),
        'Ăn vào': food,
        'Tiêu thụ': exercise,
        'Thực tế': net,
        'Chi phí': dayEntries.reduce((acc, curr) => acc + (curr.price || 0), 0),
        'Mục tiêu': profile?.targetCalories || 2000
      };
    });
  }, [entries, period, profile]);

  const exportToExcel = () => {
    const data = entries.map(e => ({
      'Ngày': format(new Date(e.timestamp), 'dd/MM/yyyy'),
      'Giờ': format(new Date(e.timestamp), 'HH:mm'),
      'Loại': e.type === 'food' ? 'Thức ăn' : 'Tập luyện',
      'Tên': e.name,
      'Calo (kcal)': e.calories,
      'Giá tiền (VNĐ)': e.price || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calo History");
    XLSX.writeFile(wb, `CaloTrack_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const totalCost = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr['Chi phí'], 0);
  }, [chartData]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="section-title w-full">
          <span>BÁO CÁO & PHÂN TÍCH</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-rose-100 mr-2">
            TỔNG CHI PHÍ: {totalCost.toLocaleString()}đ
          </div>
          <div className="flex p-1 bg-neutral-100 rounded-lg mr-2">
            <button
              onClick={() => setPeriod('week')}
              className={cn(
                "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                period === 'week' ? "bg-white text-accent-net shadow-sm" : "text-text-secondary"
              )}
            >
              TUẦN
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={cn(
                "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                period === 'month' ? "bg-white text-accent-net shadow-sm" : "text-text-secondary"
              )}
            >
              THÁNG
            </button>
          </div>
          <button
            onClick={exportToExcel}
            className="btn-density btn-density-primary flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            XUẤT EXCEL
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <div className="section-title">BIỂU ĐỒ CALO</div>
        <div className="card-density">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
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
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [
                    name === 'Chi phí' ? `${value.toLocaleString()}đ` : value,
                    name
                  ]}
                />
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                <Area 
                  type="monotone" 
                  dataKey="Ăn vào" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorIn)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="Chi phí" 
                  stroke="#f43f5e" 
                  fillOpacity={0} 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="Thực tế" 
                  stroke="#f97316" 
                  fillOpacity={1} 
                  fill="url(#colorNet)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="Mục tiêu" 
                  stroke="#a855f7" 
                  strokeDasharray="5 5" 
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="section-title">SO SÁNH ĂN VÀO VS TIÊU THỤ</div>
        <div className="card-density">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                <Bar dataKey="Ăn vào" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={20} />
                <Bar dataKey="Tiêu thụ" fill="#10b981" radius={[2, 2, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
