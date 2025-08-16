

import React, { useRef, useState } from "react"
import { CloseX } from "@/components/close-x"

interface WebcamCaptureProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export default function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  function getDefaultFacingMode() {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent
      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i.test(ua)
      return isMobile ? "environment" : "user"
    }
    return "user"
  }
  const facingMode = getDefaultFacingMode()

  React.useEffect(() => {
    let active = true
    navigator.mediaDevices.getUserMedia({ video: { facingMode } })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      })
      .catch(() => onClose())
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
  }, [onClose])



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
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      onCapture(canvas.toDataURL("image/jpeg", 0.95))
      stopStream()
      onClose()
    }
  }

  const handleCancel = () => {
    stopStream()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs flex flex-col items-center relative">
        {/* OUTER close button, top-right, relative to card wrapper */}
        <CloseX onClick={handleCancel} className="absolute top-2 right-2" />
        <video ref={videoRef} autoPlay playsInline className="rounded w-full h-48 object-cover mb-2 mt-6" />
  {/* Switch Camera button removed for realistic default view */}
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-2 w-full mt-2">
          <button
            type="button"
            onClick={handleCapture}
            aria-label="Take Photo"
            className="flex-1 h-10 px-4 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-center"
          >
            Take Photo
          </button>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel"
            className="flex-1 h-10 px-4 text-sm font-medium rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
