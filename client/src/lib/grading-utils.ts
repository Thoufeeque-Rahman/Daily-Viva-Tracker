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

export const getMarkCardColors = (mark: number, gradingLevels?: GradingLevel[]) => {
  const levels = gradingLevels || getDefaultGradingLevels();
  const level = levels.find(l => l.mark === mark);
  
  if (!level) {
    return {
      card: "bg-gradient-to-br from-gray-50 to-gray-100",
      header: "bg-gradient-to-r from-gray-500 to-gray-600",
      text: "text-gray-600",
      icon: "text-gray-600",
    };
  }

  // Convert hex color to card styling classes based on grading config
  const colorMap: Record<string, any> = {
    '#10B981': {
      card: "bg-gradient-to-br from-emerald-50 to-green-100",
      header: "bg-gradient-to-r from-emerald-500 to-green-600",
      text: "text-emerald-600",
      icon: "text-emerald-600",
    },
    '#F59E0B': {
      card: "bg-gradient-to-br from-yellow-50 to-amber-100",
      header: "bg-gradient-to-r from-yellow-500 to-amber-600",
      text: "text-yellow-600",
      icon: "text-yellow-600",
    },
    '#EF4444': {
      card: "bg-gradient-to-br from-rose-50 to-red-100",
      header: "bg-gradient-to-r from-rose-500 to-red-600",
      text: "text-rose-600",
      icon: "text-rose-600",
    },
    '#3B82F6': {
      card: "bg-gradient-to-br from-blue-50 to-indigo-100",
      header: "bg-gradient-to-r from-blue-600 to-indigo-600",
      text: "text-blue-600",
      icon: "text-blue-600",
    },
    '#8B5CF6': {
      card: "bg-gradient-to-br from-purple-50 to-purple-100",
      header: "bg-gradient-to-r from-purple-500 to-purple-600",
      text: "text-purple-600",
      icon: "text-purple-600",
    },
    '#EC4899': {
      card: "bg-gradient-to-br from-pink-50 to-pink-100",
      header: "bg-gradient-to-r from-pink-500 to-pink-600",
      text: "text-pink-600",
      icon: "text-pink-600",
    },
  };

  return level.color
//   return colorMap[level.color] || {
//     card: `bg-gradient-to-br from-[${level.color}/90] to-[${level.color}]`,
//     header: "bg-gradient-to-r from-gray-500 to-gray-600",
//     text: `text-[${level.color.toString()}]`,
//     icon: "text-gray-600",
//   };
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