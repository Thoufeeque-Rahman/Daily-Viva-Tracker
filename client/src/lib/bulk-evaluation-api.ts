import api from "@/lib/axios";

export interface BulkEvaluationData {
  studentId: string;
  evaluation: string;
  mark: number;
}

export interface IndividualEvaluationData {
  studentId: string;
  evaluation: string;
  mark: number;
  subject: string;
  class: number;
  tId: string;
}

export interface BulkBatchEvaluationData {
  evaluations: BulkEvaluationData[];
  subject: string;
  class: number;
  tId: string;
}

// Batch Mode: Save multiple evaluations at once
export const saveBulkBatchEvaluations = async (data: BulkBatchEvaluationData) => {
  try {
    const response = await api.post("/api/dvtmarks/bulk-batch", data);
    return response.data;
  } catch (error: any) {
    console.error("Bulk batch evaluation error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to save bulk evaluations"
    );
  }
};

// Individual Mode: Save single evaluation immediately
export const saveIndividualEvaluation = async (data: IndividualEvaluationData) => {
  try {
    const response = await api.post("/api/dvtmarks/bulk-individual", data);
    return response.data;
  } catch (error: any) {
    console.error("Individual evaluation error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to save evaluation"
    );
  }
};