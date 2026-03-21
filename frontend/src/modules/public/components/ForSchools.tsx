import { TrendingUp, Clock, FileText, Users, Zap, HeadphonesIcon } from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Увеличете приходите',
    description: 'Достигнете до повече курсисти чрез нашата платформа.',
  },
  {
    icon: Clock,
    title: 'Спестете време',
    description: 'Автоматизирайте записвания, плащания и комуникация.',
  },
  {
    icon: FileText,
    title: 'Дигитална документация',
    description: 'Всички документи на едно място, лесни за достъп.',
  },
  {
    icon: Users,
    title: 'Управление на екип',
    description: 'Координирайте инструктори и разпределяйте задачи.',
  },
  {
    icon: Zap,
    title: 'Бърза настройка',
    description: 'Започнете да работите за минути, не за дни.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Поддръжка 24/7',
    description: 'Нашият екип е винаги на линия да ви помогне.',
  },
]

export default function ForSchools() {
  return (
    <section id="schools" className="py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge badge-secondary badge-lg mb-4">За автошколи</span>
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
            Дигитализирайте вашата автошкола
          </h2>
          <p className="text-body text-base-content/70 max-w-2xl mx-auto">
            Модерни инструменти за управление на курсисти, инструктори и цялостната 
            дейност на вашата автошкола.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-4 p-6 rounded-xl bg-base-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-subheading text-base-content mb-1">{benefit.title}</h3>
                <p className="text-helper text-base-content/70">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#contact" className="btn btn-secondary btn-lg">
            Свържете се с нас
          </a>
        </div>
      </div>
    </section>
  )
}
