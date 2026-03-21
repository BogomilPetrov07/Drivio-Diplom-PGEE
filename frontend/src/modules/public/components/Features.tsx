import { Calendar, BookOpen, Car, BarChart3, Users, Shield } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Онлайн записване',
    description: 'Резервирайте часове за практика лесно и удобно през платформата, 24/7.',
  },
  {
    icon: BookOpen,
    title: 'Теоретично обучение',
    description: 'Достъп до интерактивни уроци, тестове и материали за подготовка за изпита.',
  },
  {
    icon: Car,
    title: 'Проследяване на прогреса',
    description: 'Следете напредъка си в реално време - часове, оценки и готовност за изпит.',
  },
  {
    icon: BarChart3,
    title: 'Статистика и анализи',
    description: 'Детайлни отчети за автошколите за оптимизиране на обучението.',
  },
  {
    icon: Users,
    title: 'Управление на курсисти',
    description: 'Цялостна система за мениджмънт на курсисти и инструктори.',
  },
  {
    icon: Shield,
    title: 'Сигурност на данните',
    description: 'Вашите данни са защитени с най-съвременни технологии за криптиране.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
            Всичко, от което имате нужда
          </h2>
          <p className="text-body text-base-content/70 max-w-2xl mx-auto">
            Drivio предлага пълен набор от инструменти за курсисти и автошколи, 
            за да направи процеса на обучение по-лесен и ефективен.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card bg-base-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-subheading text-base-content mb-2">{feature.title}</h3>
                <p className="text-body text-base-content/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
