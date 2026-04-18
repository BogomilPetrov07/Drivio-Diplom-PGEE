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

export interface SchoolPersonPayload {
  username: string
  email: string
  password?: string
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

export async function fetchInstructorSchedule() {
  if (typeof window === 'undefined') return null
  try {
    const response = await fetch('/api/dashboard/instructor/schedule', {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) return null
    const data = await response.json() as { schedule?: InstructorSchedule | null }
    return data.schedule ?? null
  } catch {
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
    throw new Error(`Failed to save schedule: ${response.status}`)
  }

  const data = await response.json() as { schedule?: InstructorSchedule | null }
  return data.schedule ?? null
}
