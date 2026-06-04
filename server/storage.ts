import { 
  users, 
  type User, 
  type InsertUser,
  classes,
  type Class, 
  type InsertClass,
  subjects,
  type Subject,
  type InsertSubject,
  students,
  type Student,
  type InsertStudent,
  evaluations,
  type Evaluation,
  type InsertEvaluation
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Class methods
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classItem: InsertClass): Promise<Class>;
  
  // Subject methods
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Student methods
  getStudents(): Promise<Student[]>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Evaluation methods
  getEvaluations(): Promise<Evaluation[]>;
  getEvaluationsByClass(classId: number): Promise<Evaluation[]>;
  getEvaluationsBySubject(subjectId: number): Promise<Evaluation[]>;
  getEvaluationsByStudent(studentId: number): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private classesMap: Map<number, Class>;
  private subjectsMap: Map<number, Subject>;
  private studentsMap: Map<number, Student>;
  private evaluationsMap: Map<number, Evaluation>;
  
  private userCurrentId: number;
  private classCurrentId: number;
  private subjectCurrentId: number;
  private studentCurrentId: number;
  private evaluationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.classesMap = new Map();
    this.subjectsMap = new Map();
    this.studentsMap = new Map();
    this.evaluationsMap = new Map();
    
    this.userCurrentId = 1;
    this.classCurrentId = 1;
    this.subjectCurrentId = 1;
    this.studentCurrentId = 1;
    this.evaluationCurrentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Add some default classes
    const classes = ['Class 10A', 'Class 10B', 'Class 11A', 'Class 11B'];
    classes.forEach(className => {
      this.createClass({ name: className });
    });
    
    // Add some default subjects
    const subjects = ['Manthiq 10', 'Jamul Javami 10', 'Maths 6', 'English 5', 'Hindi 3', 'Science 2', 'Social Science 9'];
    subjects.forEach(subjectName => {
      this.createSubject({ name: subjectName });
    });
    
    // Add some sample students for each class
    const studentNames = [
      'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Singh', 
      'Vikram Reddy', 'Ananya Gupta', 'Raj Malhotra', 'Neha Verma'
    ];
    
    for (let classId = 1; classId <= 4; classId++) {
      studentNames.forEach((name, index) => {
        const rollNumber = `${(index + 1).toString().padStart(2, '0')}`;
        const admissionNumber = `A${classId}${rollNumber}`;
        
        this.createStudent({
          name,
          rollNumber,
          admissionNumber,
          photoUrl: null,
          classId
        });
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Class methods
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classesMap.values());
  }
  
  async getClass(id: number): Promise<Class | undefined> {
    return this.classesMap.get(id);
  }
  
  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = this.classCurrentId++;
    const classItem: Class = { ...insertClass, id };
    this.classesMap.set(id, classItem);
    return classItem;
  }
  
  // Subject methods
  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjectsMap.values());
  }
  
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjectsMap.get(id);
  }
  
  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.subjectCurrentId++;
    const subject: Subject = { ...insertSubject, id };
    this.subjectsMap.set(id, subject);
    return subject;
  }
  
  // Student methods
  async getStudents(): Promise<Student[]> {
    return Array.from(this.studentsMap.values());
  }
  
  async getStudentsByClass(classId: number): Promise<Student[]> {
    return Array.from(this.studentsMap.values()).filter(
      (student) => student.classId === classId
    );
  }
  
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsMap.get(id);
  }
  
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.studentCurrentId++;
    const student: Student = { ...insertStudent, id };
    this.studentsMap.set(id, student);
    return student;
  }
  
  // Evaluation methods
  async getEvaluations(): Promise<Evaluation[]> {
    return Array.from(this.evaluationsMap.values());
  }
  
  async getEvaluationsByClass(classId: number): Promise<Evaluation[]> {
    return Array.from(this.evaluationsMap.values()).filter(
      (evaluation) => evaluation.classId === classId
    );
  }
  
  async getEvaluationsBySubject(subjectId: number): Promise<Evaluation[]> {
    return Array.from(this.evaluationsMap.values()).filter(
      (evaluation) => evaluation.subjectId === subjectId
    );
  }
  
  async getEvaluationsByStudent(studentId: number): Promise<Evaluation[]> {
    return Array.from(this.evaluationsMap.values()).filter(
      (evaluation) => evaluation.studentId === studentId
    );
  }
  
  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const id = this.evaluationCurrentId++;
    const timestamp = new Date();
    const evaluation: Evaluation = { ...insertEvaluation, id, timestamp };
    this.evaluationsMap.set(id, evaluation);
    return evaluation;
  }
}

export const storage = new MemStorage();
