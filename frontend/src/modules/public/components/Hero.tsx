import { Calendar, Users, Shield } from 'lucide-react'

interface HeroProps {
  language: 'bg' | 'en'
}

export default function Hero({ language }: HeroProps) {
  const t = {
    bg: {
      badge: 'Новата платформа за автошколи в България',
      heading1: 'Управлявай своя',
      heading2: 'път към успеха',
      description: 'Drivio свързва курсисти, инструктори и автошколи в една интелигентна платформа. Резервирай часове, следи прогреса си и получи своята шофьорска книжка по-лесно от всякога.',
      features: [
        { icon: Calendar, text: 'Лесно резервиране' },
        { icon: Users, text: 'За всички роли' },
        { icon: Shield, text: 'Сигурна платформа' },
      ],
    },
    en: {
      badge: 'The new driving school platform in Bulgaria',
      heading1: 'Manage your',
      heading2: 'path to success',
      description: 'Drivio connects students, instructors, and driving schools in one intelligent platform. Book lessons, track your progress, and get your driving license easier than ever.',
      features: [
        { icon: Calendar, text: 'Easy booking' },
        { icon: Users, text: 'For all roles' },
        { icon: Shield, text: 'Secure platform' },
      ],
    }
  }

  const text = t[language]

  return (
    <section className="relative min-h-[85vh] bg-base-200 flex items-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-20 md:py-28 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-medium mb-8 backdrop-blur-sm border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {text.badge}
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-base-content leading-tight mb-8">
            {text.heading1}
            <br />
            <span className="text-primary relative inline-block">
              {text.heading2}
              {/* Decorative underline */}
              <svg 
                className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" 
                viewBox="0 0 200 12" 
                preserveAspectRatio="none"
              >
                <path 
                  d="M0 9c30-4 60-7 100-7s70 3 100 7" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="none" 
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-base-content/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            {text.description}
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {text.features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 bg-base-100/50 backdrop-blur-sm px-5 py-3 rounded-full border border-base-content/10 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-base-content font-medium">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            className="fill-base-100"
          />
        </svg>
      </div>
    </section>
  )
}
