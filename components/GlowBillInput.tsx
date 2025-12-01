'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface GlowBillInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string | number
  billValue: number
}

const GlowBillInput = forwardRef<HTMLInputElement, GlowBillInputProps>(
  ({ billValue, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        <div className="white bill-input-glow"></div>
        <div className="border bill-input-glow"></div>
        <div className="darkBorderBg bill-input-glow"></div>
        <div className="glow bill-input-glow"></div>
        <input
          ref={ref}
          className={`input bill-input ${className}`}
          {...props}
        />
        <div id="input-mask"></div>
        <div id="pink-mask"></div>
      </div>
    )
  }
)

GlowBillInput.displayName = 'GlowBillInput'

export default GlowBillInput

