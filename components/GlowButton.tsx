'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export default function GlowButton({ children, className = '', ...props }: GlowButtonProps) {
  return (
    <button className={`button ${className}`} {...props}>
      <div className="blob1"></div>
      <div className="inner">
        {children}
      </div>
    </button>
  )
}

