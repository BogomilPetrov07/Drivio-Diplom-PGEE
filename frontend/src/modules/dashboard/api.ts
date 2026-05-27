import axios from 'axios'
import api from '../../services/api'

export interface SchoolJoinRequest {
  id: string
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  contactName: string
  contactEmail: string
  status: string
  createdAt: string
}

export async function fetchPendingSchoolJoinRequests() {
  const { data } = await api.get<{ requests: SchoolJoinRequest[] }>('/onboarding/pending')
  return data.requests
}

export async function approveSchoolJoinRequest(requestId: string) {
  const { data } = await api.post<{ message: string }>('/onboarding/approve', { requestId })
  return data
}

export interface SupportThread {
  id: string
  source: 'PUBLIC' | 'USER_DASHBOARD' | 'EMAIL'
  requesterName: string
  requesterEmail: string
  status: 'OPEN' | 'WAITING_USER' | 'CLOSED'
  createdAt: string
  updatedAt: string
  lastMessageAt: string
  latestMessagePreview: string
  ticketSubject?: string
  latestSenderType?: 'USER' | 'SUPERADMIN' | 'SYSTEM' | null
  latestMessageAt?: string | null
  canReopen?: boolean
}

export interface SupportMessage {
  id: string
  threadId: string
  senderType: 'USER' | 'SUPERADMIN' | 'SYSTEM'
  senderName: string
  senderEmail: string | null
  via: 'APP' | 'EMAIL' | 'WEB'
  body: string
  createdAt: string
}

export interface DashboardNotification {
  id: string
  type: string
  title: string | null
  body: string | null
  read: boolean
  createdAt: string
  metadata?: unknown
}

export interface SchoolDetails {
  id: string
  name: string
  region: string
  city: string
  address: string
  phone: string
  rating: number
  createdAt: string
  updatedAt: string
}

export type SchoolPersonRole = 'SCHOOLADMIN' | 'INSTRUCTOR' | 'STUDENT'

export interface SchoolPerson {
  id: string
  username: string
  email: string | null
  name: string | null
  role: SchoolPersonRole
  createdAt: string
  hasInstructorProfile: boolean
  studentInstructorUserId: string | null
}

export interface InstructorStudent {
  id: string
  username: string
  email: string | null
  name: string | null
  createdAt: string
  completedHours: number
}

export interface InstructorStudentsResponse {
  students: InstructorStudent[]
  totalStudents: number
  maxStudents: number
}

export interface SchoolCar {
  id: string
  licensePlate: string
  isAvailable: boolean
  ptiExpireDate: string
  vignetteExpireDate: string
}

export interface SchoolCarPayload {
  licensePlate: string
  isAvailable: boolean
  ptiExpireDate: string
  vignetteExpireDate: string
}

export interface StudentProgressLesson {
  id: string
  startTime: string
  endTime: string
  completedAt: string
  notes: string | null
  rating: number | null
}

export interface StudentProgressSummary {
  completedHours: number
  requiredHours: number
  remainingHours: number
  completionPercent: number
  completedLessons: StudentProgressLesson[]
}

export interface StudentInstructorSummary {
  instructor: {
    userId: string
    name: string | null
    username: string
    email: string | null
  } | null
  school: {
    id: string
    name: string
    rating: number
    address: string
    phone: string
  } | null
  completedHours: number
  requiredHours: number
}

export interface InstructorDaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
  blockedLessonKeys: string[]
}

export interface InstructorSchedule {
  days: {
    monday: InstructorDaySchedule
    tuesday: InstructorDaySchedule
    wednesday: InstructorDaySchedule
    thursday: InstructorDaySchedule
    friday: InstructorDaySchedule
    saturday: InstructorDaySchedule
    sunday: InstructorDaySchedule
  }
}

export type DayKey = keyof InstructorSchedule['days']

export interface ScheduleBlueprintSlot {
  key: string
  startTime: string
  endTime: string
}

