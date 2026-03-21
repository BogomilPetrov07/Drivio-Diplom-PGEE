import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import logoLight from '../../../assets/logo_light.svg'
import logoDark from '../../../assets/logo_dark.svg'

interface FooterProps {
  theme: 'drivio-pro-light' | 'drivio-pro-dark'
}

const footerLinks = {
  product: [
    { label: 'Функции', href: '#features' },
    { label: 'За курсисти', href: '#students' },
    { label: 'За автошколи', href: '#schools' },
    { label: 'Цени', href: '#pricing' },
  ],
  company: [
    { label: 'За нас', href: '#about' },
    { label: 'Блог', href: '#blog' },
    { label: 'Кариери', href: '#careers' },
    { label: 'Контакти', href: '#contact' },
  ],
  legal: [
    { label: 'Условия за ползване', href: '#terms' },
    { label: 'Политика за поверителност', href: '#privacy' },
    { label: 'Бисквитки', href: '#cookies' },
  ],
}

export default function Footer({ theme }: FooterProps) {
  return (
    <footer className="bg-base-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-3 mb-4 group">
              <div className="relative">
                <img
                  src={theme === 'drivio-pro-light' ? logoLight : logoDark}
                  alt="Drivio Logo"
                  className="h-10 w-auto transition-transform group-hover:scale-105"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-primary">
                Drivio
              </span>
            </a>
            <p className="text-body text-base-content/70 mb-4 max-w-sm">
              Модерна платформа за цялостен мениджмънт и провеждане на шофьорски курсове в България.
            </p>
            <div className="flex gap-4">
              <a href="#" className="btn btn-circle btn-ghost btn-sm">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="btn btn-circle btn-ghost btn-sm">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="btn btn-circle btn-ghost btn-sm">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-subheading text-base-content mb-4">Продукт</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-body text-base-content/70 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-subheading text-base-content mb-4">Компания</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-body text-base-content/70 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-subheading text-base-content mb-4">Контакти</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-body text-base-content/70">
                <Mail className="w-4 h-4" />
                <span>info@drivio.bg</span>
              </li>
              <li className="flex items-center gap-2 text-body text-base-content/70">
                <Phone className="w-4 h-4" />
                <span>+359 888 123 456</span>
              </li>
              <li className="flex items-start gap-2 text-body text-base-content/70">
                <MapPin className="w-4 h-4 mt-1" />
                <span>София, България</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-base-content/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-helper text-base-content/60">
              &copy; {new Date().getFullYear()} Drivio. Всички права запазени.
            </p>
            <div className="flex gap-4">
              {footerLinks.legal.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-helper text-base-content/60 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
