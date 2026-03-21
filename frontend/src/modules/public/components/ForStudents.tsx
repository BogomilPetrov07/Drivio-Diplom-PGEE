import { CheckCircle, Search, Calendar, Award } from 'lucide-react'

const benefits = [
  'Намерете най-подходящата автошкола за вас',
  'Резервирайте часове онлайн, без телефонни обаждания',
  'Следете прогреса си в реално време',
  'Подгответе се с интерактивни тестове',
  'Получете сертификат при завършване',
]

const steps = [
  {
    icon: Search,
    title: 'Изберете автошкола',
    description: 'Разгледайте и сравнете автошколи във вашия район.',
  },
  {
    icon: Calendar,
    title: 'Запишете се',
    description: 'Регистрирайте се и изберете удобен график за обучение.',
  },
  {
    icon: Award,
    title: 'Завършете курса',
    description: 'Научете теорията, натрупайте опит и вземете изпита.',
  },
]

export default function ForStudents() {
  return (
    <section id="students" className="py-16 md:py-24 bg-base-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1">
            <span className="badge badge-primary badge-lg mb-4">За курсисти</span>
            <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-6">
              Вземете книжка лесно и удобно
            </h2>
            <p className="text-body text-base-content/70 mb-8">
              Drivio ви помага да намерите перфектната автошкола и да следите
              целия си напредък на едно място. Без излишни усложнения.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-body text-base-content">{benefit}</span>
                </li>
              ))}
            </ul>

            <a href="#signup" className="btn btn-primary">
              Намери своята автошкола
            </a>
          </div>

          {/* Right - Steps */}
          <div className="flex-1 w-full">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary-content" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-12 bg-primary/30 mx-auto mt-2"></div>
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-subheading text-base-content mb-1">{step.title}</h3>
                    <p className="text-body text-base-content/70">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