export type ScheduleSlotBlueprint = Record<DayKey, ScheduleBlueprintSlot[]>

export type ScheduleCycleStatus =
  | 'DRAFT'
  | 'SENT_TO_STUDENTS'
  | 'COLLECTING_RESPONSES'
  | 'READY_TO_ALLOCATE'
  | 'ALLOCATED'
  | 'PUBLISHED'

export type LessonSessionState =
  | 'PLANNED'
  | 'START_CODE_ISSUED'
  | 'ACTIVE'
  | 'FAILED'
  | 'COMPLETED'

export interface InstructorScheduleCycle {
  id: string
  status: ScheduleCycleStatus
  weekStartDate: string
  days: InstructorSchedule['days']
  slotBlueprint: ScheduleSlotBlueprint
  sentAt: string | null
  allocationStartedAt: string | null
  allocationCompletedAt: string | null
  publishedAt: string | null
}

export interface InstructorScheduleWorkflow {
  cycle: InstructorScheduleCycle | null
  expectedReplies: number
  repliesReceived: number
  allocatedSlots: number
  weekStartDate: string
}

export interface StudentScheduleCycle {
  cycle: {
    id: string
    status: ScheduleCycleStatus
    weekStartDate: string
    sentAt: string | null
  }
  days: InstructorSchedule['days']
  slotBlueprint: ScheduleSlotBlueprint
  reply: {
    unavailableSlotKeys: Record<DayKey, string[]>
    submittedAt: string | null
  }
  assignedSlots: Array<{
    id: string
    startTime: string
    endTime: string
    dayKey: string | null
    slotKey: string | null
    isDone: boolean
    state: LessonSessionState
  }>
}

export interface LessonListItem {
  id: string
  startTime: string
  endTime: string
  dayKey: string | null
  slotKey: string | null
  isDone: boolean
  state: LessonSessionState
  studentId?: string | null
  studentUserId?: string | null
  studentName?: string | null
  studentUsername?: string | null
  instructorId?: string | null
}

export interface LessonCandidateStudent {
  profileId: string
  userId: string
  name: string | null
  username: string | null
  completedHours?: number
}

export interface LessonCandidatesDetails {
  assignedStudent: LessonCandidateStudent | null
  candidates: LessonCandidateStudent[]
}

export interface SchoolPersonPayload {
  email: string
  name: string
  role: SchoolPersonRole
  instructorUserId?: string | null
  hasInstructorPrivileges?: boolean
}

export async function fetchSchoolDetails() {
  const { data } = await api.get<{ school: SchoolDetails }>('/dashboard/school-admin/school')
  return data.school
}

export async function updateSchoolDetails(payload: Pick<SchoolDetails, 'name' | 'region' | 'city' | 'address' | 'phone' | 'rating'>) {
  const { data } = await api.patch<{ school: SchoolDetails }>('/dashboard/school-admin/school', payload)
  return data.school
}

export async function fetchSchoolPeople() {
  const { data } = await api.get<{ people: SchoolPerson[] }>('/dashboard/school-admin/people')
  return data.people
}

export async function fetchSchoolCars() {
  const { data } = await api.get<{ cars: SchoolCar[] }>('/dashboard/school-admin/cars')
  return data.cars
}

export async function createSchoolCar(payload: SchoolCarPayload) {
  const { data } = await api.post<{ car: SchoolCar }>('/dashboard/school-admin/cars', payload)
  return data.car
}

export async function updateSchoolCar(carId: string, payload: SchoolCarPayload) {
  const { data } = await api.patch<{ car: SchoolCar }>(`/dashboard/school-admin/cars/${carId}`, payload)
  return data.car
}

export async function deleteSchoolCar(carId: string) {
  const { data } = await api.delete<{ message: string }>(`/dashboard/school-admin/cars/${carId}`)
  return data
}

