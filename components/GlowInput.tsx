'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface GlowInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
  ({ icon, className = '', ...props }, ref) => {
    return (
      <div id="poda" className="relative">
        <div className="white"></div>
        <div className="border"></div>
        <div className="darkBorderBg"></div>
        <div className="glow"></div>
        {icon && (
          <div id="search-icon">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`input ${className}`}
          {...props}
        />
        <div id="input-mask"></div>
        <div id="pink-mask"></div>
      </div>
    )
  }
)

GlowInput.displayName = 'GlowInput'

export default GlowInput

