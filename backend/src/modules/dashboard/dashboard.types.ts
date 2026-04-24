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

export interface InstructorStudentListItem {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  completedHours: number;
}

export type ScheduleCycleStatus =
  | "DRAFT"
  | "SENT_TO_STUDENTS"
  | "COLLECTING_RESPONSES"
  | "READY_TO_ALLOCATE"
  | "ALLOCATED"
  | "PUBLISHED";

export type LessonSessionState =
  | "PLANNED"
  | "START_CODE_ISSUED"
  | "ACTIVE"
  | "FAILED"
  | "COMPLETED";

export interface ScheduleBlueprintSlot {
  key: string;
  startTime: string;
  endTime: string;
}

export type ScheduleSlotBlueprint = Record<InstructorScheduleDayKey, ScheduleBlueprintSlot[]>;

export interface SendInstructorSchedulePayload {
  weekStartDate?: string;
  days: InstructorScheduleDays;
  slotBlueprint?: Partial<Record<InstructorScheduleDayKey, ScheduleBlueprintSlot[]>>;
}

export interface StudentAvailabilityPayload {
  cycleId: string;
  unavailableSlotKeys: Partial<Record<InstructorScheduleDayKey, string[]>>;
}
