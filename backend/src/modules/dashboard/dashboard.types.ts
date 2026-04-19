export type SchoolRole = "SCHOOLADMIN" | "INSTRUCTOR" | "STUDENT";

export interface SchoolPersonInput {
  email: string;
  name: string;
  role: SchoolRole;
  instructorUserId?: string | null;
  hasInstructorPrivileges?: boolean;
}

export interface SchoolPersonListItem {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: SchoolRole;
  createdAt: string;
  hasInstructorProfile: boolean;
  studentInstructorUserId: string | null;
}

export type InstructorScheduleDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface InstructorScheduleDay {
  enabled: boolean;
  startTime: string;
  endTime: string;
  blockedLessonKeys: string[];
}

export type InstructorScheduleDays = Record<InstructorScheduleDayKey, InstructorScheduleDay>;

export interface InstructorSchedulePayload {
  days: InstructorScheduleDays;
}
