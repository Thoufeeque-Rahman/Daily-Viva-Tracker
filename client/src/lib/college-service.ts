import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

export interface College {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  establishedYear?: number;
  principalName?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollegeData {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  establishedYear?: number;
  principalName?: string;
  website?: string;
}

export interface CollegeStats {
  college: string;
  totalStudents: number;
  totalTeachers: number;
  totalEvaluations: number;
}

class CollegeService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    };
  }

  async getAllColleges(): Promise<College[]> {
    const response = await axios.get(`${BASE_URL}/api/colleges`, this.getAuthHeaders());
    return response.data;
  }

  async getCollege(id: string): Promise<College> {
    const response = await axios.get(`${BASE_URL}/api/colleges/${id}`, this.getAuthHeaders());
    return response.data;
  }

  async createCollege(data: CreateCollegeData): Promise<College> {
    const response = await axios.post(`${BASE_URL}/api/colleges`, data, this.getAuthHeaders());
    return response.data;
  }

  async updateCollege(id: string, data: Partial<CreateCollegeData>): Promise<College> {
    const response = await axios.put(`${BASE_URL}/api/colleges/${id}`, data, this.getAuthHeaders());
    return response.data;
  }

  async deleteCollege(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/api/colleges/${id}`, this.getAuthHeaders());
  }

  async getCollegeStats(id: string): Promise<CollegeStats> {
    const response = await axios.get(`${BASE_URL}/api/colleges/${id}/stats`, this.getAuthHeaders());
    return response.data;
  }
}

export const collegeService = new CollegeService();