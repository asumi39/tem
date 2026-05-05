export type CurrentUserRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  role: CurrentUserRole;
}

export class UnauthenticatedError extends Error {
  constructor(message = "Unauthenticated") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export const demoStudentUser: CurrentUser = {
  id: process.env.DEMO_STUDENT_USER_ID ?? "student-demo",
  email: process.env.DEMO_STUDENT_EMAIL ?? "student@example.com",
  role: "STUDENT"
};

export function isDemoAuthEnabled(): boolean {
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  return process.env.DEMO_AUTH_ENABLED === "true" || process.env.NODE_ENV !== "production";
}

export async function getCurrentUser(): Promise<CurrentUser> {
  if (isDemoAuthEnabled()) {
    return demoStudentUser;
  }

  throw new UnauthenticatedError();
}

export function assertStudentUser(user: CurrentUser): void {
  if (user.role !== "STUDENT") {
    throw new Error("Student access required");
  }
}

export function assertTeacherUser(user: CurrentUser): void {
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    throw new Error("Teacher access required");
  }
}

export function isTeacherOrAdmin(user: CurrentUser): boolean {
  return user.role === "TEACHER" || user.role === "ADMIN";
}

export const demoTeacherUser: CurrentUser = {
  id: process.env.DEMO_TEACHER_USER_ID ?? "teacher-demo",
  email: process.env.DEMO_TEACHER_EMAIL ?? "teacher@example.com",
  role: "TEACHER"
};
