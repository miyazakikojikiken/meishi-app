'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { RotateCcw, ZapOff, CheckCircle } from 'lucide-react'

interface Props {
  onCapture: (file: File) => void
  onClose: () => void
}

export default function BusinessCardCamera({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setReady(true)
        }
      }
    } catch (e) {
      console.error('Camera error:', e)
    }
  }, [facingMode])

  useEffect(() => {
    startCamera()
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [startCamera])

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    setCaptured(true)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'card.jpg', { type: 'image/jpeg' })
      setTimeout(() => onCapture(file), 600)
    }, 'image/jpeg', 0.95)
  }, [onCapture])

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    setReady(false)
  }, [])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={onClose} className="text-white text-sm px-3 py-1 border border-white rounded-full">
          キャンセル
        </button>
        <span className="text-sm font-medium">名刺を枠に合わせてください</span>
        <button onClick={toggleCamera} className="text-white p-1">
          <RotateCcw size={22} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/50" />
          <div
            className={`relative z-10 border-2 rounded-lg transition-colors duration-300 ${captured ? 'border-green-400' : 'border-white'}`}
            style={{ width: '88vw', height: '56vw', maxWidth: 500, maxHeight: 310 }}
          >
            <div className={`absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 rounded-tl ${captured ? 'border-green-400' : 'border-white'}`} />
            <div className={`absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 rounded-tr ${captured ? 'border-green-400' : 'border-white'}`} />
            <div className={`absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 rounded-bl ${captured ? 'border-green-400' : 'border-white'}`} />
            <div className={`absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 rounded-br ${captured ? 'border-green-400' : 'border-white'}`} />
            {captured && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-400/20 rounded-lg">
                <CheckCircle size={56} className="text-green-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pb-12 pt-6 flex flex-col items-center gap-4">
        <p className="text-white/70 text-xs">名刺全体が枠に収まるように合わせてください</p>
        <button
          onClick={capture}
          disabled={!ready || captured}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>
      </div>
    </div>
  )
}
