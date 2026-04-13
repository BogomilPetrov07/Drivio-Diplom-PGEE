import api from '../../services/api'

export interface JoinRequestPayload {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  contactName: string
  contactEmail: string
}

export async function submitDrivingSchoolJoinRequest(payload: JoinRequestPayload) {
  const { data } = await api.post('/onboarding/request', payload)
  return data as { message: string }
}