export async function createSchoolPerson(payload: SchoolPersonPayload) {
  const { data } = await api.post<{ message: string; userId: string }>('/dashboard/school-admin/people', payload)
  return data
}

export async function updateSchoolPerson(userId: string, payload: SchoolPersonPayload) {
  const { data } = await api.patch<{ message: string; userId: string }>(`/dashboard/school-admin/people/${userId}`, payload)
  return data
}

export async function deleteSchoolPerson(userId: string) {
  const { data } = await api.delete<{ message: string }>(`/dashboard/school-admin/people/${userId}`)
  return data
}

export async function submitDashboardSupportQuestion(question: string) {
  const { data } = await api.post<{ message: string; threadId: string }>('/support/user-question', { question })
  return data
}

export async function fetchSupportThreadsForAdmin() {
  const { data } = await api.get<{ threads: SupportThread[] }>('/support/admin/threads')
  return data.threads
}

export async function fetchSupportThreadMessagesForAdmin(threadId: string) {
  const { data } = await api.get<{ thread: SupportThread; messages: SupportMessage[] }>(`/support/admin/threads/${threadId}/messages`)
  return data
}

export async function sendAdminSupportReply(threadId: string, body: string) {
  const { data } = await api.post<{ message: string }>(`/support/admin/threads/${threadId}/reply`, { body })
  return data
}

export async function closeAdminSupportThread(threadId: string) {
  const { data } = await api.post<{ message: string }>(`/support/admin/threads/${threadId}/close`)
  return data
}

export async function deleteAdminSupportThread(threadId: string) {
  const { data } = await api.delete<{ message: string }>(`/support/admin/threads/${threadId}`)
  return data
}

export async function fetchUserSupportThreads() {
  const { data } = await api.get<{ threads: SupportThread[] }>('/support/user/threads')
  return data.threads
}

export async function fetchUserSupportThreadMessages(threadId: string) {
  const { data } = await api.get<{ thread: SupportThread; messages: SupportMessage[] }>(`/support/user/threads/${threadId}/messages`)
  return data
}

export async function replyToUserSupportThread(threadId: string, body: string) {
  const { data } = await api.post<{ message: string }>(`/support/user/threads/${threadId}/reply`, { body })
  return data
}

export async function fetchMyNotifications(limit = 30) {
  const { data } = await api.get<{ items: DashboardNotification[]; unreadCount: number }>(`/notifications/me?limit=${limit}`)
  return data
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.post<{ message: string }>('/notifications/read-all')
  return data
}

export async function deleteMyNotification(notificationId: string) {
  const { data } = await api.delete<{ message: string }>(`/notifications/${notificationId}`)
  return data
}

export async function fetchPushPublicKey() {
  const { data } = await api.get<{ publicKey: string }>('/notifications/push/public-key')
  return data.publicKey
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  const { data } = await api.post<{ message: string }>('/notifications/push/subscribe', { subscription })
  return data
}

export async function removePushSubscription(endpoint: string) {
  const { data } = await api.post<{ message: string }>('/notifications/push/unsubscribe', { endpoint })
  return data
}

function readApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string' && data.trim()) return data.trim()
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim()
    }
  }
  return fallback
}

export async function fetchInstructorSchedule() {
  if (typeof window === 'undefined') return null
  try {
    const { data } = await api.get<{ schedule?: InstructorSchedule | null }>('/dashboard/instructor/schedule')
    return data.schedule ?? null
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    const message = readApiErrorMessage(error, status ? `Failed to fetch schedule: ${status}` : 'Failed to fetch schedule')
    if (status === 404 && message === 'Instructor profile not found') {
      throw new Error(message)
    }
    if (error instanceof Error && error.message === 'Instructor profile not found') {
      throw error
    }
    return null
  }
}

export async function saveInstructorSchedule(schedule: InstructorSchedule) {
  const { data } = await api.put<{ schedule?: InstructorSchedule | null }>('/dashboard/instructor/schedule', schedule)
  return data.schedule ?? null
}

