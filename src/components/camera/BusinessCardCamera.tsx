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
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch {
      alert('カメラにアクセスできませんでした。カメラの権限を確認してください。')
      onClose()
    }
  }, [facingMode, onClose])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [startCamera])

  function capture() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    setCaptured(true)
  }

  function retake() {
    setCaptured(false)
  }

  function confirm() {
    if (!canvasRef.current) return
    canvasRef.current.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }

  function toggleCamera() {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment')
    setCaptured(false)
    setReady(false)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white text-sm px-3 py-1 rounded border border-white/40">
          キャンセル
        </button>
        <button onClick={toggleCamera} className="text-white">
          <RotateCcw size={22} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${captured ? 'hidden' : ''}`}
        />
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain ${captured ? '' : 'hidden'}`}
        />

        {!captured && ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/70 rounded-lg"
              style={{ width: '85%', aspectRatio: '1.75 / 1' }}>
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
            </div>
            <p className="absolute bottom-8 text-white/70 text-sm">枠内に名刺を合わせてください</p>
          </div>
        )}
      </div>

      <div className="p-6 flex items-center justify-center gap-8">
        {!captured ? (
          <button
            onClick={capture}
            disabled={!ready}
            className="w-16 h-16 rounded-full bg-white disabled:opacity-40 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300" />
          </button>
        ) : (
          <>
            <button onClick={retake} className="flex flex-col items-center gap-1 text-white">
              <ZapOff size={28} />
              <span className="text-xs">撮り直す</span>
            </button>
            <button onClick={confirm} className="flex flex-col items-center gap-1 text-green-400">
              <CheckCircle size={28} />
              <span className="text-xs">使用する</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
