'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Mic, Square, Trash2, Send } from 'lucide-react'

interface VoiceRecorderProps {
  onRecordingComplete: (audioUrl: string, duration: number) => Promise<void>
  className?: string
}

export function VoiceRecorder({ onRecordingComplete, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const supabase = createClient()

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const cancelRecording = () => {
    stopRecording()
    setAudioBlob(null)
    setRecordingTime(0)
    chunksRef.current = []
  }

  const sendRecording = async () => {
    if (!audioBlob) return

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileName = `voice-${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName)

      // Call parent callback with URL and duration
      await onRecordingComplete(publicUrl, recordingTime)

      // Reset state
      setAudioBlob(null)
      setRecordingTime(0)
      chunksRef.current = []

    } catch (error) {
      console.error('Error uploading voice message:', error)
      alert('Failed to send voice message. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!isRecording && !audioBlob && (
        <button
          onClick={startRecording}
          className={cn(
            'p-3 rounded-full',
            'bg-blue-500 hover:bg-blue-600 text-white',
            'transition-all hover:scale-110',
            'shadow-lg'
          )}
          aria-label="Start recording"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-red-600 dark:text-red-400">
              {formatTime(recordingTime)}
            </span>
          </div>

          <button
            onClick={stopRecording}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40"
            aria-label="Stop recording"
          >
            <Square className="w-4 h-4 text-red-600 dark:text-red-400 fill-current" />
          </button>

          <button
            onClick={cancelRecording}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40"
            aria-label="Cancel recording"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
          <audio
            src={URL.createObjectURL(audioBlob)}
            controls
            className="h-8"
          />

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatTime(recordingTime)}
          </span>

          <button
            onClick={cancelRecording}
            disabled={uploading}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40"
            aria-label="Delete recording"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>

          <button
            onClick={sendRecording}
            disabled={uploading}
            className={cn(
              'p-2 rounded-full',
              'bg-blue-500 hover:bg-blue-600 text-white',
              'transition-all hover:scale-110',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Send voice message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
