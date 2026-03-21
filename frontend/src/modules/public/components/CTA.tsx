import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-content mb-4">
            Готови ли сте да започнете?
          </h2>
          <p className="text-body text-primary-content/90 max-w-2xl mx-auto mb-8">
            Регистрирайте се безплатно и открийте как Drivio може да направи 
            пътя ви към шофьорската книжка по-лесен.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#signup" className="btn btn-lg bg-base-100 text-primary hover:bg-base-200">
              Започни като курсист
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#contact" className="btn btn-lg btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary">
              Регистрирай автошкола
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
