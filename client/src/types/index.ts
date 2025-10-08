export interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  adNumber: string;
  photoUrl?: string;
  classId?: number;
  class?: number;
  dvtMarks?: Array<{
    subject: string;
    mark: number;
    date: string;
    punishment?: string;
  }>;
}

export interface DvtMark {
  _id: string;
  studentId: string;
  subject: string;
  mark: number;
  punishment?: string;
  date: string;
  class: number;
}

export interface SubjectInfo {
  subject: string;
  class: number;
}

export interface ClassInfo {
  id: number;
  name: string;
}

export interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone: string;
  qualification?: string;
  role: "teacher" | "super_admin";
  subjectsTaught?: Array<{
    _id?: string;
    class: number;
    subject: string;
    periodsInSemester?: number;
  }>;
  joinedAt?: string;
  active: boolean;
}

export type User = Teacher;

export interface GradingConfig {
  _id: string;
  name: string;
  levels: string[];
  isActive: boolean;
  createdAt: string;
} 