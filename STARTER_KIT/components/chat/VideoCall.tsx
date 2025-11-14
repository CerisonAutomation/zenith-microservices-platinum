'use client'

import { useEffect, useRef, useState } from 'react'
import DailyIframe, { DailyCall, DailyEventObjectAppMessage } from '@daily-co/daily-js'
import { cn } from '@/lib/utils'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react'

interface VideoCallProps {
  roomUrl: string
  onLeave?: () => void
  userName?: string
  isAudioOnly?: boolean
  className?: string
}

export function VideoCall({
  roomUrl,
  onLeave,
  userName = 'Guest',
  isAudioOnly = false,
  className
}: VideoCallProps) {
  const callFrameRef = useRef<HTMLDivElement>(null)
  const callObjectRef = useRef<DailyCall | null>(null)

  const [isJoined, setIsJoined] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(isAudioOnly)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!callFrameRef.current) return

    // Create Daily call object
    const callFrame = DailyIframe.createFrame(callFrameRef.current, {
      showLeaveButton: false,
      showFullscreenButton: false,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 0,
        borderRadius: '12px'
      }
    })

    callObjectRef.current = callFrame

    // Event listeners
    callFrame
      .on('joined-meeting', () => {
        setIsJoined(true)
        setError(null)
      })
      .on('left-meeting', () => {
        setIsJoined(false)
        onLeave?.()
      })
      .on('error', (e) => {
        console.error('Daily call error:', e)
        setError('Call error occurred. Please try again.')
      })
      .on('participant-joined', (e) => {
        console.log('Participant joined:', e.participant.user_name)
      })
      .on('participant-left', (e) => {
        console.log('Participant left:', e.participant.user_name)
      })

    // Join the call
    callFrame
      .join({
        url: roomUrl,
        userName,
        videoSource: isAudioOnly ? false : true,
        audioSource: true
      })
      .catch((error) => {
        console.error('Error joining call:', error)
        setError('Failed to join call. Please check your connection.')
      })

    // Call duration timer
    const durationInterval = setInterval(() => {
      if (isJoined) {
        setCallDuration(prev => prev + 1)
      }
    }, 1000)

    return () => {
      clearInterval(durationInterval)
      if (callFrame) {
        callFrame.destroy()
      }
    }
  }, [roomUrl, userName, isAudioOnly])

  const toggleMic = () => {
    if (callObjectRef.current) {
      callObjectRef.current.setLocalAudio(!isMicMuted)
      setIsMicMuted(!isMicMuted)
    }
  }

  const toggleCamera = () => {
    if (callObjectRef.current && !isAudioOnly) {
      callObjectRef.current.setLocalVideo(!isCameraOff)
      setIsCameraOff(!isCameraOff)
    }
  }

  const leaveCall = () => {
    if (callObjectRef.current) {
      callObjectRef.current.leave()
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      callFrameRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('relative bg-gray-900 rounded-xl overflow-hidden', className)}>
      {/* Call frame container */}
      <div
        ref={callFrameRef}
        className="w-full h-full min-h-[400px] md:min-h-[600px]"
      />

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Call controls overlay */}
      {isJoined && (
        <>
          {/* Call duration */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-white text-sm font-mono">
              {formatDuration(callDuration)}
            </span>
          </div>

          {/* Control buttons */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {/* Microphone toggle */}
            <button
              onClick={toggleMic}
              className={cn(
                'p-4 rounded-full transition-all shadow-lg',
                isMicMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm'
              )}
              aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMicMuted ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Camera toggle (video calls only) */}
            {!isAudioOnly && (
              <button
                onClick={toggleCamera}
                className={cn(
                  'p-4 rounded-full transition-all shadow-lg',
                  isCameraOff
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm'
                )}
                aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isCameraOff ? (
                  <VideoOff className="w-5 h-5 text-white" />
                ) : (
                  <Video className="w-5 h-5 text-white" />
                )}
              </button>
            )}

            {/* Leave call */}
            <button
              onClick={leaveCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-lg"
              aria-label="Leave call"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-4 rounded-full bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm transition-all shadow-lg"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </>
      )}

      {/* Connecting state */}
      {!isJoined && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Connecting to call...</p>
          </div>
        </div>
      )}
    </div>
  )
}
