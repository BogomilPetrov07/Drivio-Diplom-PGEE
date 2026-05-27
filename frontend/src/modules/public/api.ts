import api from '../../services/api'

export interface JoinRequestPayload {
  schoolName: string
  schoolRegion: string
  schoolCity: string
  schoolAddress: string
  schoolPhone: string
  contactEmail: string
}

export async function submitDrivingSchoolJoinRequest(payload: JoinRequestPayload) {
  const { data } = await api.post('/onboarding/request', payload)
  return data as { message: string }
}

export interface PublicQuestionPayload {
  name: string
  email: string
  question: string
}

export async function submitPublicQuestion(payload: PublicQuestionPayload) {
  const { data } = await api.post('/support/question', payload)
  return data as { message: string }
}

export interface PublicSchoolListItem {
  id: string
  name: string
  region: string
  city: string
  address: string
  phone: string
  rating: number
}

export async function fetchPublicSchools() {
  const { data } = await api.get('/public/schools')
  return data.schools as PublicSchoolListItem[]
}
