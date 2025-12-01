'use client'

interface LoaderProps {
  text?: string
  size?: number
}

export default function Loader({ text = 'Chargement', size = 180 }: LoaderProps) {
  const letters = text.split('').map((letter, index) => (
    <span key={index} className="loader-letter">
      {letter === ' ' ? '\u00A0' : letter}
    </span>
  ))

  return (
    <div className="loader-wrapper" style={{ width: size, height: size }}>
      <div className="loader"></div>
      <div className="loader-letter-container">
        {letters}
      </div>
    </div>
  )
}

