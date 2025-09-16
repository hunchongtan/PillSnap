"use client"

import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export interface WebcamCaptureProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
  open: boolean
}

function getDefaultFacingMode() {
  if (typeof window !== 'undefined') {
    const ua = window.navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i.test(ua)
    return isMobile ? 'environment' : 'user'
  }
  return 'user'
}

export function WebcamCapture({ onCapture, onClose, open }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const facingMode = getDefaultFacingMode()

  useEffect(() => {
    if (!open) return
    let active = true
    const start = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false })
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          try {
            await videoRef.current.play()
          } catch {}
        }
      } catch {
        onClose()
      }
    }
    start()
    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [open, onClose, facingMode])

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleCapture = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current || document.createElement('canvas')
    if (!canvasRef.current) canvasRef.current = canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      onCapture(canvas.toDataURL('image/jpeg', 0.95))
      stopStream()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs flex flex-col items-center relative">
        <video ref={videoRef} autoPlay playsInline muted className="rounded w-full h-48 object-cover mb-2 mt-2" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-2 w-full mt-2">
          <Button type="button" onClick={handleCapture} className="flex-1">Take Photo</Button>
          <Button type="button" variant="outline" onClick={() => { stopStream(); onClose() }} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  )
}
