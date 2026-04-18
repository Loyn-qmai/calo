import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
  totalCalories: number;
  tips: string;
}

export function createMealPlanChat(profile: UserProfile | null) {
  const targetCals = profile?.targetCalories || 2000;
  
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `Bạn là trợ lý dinh dưỡng chuyên nghiệp cho ứng dụng "TÔI SẼ GẦY". 
      Mục tiêu của người dùng là ${targetCals} calo mỗi ngày. 
      Nhiệm vụ của bạn là giúp người dùng lên thực đơn và điều chỉnh thực đơn theo ý muốn của họ.
      Khi người dùng yêu cầu thực đơn hoặc thay đổi thực đơn, hãy luôn cung cấp một thông tin chi tiết bao gồm Bữa sáng, Bữa trưa, Bữa tối, Bữa phụ và Tổng calo.
      Nếu có bất kỳ món ăn nào người dùng không thể chuẩn bị, hãy nhiệt tình gợi ý món thay thế tương đương dinh dưỡng.
      Giao tiếp bằng tiếng Việt thân thiện, chuyên nghiệp, động viên.`,
    },
  });
}

export async function generateMealPlan(profile: UserProfile | null, preferences?: string): Promise<MealPlan> {
  const targetCals = profile?.targetCalories || 2000;
  
  const prompt = `Generate a healthy daily meal plan for someone with a target of ${targetCals} calories. 
  ${preferences ? `Specific user preferences/requirements: ${preferences}` : ""}
  The response must be in Vietnamese.
  Include breakfast, lunch, dinner, and snacks. 
  Provide a helpful nutrition tip related to weight loss or healthy eating.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          breakfast: { type: Type.STRING, description: "Bữa sáng" },
          lunch: { type: Type.STRING, description: "Bữa trưa" },
          dinner: { type: Type.STRING, description: "Bữa tối" },
          snacks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Bữa phụ"
          },
          totalCalories: { type: Type.NUMBER, description: "Tổng calo ước tính" },
          tips: { type: Type.STRING, description: "Lời khuyên dinh dưỡng" }
        },
        required: ["breakfast", "lunch", "dinner", "snacks", "totalCalories", "tips"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Không thể tạo thực đơn lúc này.");
  }

  return JSON.parse(response.text.trim());
}
