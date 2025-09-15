"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, RotateCcw } from 'lucide-react'

export interface WebcamCaptureProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
  open: boolean
}

// Utility ensures facingMode selection based on device
function getDefaultFacingMode() {
  if (typeof window === 'undefined') return 'environment'
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  return isMobile ? 'environment' : 'user'
}

export function WebcamCapture({ onCapture, onClose, open }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<string>(getDefaultFacingMode())
  const [capturing, setCapturing] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const INIT_TIMEOUT_MS = 8000

  const stopTracks = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
  }, [stream])

  const startStream = useCallback(async () => {
    setInitializing(true)
    setError(null)
    stopTracks()
    let timeoutId: any
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode as any,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      // Start timeout guard
      timeoutId = setTimeout(() => {
        if (initializing) {
          console.warn('Camera init timeout')
          setError('Camera is taking too long to start. You can retry or upload a file instead.')
          setInitializing(false)
          stopTracks()
        }
      }, INIT_TIMEOUT_MS)

      const media = await navigator.mediaDevices.getUserMedia(constraints)
      if (!videoRef.current) {
        media.getTracks().forEach((t) => t.stop())
        return
      }
      setStream(media)
      videoRef.current.srcObject = media

      // When metadata loads, we deem initialization done
      const handleLoaded = () => {
        setInitializing(false)
      }
      videoRef.current.addEventListener('loadedmetadata', handleLoaded, { once: true })
      // Fallback: if metadata never fires quickly, clear after 500ms
      setTimeout(() => setInitializing(false), 500)
    } catch (e) {
      console.error('Webcam permission/start error', e)
      setError('Camera access denied or unavailable. Try retrying or file upload.')
      setInitializing(false)
    } finally {
      clearTimeout(timeoutId)
    }
  }, [facingMode, initializing, stopTracks])

  // Start / restart when opened or facing mode changes / attempt increments
  useEffect(() => {
    if (!open) {
      stopTracks()
      setError(null)
      setInitializing(false)
      return
    }
    setAttempt((a) => a) // no-op for clarity
    startStream()
    return () => {
      stopTracks()
    }
  }, [open, facingMode, attempt, startStream, stopTracks])

  // Clean up on unmount
  useEffect(() => stopTracks, [stopTracks])

  const handleCapture = async () => {
    if (!videoRef.current) return
    setCapturing(true)
    try {
      const video = videoRef.current
      const canvas = canvasRef.current || document.createElement('canvas')
      canvasRef.current = canvas
      const w = video.videoWidth || 1280
      const h = video.videoHeight || 720
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.drawImage(video, 0, 0, w, h)
      // compress ~0.92 quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      onCapture(dataUrl)
    } catch (e) {
      console.error('Capture failed', e)
      setError('Failed to capture image.')
    } finally {
      setCapturing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Fallback overlay for very small mobile screens (Dialog already responsive)
  return (
    <Dialog open={open} onOpenChange={(o) => { if(!o) onClose() }}>
      <DialogContent className="max-w-[90vw] w-full sm:max-w-2xl p-4 sm:p-6" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Take a photo</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
          {error ? (
            <div className="text-center p-6 text-sm text-destructive space-y-3">
              <p>{error}</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setAttempt(a => a + 1) }}>
                <RotateCcw className="w-4 h-4 mr-1" /> Retry
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={`w-full h-full object-contain ${initializing ? 'opacity-0' : 'opacity-100 transition-opacity'}`}
                autoPlay
                playsInline
                muted
              />
              {initializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-sm" role="status" aria-live="polite">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p>Starting camera…</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-4 justify-between">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
              disabled={!!error || initializing}
            >
              Flip Camera
            </Button>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleCapture} disabled={!!error || capturing || initializing}>
              <Camera className="w-4 h-4 mr-2" />
              {capturing ? 'Capturing...' : initializing ? 'Initializing…' : 'Take Photo'}
            </Button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
