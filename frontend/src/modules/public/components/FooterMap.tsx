interface FooterMapProps {
  locationLabel: string
}

export default function FooterMap({ locationLabel }: FooterMapProps) {
  const src =
    'https://www.openstreetmap.org/export/embed.html?bbox=23.279%2C42.679%2C23.365%2C42.719&layer=mapnik&marker=42.6977%2C23.3219'

  return (
    <iframe
      title={`Map location: ${locationLabel}`}
      className="w-full h-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={src}
    />
  )
}
