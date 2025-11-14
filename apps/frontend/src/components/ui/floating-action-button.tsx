'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface FloatingActionButtonProps {
  icon?: ReactNode
  onClick?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  variant?: 'primary' | 'secondary'
  label?: string
  className?: string
}

const positions = {
  'bottom-right': 'bottom-8 right-8',
  'bottom-left': 'bottom-8 left-8',
  'top-right': 'top-8 right-8',
  'top-left': 'top-8 left-8',
}

export function FloatingActionButton({
  icon = <Plus className="w-6 h-6" />,
  onClick,
  position = 'bottom-right',
  variant = 'primary',
  label,
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      className={cn(
        'fixed z-50',
        'flex items-center gap-2',
        'px-6 py-4 rounded-full',
        'shadow-2xl',
        'font-semibold',
        variant === 'primary'
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50'
          : 'bg-gray-900 text-white border-2 border-purple-500',
        positions[position],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9, rotate: 45 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* Pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <span className="relative">{icon}</span>
      {label && (
        <motion.span
          className="relative"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  )
}
