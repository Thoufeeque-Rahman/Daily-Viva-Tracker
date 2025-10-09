import { GradingLevel } from "@/types";
import { getDefaultGradingLevels } from "@/hooks/use-grading-config";

export const getMarkLabel = (mark: number, gradingLevels?: GradingLevel[]): string => {
  const levels = gradingLevels || getDefaultGradingLevels();
  const level = levels.find(l => l.mark === mark);
  return level ? level.name : `Mark ${mark}`;
};

export const getMarkColors = (mark: number, gradingLevels?: GradingLevel[]) => {
  const levels = gradingLevels || getDefaultGradingLevels();
  const level = levels.find(l => l.mark === mark);
  
  if (!level) {
    return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" };
  }

  // Convert hex color to Tailwind classes
  const colorMap: Record<string, any> = {
    '#10B981': { bg: "bg-green-100", text: "text-green-600", border: "border-green-300" },
    '#F59E0B': { bg: "bg-yellow-100", text: "text-yellow-600", border: "border-yellow-300" },
    '#EF4444': { bg: "bg-red-100", text: "text-red-600", border: "border-red-300" },
    '#3B82F6': { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-300" },
    '#8B5CF6': { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-300" },
    '#EC4899': { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-300" },
  };

  return colorMap[level.color] || { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" };
};

export const getMarkEmoji = (mark: number, gradingLevels?: GradingLevel[]): string => {
  const levels = gradingLevels || getDefaultGradingLevels();
  const level = levels.find(l => l.mark === mark);
  
  if (level?.emoji) return level.emoji;
  
  // Default emojis based on mark
  const name = level?.name.toLowerCase() || '';
  if (name.includes('great') || name.includes('excellent')) return '😊';
  if (name.includes('good') || name.includes('average')) return '🙂';
  if (name.includes('poor') || name.includes('bad')) return '☹️';
  return '😐';
};