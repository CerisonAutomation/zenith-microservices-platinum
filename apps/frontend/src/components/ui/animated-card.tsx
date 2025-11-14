'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'gradient' | 'glass'
  hover?: boolean
  delay?: number
}

const variants = {
  default: 'bg-gray-900 border border-gray-800',
  elevated: 'bg-gray-900 shadow-2xl shadow-purple-500/20',
  gradient: 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border border-purple-500/30',
  glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
}

export function AnimatedCard({
  children,
  variant = 'default',
  hover = true,
  delay = 0,
  className,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={
        hover
          ? {
              y: -8,
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(168, 85, 247, 0.4)',
            }
          : {}
      }
      {...props}
    >
      {children}
    </motion.div>
  )
}
