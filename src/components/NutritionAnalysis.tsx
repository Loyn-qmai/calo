import React, { useState } from 'react';
import { CalorieEntry } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { Sparkles, Loader2, Apple, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';
import { subDays, isAfter } from 'date-fns';

interface NutritionAnalysisProps {
  entries: CalorieEntry[];
}

interface AnalysisResult {
  summary: string;
  missingNutrients: {
    name: string;
    reason: string;
    importance: string;
  }[];
  suggestions: {
    food: string;
    nutrients: string;
    benefit: string;
  }[];
  score: number;
}

export default function NutritionAnalysis({ entries }: NutritionAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeNutrition = async () => {
    setLoading(true);
    try {
      // Filter entries from last 7 days
      const lastWeek = subDays(new Date(), 7);
      const recentEntries = entries.filter(e => isAfter(new Date(e.timestamp), lastWeek));
      
      const entrySummary = recentEntries.map(e => 
        `${e.type === 'food' ? 'Ăn' : 'Tập'}: ${e.name} (${e.calories} kcal)`
      ).join('\n');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Dựa trên nhật ký ăn uống và tập luyện trong 1 tuần qua của tôi, hãy phân tích tình trạng dinh dưỡng và đưa ra gợi ý. 
        
        Nhật ký:
        ${entrySummary || "Chưa có dữ liệu."}
        
        Hãy trả về kết quả dưới dạng JSON với cấu trúc sau:
        {
          "summary": "Tóm tắt ngắn gọn tình trạng dinh dưỡng",
          "missingNutrients": [{"name": "Tên chất", "reason": "Tại sao thiếu", "importance": "Tầm quan trọng"}],
          "suggestions": [{"food": "Tên món ăn", "nutrients": "Chất dinh dưỡng cung cấp", "benefit": "Lợi ích"}],
          "score": 0-100 (Điểm sức khỏe dựa trên nhật ký)
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              missingNutrients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    importance: { type: Type.STRING },
                  },
                  required: ["name", "reason", "importance"]
                }
              },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    food: { type: Type.STRING },
                    nutrients: { type: Type.STRING },
                    benefit: { type: Type.STRING },
                  },
                  required: ["food", "nutrients", "benefit"]
                }
              },
              score: { type: Type.INTEGER }
            },
            required: ["summary", "missingNutrients", "suggestions", "score"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-title flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent-net" />
        <span>PHÂN TÍCH DINH DƯỠNG AI</span>
      </div>

      <div className="card-density bg-slate-900 text-white border-none p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Khám phá sức khỏe của bạn</h2>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            Sử dụng trí tuệ nhân tạo để phân tích nhật ký ăn uống của bạn trong 7 ngày qua và nhận những lời khuyên cá nhân hóa.
          </p>
          <button
            onClick={analyzeNutrition}
            disabled={loading}
            className="px-6 py-3 bg-accent-net hover:bg-orange-600 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {loading ? 'ĐANG PHÂN TÍCH...' : 'BẮT ĐẦU PHÂN TÍCH'}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-net/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            {/* Summary & Score */}
            <div className="card-density flex items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-neutral-100"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-accent-net"
                    strokeWidth="3"
                    strokeDasharray={`${result.score}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{result.score}</span>
                  <span className="text-[8px] font-bold text-text-secondary uppercase">Điểm</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Tóm tắt sức khỏe</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              <div className="section-title flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>GỢI Ý THỰC ĐƠN BỔ SUNG</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="card-density border-l-4 border-l-accent-net">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Apple className="w-4 h-4 text-accent-net" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{s.food}</div>
                        <div className="text-[10px] font-bold text-accent-net uppercase mb-1">{s.nutrients}</div>
                        <p className="text-xs text-text-secondary">{s.benefit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Missing Nutrients */}
            <div className="section-title flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>CHẤT CẦN BỔ SUNG</span>
            </div>
            <div className="space-y-3">
              {result.missingNutrients.map((n, i) => (
                <div key={i} className="card-density">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="font-bold text-sm">{n.name}</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{n.reason}</p>
                  <div className="p-2 bg-neutral-50 rounded text-[10px] text-text-secondary italic">
                    <span className="font-bold text-rose-600 not-italic">Tầm quan trọng: </span>
                    {n.importance}
                  </div>
                </div>
              ))}
            </div>

            {/* Success Note */}
            <div className="card-density bg-green-50 border-green-100">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold text-xs uppercase">Lời khuyên</span>
              </div>
              <p className="text-xs text-green-600 leading-relaxed">
                Duy trì việc nhập liệu đều đặn để AI có thể đưa ra những phân tích chính xác nhất cho sức khỏe của bạn.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
