import { Award, Calendar, CheckCircle, Search, Sparkles, UserCheck } from 'lucide-react'
import { getPublicTranslations, type Language } from '../../../i18n/public'
import { getDomainAwareUrl } from '../../../utils/app-domain'

const benefitIcons = [CheckCircle, UserCheck, Sparkles, Award]
const stepIcons = [Search, Calendar, Award]

interface ForStudentsProps {
  language: Language
}

export default function ForStudents({ language }: ForStudentsProps) {
  const data = getPublicTranslations(language).students
  const loginHref = getDomainAwareUrl('/login')

  return (
    <section id="students" className="bg-base-100 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <span className="badge badge-primary badge-lg mb-4">{data.badge}</span>
          <h2 className="mb-4 text-3xl font-bold text-base-content md:text-4xl">{data.heading}</h2>
          <p className="mx-auto max-w-2xl text-body text-base-content/70">{data.description}</p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {data.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index % benefitIcons.length]
            return (
              <div key={index} className="flex gap-4 rounded-xl bg-base-200 p-6">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-body text-base-content/80">{benefit}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {data.steps.map((step, index) => {
            const Icon = stepIcons[index % stepIcons.length]
            return (
              <div key={index} className="rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 text-subheading text-base-content">{step.title}</h3>
                <p className="text-helper text-base-content/70">{step.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <a href={loginHref} className="btn btn-primary btn-lg">
            {data.cta}
          </a>
        </div>
      </div>
    </section>
  )
}

