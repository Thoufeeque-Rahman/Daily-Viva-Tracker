import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { GradingConfig } from "@/types";

export const useActiveGradingConfig = () => {
  return useQuery<GradingConfig | null>({
    queryKey: ["active-grading-config"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/grading-configs/active");
        return response.data;
      } catch (error) {
        console.error("Error fetching active grading config:", error);
        return null;
      }
    },
  });
};

// Default grading config if none is set
export const getDefaultGradingLevels = () => [
  { name: "Great", mark: 2, color: "#10B981", emoji: "😊" },
  { name: "Good", mark: 1, color: "#F59E0B", emoji: "🙂" },
  { name: "Poor", mark: 0, color: "#EF4444", emoji: "☹️" },
];