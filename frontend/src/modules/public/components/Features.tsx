import { BarChart3, BookOpen, Calendar, Car, Shield, Users } from 'lucide-react'
import { getPublicTranslations, type Language } from '../../../i18n/public'

const icons = [Calendar, BookOpen, Car, BarChart3, Users, Shield]

interface FeaturesProps {
  language: Language
}

export default function Features({ language }: FeaturesProps) {
  const data = getPublicTranslations(language).features

  return (
    <section id="features" className="py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">{data.heading}</h2>
          <p className="text-body text-base-content/70 max-w-2xl mx-auto">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((feature, index) => {
            const Icon = icons[index]
            return (
              <div key={index} className="card bg-base-200 hover:shadow-lg transition-shadow duration-300">
                <div className="card-body">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    {Icon && <Icon className="w-6 h-6 text-primary" />}
                  </div>
                  <h3 className="text-subheading text-base-content mb-2">{feature.title}</h3>
                  <p className="text-body text-base-content/70">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
