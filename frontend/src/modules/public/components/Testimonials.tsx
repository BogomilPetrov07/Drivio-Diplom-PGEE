import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Иван Петров',
    role: 'Курсист',
    content: 'Благодарение на Drivio намерих страхотна автошкола и взех книжка от първия опит. Платформата е много удобна!',
    rating: 5,
  },
  {
    name: 'Мария Георгиева',
    role: 'Собственик на автошкола',
    content: 'От както използваме Drivio, администрацията ни е много по-лека. Курсистите сами резервират часове онлайн.',
    rating: 5,
  },
  {
    name: 'Георги Димитров',
    role: 'Инструктор',
    content: 'Чудесно приложение! Виждам графика си ясно и получавам известия за всяка промяна. Препоръчвам го!',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-base-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
            Какво казват нашите потребители
          </h2>
          <p className="text-body text-base-content/70 max-w-2xl mx-auto">
            Хиляди курсисти и автошколи вече се доверяват на Drivio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-body text-base-content mb-4">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                      <span>{testimonial.name[0]}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-subheading text-sm">{testimonial.name}</p>
                    <p className="text-helper text-base-content/60">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
