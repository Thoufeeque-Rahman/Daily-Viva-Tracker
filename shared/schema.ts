import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  subjectsTaught: text("subjects_taught").array(), // Array of subjects taught
  role: text("role").notNull().default("teacher"), // teacher, super_admin
  qualification: text("qualification"),
  joinedAt: timestamp("joined_at").defaultNow(),
  active: boolean("active").default(true),
  // classesAssigned: text("classes_assigned").array(), // Array of classes assigned
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Classes table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
});

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
});

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Students table
export const students = pgTable("students", {
  _id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull(),
  adNumber: text("ad_number").notNull().unique(),
  photoUrl: text("photo_url"),
  classId: integer("class_id").notNull(),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  _id: true,
  name: true,
  rollNumber: true,
  adNumber: true,
  photoUrl: true,
  classId: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Evaluations table
export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  mark: integer("mark").notNull(), // 0: Poor, 1: Good, 2: Great
  punishment: text("punishment"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertEvaluationSchema = createInsertSchema(evaluations).pick({
  studentId: true,
  classId: true,
  subjectId: true,
  mark: true,
  punishment: true,
});

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

// Semesters table
export const semesters = pgTable("semesters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSemesterSchema = createInsertSchema(semesters).pick({
  name: true,
  startDate: true,
  endDate: true,
});

export type InsertSemester = z.infer<typeof insertSemesterSchema>;
export type Semester = typeof semesters.$inferSelect;

// Grading configuration table
export const gradingConfig = pgTable("grading_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  levels: text("levels").array().notNull(), // Array of grade levels like ["Poor", "Good", "Great"]
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGradingConfigSchema = createInsertSchema(gradingConfig).pick({
  name: true,
  levels: true,
});

export type InsertGradingConfig = z.infer<typeof insertGradingConfigSchema>;
export type GradingConfig = typeof gradingConfig.$inferSelect;
