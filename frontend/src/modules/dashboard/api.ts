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
  address: string
  phone: string
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

export async function updateSchoolDetails(payload: Pick<SchoolDetails, 'name' | 'address' | 'phone'>) {
  const { data } = await api.patch<{ school: SchoolDetails }>('/dashboard/school-admin/school', payload)
  return data.school
}

export async function fetchSchoolPeople() {
  const { data } = await api.get<{ people: SchoolPerson[] }>('/dashboard/school-admin/people')
  return data.people
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

async function readResponseErrorMessage(response: Response, fallback: string) {
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json() as { message?: string }
      if (data?.message) return data.message
    } else {
      const text = await response.text()
      if (text.trim()) return text.trim()
    }
  } catch {
    // Ignore parse failures and use the fallback below.
  }

  return fallback
}

export async function fetchInstructorSchedule() {
  if (typeof window === 'undefined') return null
  try {
    const response = await fetch('/api/dashboard/instructor/schedule', {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      const message = await readResponseErrorMessage(response, `Failed to fetch schedule: ${response.status}`)
      if (response.status === 404 && message === 'Instructor profile not found') {
        throw new Error(message)
      }
      return null
    }
    const data = await response.json() as { schedule?: InstructorSchedule | null }
    return data.schedule ?? null
  } catch (error) {
    if (error instanceof Error && error.message === 'Instructor profile not found') {
      throw error
    }
    return null
  }
}

export async function saveInstructorSchedule(schedule: InstructorSchedule) {
  const response = await fetch('/api/dashboard/instructor/schedule', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schedule),
  })

  if (!response.ok) {
    const message = await readResponseErrorMessage(response, `Failed to save schedule: ${response.status}`)
    throw new Error(message)
  }

  const data = await response.json() as { schedule?: InstructorSchedule | null }
  return data.schedule ?? null
}

export async function fetchInstructorStudents() {
  const response = await fetch('/api/dashboard/instructor/students', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch students: ${response.status}`)
  }

  const data = await response.json() as InstructorStudentsResponse
  return data
}

export async function fetchInstructorScheduleWorkflow(weekStartDate?: string) {
  const search = weekStartDate ? `?weekStartDate=${encodeURIComponent(weekStartDate)}` : ''
  const response = await fetch(`/api/dashboard/instructor/schedule/workflow${search}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch schedule workflow: ${response.status}`)
  }

  const data = await response.json() as { workflow: InstructorScheduleWorkflow }
  return data.workflow
}

export async function sendInstructorScheduleToStudents(payload: {
  weekStartDate?: string
  days: InstructorSchedule['days']
  slotBlueprint: ScheduleSlotBlueprint
}) {
  const response = await fetch('/api/dashboard/instructor/schedule/send', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to send schedule to students: ${response.status}`)
  }

  const data = await response.json() as { workflow: InstructorScheduleWorkflow | null }
  return data.workflow
}

export async function allocateInstructorSchedule(cycleId?: string) {
  const response = await fetch('/api/dashboard/instructor/schedule/allocate', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cycleId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to allocate schedule: ${response.status}`)
  }

  const data = await response.json() as {
    allocation: {
      cycleId: string
      totalSlots: number
      assignedSlots: number
      unassignedSlots: number
    }
  }
  return data.allocation
}

export async function fetchInstructorLessons(weekStartDate?: string) {
  const search = weekStartDate ? `?weekStartDate=${encodeURIComponent(weekStartDate)}` : ''
  const response = await fetch(`/api/dashboard/instructor/lessons${search}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch instructor lessons: ${response.status}`)
  }

  const data = await response.json() as { lessons: LessonListItem[] }
  return data.lessons
}

export async function issueInstructorLessonStartCode(timeSlotId: string) {
  const response = await fetch(`/api/dashboard/instructor/lessons/${timeSlotId}/start-code`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to issue start code: ${response.status}`)
  }

  const data = await response.json() as { timeSlotId: string; code: string; expiresAt: string }
  return data
}

export async function markInstructorLessonFailed(timeSlotId: string) {
  const response = await fetch(`/api/dashboard/instructor/lessons/${timeSlotId}/mark-failed`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to mark lesson as failed: ${response.status}`)
  }

  return response.json() as Promise<{ message: string }>
}

export async function fetchInstructorLessonCandidates(timeSlotId: string) {
  const response = await fetch(`/api/dashboard/instructor/lessons/${timeSlotId}/candidates`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch lesson candidates: ${response.status}`)
  }

  const data = await response.json() as { details: LessonCandidatesDetails }
  return data.details
}

export async function fetchStudentScheduleCycle(weekStartDate?: string) {
  const search = weekStartDate ? `?weekStartDate=${encodeURIComponent(weekStartDate)}` : ''
  const response = await fetch(`/api/dashboard/student/schedule${search}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch student schedule cycle: ${response.status}`)
  }

  const data = await response.json() as { schedule: StudentScheduleCycle | null }
  return data.schedule
}

export async function submitStudentScheduleAvailability(payload: {
  cycleId: string
  unavailableSlotKeys: Record<DayKey, string[]>
}) {
  const response = await fetch('/api/dashboard/student/schedule/availability', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to submit student availability: ${response.status}`)
  }

  const data = await response.json() as {
    summary: {
      cycleId: string
      status: ScheduleCycleStatus
      repliesReceived: number
      expectedReplies: number
    }
  }
  return data.summary
}

export async function fetchStudentLessons(weekStartDate?: string) {
  const search = weekStartDate ? `?weekStartDate=${encodeURIComponent(weekStartDate)}` : ''
  const response = await fetch(`/api/dashboard/student/lessons${search}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch student lessons: ${response.status}`)
  }

  const data = await response.json() as { lessons: LessonListItem[] }
  return data.lessons
}

export async function verifyStudentLessonStartCode(timeSlotId: string, code: string) {
  const response = await fetch(`/api/dashboard/student/lessons/${timeSlotId}/verify-start-code`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    throw new Error(`Failed to verify lesson start code: ${response.status}`)
  }

  return response.json() as Promise<{ message: string }>
}

export async function confirmStudentLessonEnd(timeSlotId: string) {
  const response = await fetch(`/api/dashboard/student/lessons/${timeSlotId}/confirm-end`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to confirm lesson end: ${response.status}`)
  }

  return response.json() as Promise<{ message: string }>
}