export async function fetchInstructorStudents() {
  const { data } = await api.get<InstructorStudentsResponse>('/dashboard/instructor/students')
  return data
}

export async function fetchInstructorScheduleWorkflow(weekStartDate?: string) {
  const { data } = await api.get<{ workflow: InstructorScheduleWorkflow }>('/dashboard/instructor/schedule/workflow', {
    params: weekStartDate ? { weekStartDate } : undefined,
  })
  return data.workflow
}

export async function sendInstructorScheduleToStudents(payload: {
  weekStartDate?: string
  days: InstructorSchedule['days']
  slotBlueprint: ScheduleSlotBlueprint
}) {
  const { data } = await api.post<{ workflow: InstructorScheduleWorkflow | null }>('/dashboard/instructor/schedule/send', payload)
  return data.workflow
}

export async function allocateInstructorSchedule(cycleId?: string) {
  const { data } = await api.post<{
    allocation: {
      cycleId: string
      totalSlots: number
      assignedSlots: number
      unassignedSlots: number
    }
  }>('/dashboard/instructor/schedule/allocate', { cycleId })
  return data.allocation
}

export async function fetchInstructorLessons(weekStartDate?: string) {
  const { data } = await api.get<{ lessons: LessonListItem[] }>('/dashboard/instructor/lessons', {
    params: weekStartDate ? { weekStartDate } : undefined,
  })
  return data.lessons
}

export async function issueInstructorLessonStartCode(timeSlotId: string) {
  const { data } = await api.post<{ timeSlotId: string; code: string; expiresAt: string }>(
    `/dashboard/instructor/lessons/${timeSlotId}/start-code`,
  )
  return data
}

export async function markInstructorLessonFailed(timeSlotId: string) {
  const { data } = await api.post<{ message: string }>(`/dashboard/instructor/lessons/${timeSlotId}/mark-failed`)
  return data
}

export async function fetchInstructorLessonCandidates(timeSlotId: string) {
  const { data } = await api.get<{ details: LessonCandidatesDetails }>(`/dashboard/instructor/lessons/${timeSlotId}/candidates`)
  return data.details
}

export async function fetchStudentScheduleCycle(weekStartDate?: string) {
  const { data } = await api.get<{ schedule: StudentScheduleCycle | null }>('/dashboard/student/schedule', {
    params: weekStartDate ? { weekStartDate } : undefined,
  })
  return data.schedule
}

export async function submitStudentScheduleAvailability(payload: {
  cycleId: string
  unavailableSlotKeys: Record<DayKey, string[]>
}) {
  const { data } = await api.post<{
    summary: {
      cycleId: string
      status: ScheduleCycleStatus
      repliesReceived: number
      expectedReplies: number
    }
  }>('/dashboard/student/schedule/availability', payload)
  return data.summary
}

export async function fetchStudentLessons(weekStartDate?: string) {
  const { data } = await api.get<{ lessons: LessonListItem[] }>('/dashboard/student/lessons', {
    params: weekStartDate ? { weekStartDate } : undefined,
  })
  return data.lessons
}

export async function fetchStudentProgress() {
  const { data } = await api.get<{ progress: StudentProgressSummary }>('/dashboard/student/progress')
  return data.progress
}

export async function fetchStudentInstructors() {
  const { data } = await api.get<{ summary: StudentInstructorSummary }>('/dashboard/student/instructors')
  return data.summary
}

export async function verifyStudentLessonStartCode(timeSlotId: string, code: string) {
  const { data } = await api.post<{ message: string }>(
    `/dashboard/student/lessons/${timeSlotId}/verify-start-code`,
    { code },
  )
  return data
}

export async function confirmStudentLessonEnd(timeSlotId: string) {
  const { data } = await api.post<{ message: string }>(`/dashboard/student/lessons/${timeSlotId}/confirm-end`)
  return data
}
