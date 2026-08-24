import { useState } from 'react'

export function PosterImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-neutral-800 text-center text-xs text-neutral-500 ${className}`}>
        <span className="px-2">{alt}</span>
      </div>
    )
  }

  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} onError={() => setErrored(true)} />
}
