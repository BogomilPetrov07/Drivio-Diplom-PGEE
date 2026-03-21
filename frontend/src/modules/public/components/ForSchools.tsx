import { Clock, FileText, HeadphonesIcon, TrendingUp, Users, Zap } from 'lucide-react'
import { getPublicTranslations, type Language } from '../../../i18n/public'

const icons = [TrendingUp, Clock, FileText, Users, Zap, HeadphonesIcon]

interface ForSchoolsProps {
  language: Language
}

export default function ForSchools({ language }: ForSchoolsProps) {
  const data = getPublicTranslations(language).schools

  return (
    <section id="schools" className="py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge badge-secondary badge-lg mb-4">{data.badge}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">{data.heading}</h2>
          <p className="text-body text-base-content/70 max-w-2xl mx-auto">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {data.benefits.map((benefit, index) => {
            const Icon = icons[index]
            return (
              <div key={index} className="flex gap-4 p-6 rounded-xl bg-base-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    {Icon && <Icon className="w-5 h-5 text-secondary" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-subheading text-base-content mb-1">{benefit.title}</h3>
                  <p className="text-helper text-base-content/70">{benefit.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <a href="#contact" className="btn btn-secondary btn-lg">
            {data.cta}
          </a>
        </div>
      </div>
    </section>
  )
}
