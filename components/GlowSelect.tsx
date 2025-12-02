'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface GlowSelectOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  color?: string
}

interface GlowSelectProps {
  value: string
  onChange: (value: string) => void
  options: GlowSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
}

export default function GlowSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Sélectionner...',
  disabled = false, 
  className = '',
  label
}: GlowSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)
  const SelectedIcon = selectedOption?.icon

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between gap-2 px-4 py-2.5
            bg-slate-800/50 border border-slate-700 rounded-lg
            text-sm text-white
            transition-all duration-300
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/50 hover:bg-slate-800/70 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'}
            ${isOpen ? 'border-cyan-500/50 bg-slate-800/70 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            {SelectedIcon && (
              <SelectedIcon className={`w-4 h-4 ${selectedOption?.color || 'text-cyan-400'}`} />
            )}
            <span>{selectedOption?.label || placeholder}</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && !disabled && (
          <div 
            className="absolute z-50 mt-2 w-full rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden"
            style={{
              animation: 'fadeInUp 0.2s ease-out both'
            }}
          >
            {options.map((option) => {
              const OptionIcon = option.icon
              const isSelected = option.value === value
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm
                    transition-all duration-200
                    ${isSelected 
                      ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  {OptionIcon && (
                    <OptionIcon className={`w-4 h-4 ${option.color || 'text-cyan-400'}`} />
                  )}
                  <span className="flex-1 text-left">{option.label}</span>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

