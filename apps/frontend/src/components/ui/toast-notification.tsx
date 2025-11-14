'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastNotificationProps {
  toast: Toast
  onClose: (id: string) => void
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const colors = {
  success: 'from-green-600 to-emerald-600',
  error: 'from-red-600 to-pink-600',
  info: 'from-blue-600 to-cyan-600',
  warning: 'from-yellow-600 to-orange-600',
}

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  const Icon = icons[toast.type || 'info']

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative overflow-hidden',
        'bg-gray-900 border border-gray-800',
        'rounded-xl shadow-2xl',
        'p-4 pr-12',
        'min-w-[320px] max-w-md'
      )}
    >
      {/* Gradient border effect */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          'bg-gradient-to-b',
          colors[toast.type || 'info']
        )}
      />

      {/* Content */}
      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>

        <div className="flex-1">
          <h3 className="font-semibold text-white">{toast.title}</h3>
          {toast.description && (
            <p className="text-sm text-gray-400 mt-1">{toast.description}</p>
          )}
        </div>

        <motion.button
          onClick={() => onClose(toast.id)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Progress bar */}
      {toast.duration && (
        <motion.div
          className={cn('absolute bottom-0 left-0 right-0 h-1', 'bg-gradient-to-r', colors[toast.type || 'info'])}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </motion.div>
  )
}

export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}
