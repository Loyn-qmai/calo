import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { EntryType, CalorieEntry, OperationType } from '../types';
import { handleFirestoreError, cn } from '../lib/utils';
import { format } from 'date-fns';
import { Utensils, Dumbbell, Plus, Trash2, Search, Sparkles, Loader2, Pencil, X } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { ConfirmModal } from './ui/ConfirmModal';

interface EntryFormProps {
  user: User;
  entries: CalorieEntry[];
  editingEntry?: CalorieEntry | null;
  onCancelEdit?: () => void;
}

export default function EntryForm({ user, entries, editingEntry, onCancelEdit }: EntryFormProps) {
  const [type, setType] = useState<EntryType>('food');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [localEditingId, setLocalEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (editingEntry) {
      setType(editingEntry.type);
      setName(editingEntry.name);
      setCalories(editingEntry.calories.toString());
      setPrice(editingEntry.price?.toString() || '');
      setLocalEditingId(editingEntry.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingEntry]);

  const handleStartEdit = (entry: CalorieEntry) => {
    setType(entry.type);
    setName(entry.name);
    setCalories(entry.calories.toString());
    setPrice(entry.price?.toString() || '');
    setLocalEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setLocalEditingId(null);
    setName('');
    setCalories('');
    setPrice('');
    if (onCancelEdit) onCancelEdit();
  };

  const calculateWithAI = async () => {
    if (!name.trim()) return;
    
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Ước tính lượng calo ${type === 'food' ? 'và giá tiền trung bình (VNĐ)' : ''} cho ${type === 'food' ? 'món ăn' : 'hoạt động'} sau: "${name}". Trả về kết quả dưới dạng JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: {
                type: Type.INTEGER,
                description: "Lượng calo ước tính",
              },
              price: {
                type: Type.INTEGER,
                description: "Giá tiền ước tính bằng VNĐ (chỉ cho món ăn)",
              },
            },
            required: ["calories"],
          },
        },
      });

      const result = JSON.parse(response.text);
      if (result.calories) {
        setCalories(result.calories.toString());
      }
      if (result.price && type === 'food') {
        setPrice(result.price.toString());
      }
    } catch (error) {
      console.error("AI Calculation failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;

    setLoading(true);
    const now = new Date();
    
    try {
      if (localEditingId) {
        const entryRef = doc(db, `users/${user.uid}/entries`, localEditingId);
        await updateDoc(entryRef, {
          type,
          name,
          calories: Number(calories),
          price: price ? Number(price) : 0,
        });
        handleCancelEdit();
      } else {
        const entryData = {
          userId: user.uid,
          type,
          name,
          calories: Number(calories),
          price: price ? Number(price) : 0,
          timestamp: now.toISOString(),
          dateStr: format(now, 'yyyy-MM-dd'),
        };
        await addDoc(collection(db, `users/${user.uid}/entries`), entryData);
        setName('');
        setCalories('');
        setPrice('');
      }
    } catch (error) {
      handleFirestoreError(
        error, 
        localEditingId ? OperationType.UPDATE : OperationType.CREATE, 
        `users/${user.uid}/entries${localEditingId ? `/${localEditingId}` : ''}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/entries`, deleteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/entries/${deleteId}`);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="section-title">
          {localEditingId ? 'CHỈNH SỬA DỮ LIỆU' : 'THÊM MỚI DỮ LIỆU'}
        </div>
        <div className="card-density">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex p-1 bg-neutral-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('food')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[12px] font-bold transition-all",
                  type === 'food' ? "bg-white text-accent-in shadow-sm" : "text-text-secondary"
                )}
              >
                <Utensils className="w-3.5 h-3.5" />
                THỨC ĂN
              </button>
              <button
                type="button"
                onClick={() => setType('exercise')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[12px] font-bold transition-all",
                  type === 'exercise' ? "bg-white text-accent-out shadow-sm" : "text-text-secondary"
                )}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                TẬP LUYỆN
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Tên hoạt động/món ăn</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'food' ? "Ví dụ: Phở bò" : "Ví dụ: Chạy bộ"}
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Lượng calo (kcal)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={calculateWithAI}
                  disabled={aiLoading || !name.trim()}
                  className="px-3 py-2 bg-accent-net/10 text-accent-net hover:bg-accent-net/20 disabled:bg-neutral-100 disabled:text-neutral-400 rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap"
                  title="Tính bằng AI"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  AI TÍNH
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Giá tiền (VNĐ - Tùy chọn)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-neutral-50 border border-border rounded-lg text-[13px] outline-none focus:border-accent-net transition-all"
              />
            </div>

            <div className="flex gap-2">
              {localEditingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-text-secondary text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  HỦY
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex-[2] py-2.5 text-white text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                  localEditingId ? "bg-accent-net hover:bg-orange-600" : "bg-text-primary hover:bg-neutral-800",
                  loading && "bg-neutral-300"
                )}
              >
                {localEditingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {loading ? 'ĐANG LƯU...' : localEditingId ? 'CẬP NHẬT' : 'LƯU DỮ LIỆU'}
              </button>
            </div>
          </form>
        </div>
      </div>


      <div className="lg:col-span-2 space-y-6">
        <div className="section-title">
          <span>LỊCH SỬ NHẬP LIỆU</span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-8 pr-3 py-1 bg-white border border-border rounded-md text-[11px] outline-none focus:border-accent-net transition-all w-40"
            />
          </div>
        </div>

        <div className="card-density p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left bg-neutral-50 border-b border-border">
                  <th className="px-4 py-2.5 text-[11px] font-bold text-text-secondary uppercase">Thời gian</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-text-secondary uppercase">Loại</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-text-secondary uppercase">Tên</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-text-secondary uppercase text-right">Calo</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-text-secondary uppercase text-right">Giá tiền</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-text-secondary uppercase text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-secondary italic">
                      Không tìm thấy dữ liệu nào
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-text-secondary">
                        {format(new Date(entry.timestamp), 'dd/MM HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          entry.type === 'food' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                        )}>
                          {entry.type === 'food' ? 'ĂN' : 'TẬP'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-text-primary">{entry.name}</td>
                      <td className={cn(
                        "px-4 py-3 text-right font-bold",
                        entry.type === 'food' ? "text-text-primary" : "text-accent-out"
                      )}>
                        {entry.type === 'food' ? `+${entry.calories}` : `-${entry.calories}`}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">
                        {entry.price ? `${entry.price.toLocaleString()}đ` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(entry)}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
