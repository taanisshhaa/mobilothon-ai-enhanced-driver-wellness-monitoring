"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// MediaPipe Tasks Vision (install in mobilothon):
//   npm i @mediapipe/tasks-vision
// Loaded dynamically to avoid SSR issues.
type FaceLandmarkerType = any
type FilesetResolverType = any

const LEFT_EYE = [33, 160, 158, 133, 153, 144]
const RIGHT_EYE = [362, 385, 387, 263, 373, 380]

function distance(a: number[], b: number[]) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.hypot(dx, dy)
}

function eyeAspectRatio(landmarks: number[][], idx: number[]) {
  const p1 = landmarks[idx[0]]
  const p2 = landmarks[idx[1]]
  const p3 = landmarks[idx[2]]
  const p4 = landmarks[idx[3]]
  const p5 = landmarks[idx[4]]
  const p6 = landmarks[idx[5]]
  const A = distance(p2, p6)
  const B = distance(p3, p5)
  const C = distance(p1, p4)
  return (A + B) / (2.0 * C)
}

function mouthOpeningRatio(landmarks: number[][]) {
  const top = landmarks[13]
  const bottom = landmarks[14]
  const left = landmarks[61]
  const right = landmarks[291]
  const vertical = distance(top, bottom)
  const horizontal = distance(left, right)
  return vertical / horizontal
}

export default function CameraPanel() {
  const [phase, setPhase] = useState<"idle" | "requesting" | "calib_open" | "calib_closed" | "running" | "denied" | "error">("idle")
  const phaseRef = useRef<typeof phase>("idle")
  const [blinkCount, setBlinkCount] = useState(0)
  const [displayBlinkCount, setDisplayBlinkCount] = useState(0) // interval display
  const [totalBlinkCount, setTotalBlinkCount] = useState(0) // cumulative display
  const [currentEAR, setCurrentEAR] = useState<number | null>(null) // for debugging
  const [forecast, setForecast] = useState<{ t_plus_min: number; fatigue_score: number }[] | null>(null)
  const [lastSend, setLastSend] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const landmarkerRef = useRef<FaceLandmarkerType | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // calibration
  const openSamplesRef = useRef<number[]>([])
  const closedSamplesRef = useRef<number[]>([])
  const thresholdsRef = useRef<{ low: number; high: number } | null>(null)
  const blinkStateRef = useRef<boolean>(false)
  const lastSendAtRef = useRef<number>(0)
  const calibStartRef = useRef<number>(0)
  const blinkCountRef = useRef<number>(0) // track blinks per interval
  const totalBlinkCountRef = useRef<number>(0)
  const lastAlertTimeRef = useRef<number>(0) // prevent spam beeps
  // blink timing & smoothing
  const closedStartRef = useRef<number | null>(null)
  const refractoryUntilRef = useRef<number>(0)
  const emaEarRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  // (Using backend fatigue score for alerts, like original Python module)

  const initMediaAndModel = useCallback(async () => {
    try {
      setPhase("requesting")
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const vision = await import("@mediapipe/tasks-vision")
      const FilesetResolver: FilesetResolverType = vision.FilesetResolver
      const FaceLandmarker: FaceLandmarkerType = vision.FaceLandmarker
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )
      landmarkerRef.current = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      })

      // prepare canvas for optional debug drawing
      if (canvasRef.current && videoRef.current) {
        canvasRef.current.width = 640
        canvasRef.current.height = 360
        ctxRef.current = canvasRef.current.getContext("2d")
      }

      // begin calibration
      setPhase("calib_open"); phaseRef.current = "calib_open"
      openSamplesRef.current = []
      closedSamplesRef.current = []
      thresholdsRef.current = null
      blinkStateRef.current = false
      setBlinkCount(0)
      setDisplayBlinkCount(0)
      blinkCountRef.current = 0
      totalBlinkCountRef.current = 0

      calibStartRef.current = performance.now()
      const run = () => {
        const now = performance.now()
        processFrame()
        // advance phases based on both time and sample count (face must be detected)
        const elapsed = now - calibStartRef.current
        const minSamples = 60
        if (phaseRef.current === "calib_open") {
          if (elapsed >= 3000 && openSamplesRef.current.length >= minSamples) {
            setPhase("calib_closed"); phaseRef.current = "calib_closed"
            calibStartRef.current = now
          }
        } else if (phaseRef.current === "calib_closed") {
          const enoughTime = elapsed >= 3000
          const enoughSamples = closedSamplesRef.current.length >= minSamples
          if (enoughTime && enoughSamples) {
            const openAvg = avg(openSamplesRef.current) || 0.3
            const closedAvg = avg(closedSamplesRef.current) || 0.2
            // Original Python thresholds
            const low = closedAvg + 0.1 * (openAvg - closedAvg)
            const high = openAvg - 0.1 * (openAvg - closedAvg)
            thresholdsRef.current = { low, high }
            setPhase("running"); phaseRef.current = "running"
          }
        }
        rafRef.current = requestAnimationFrame(run)
      }
      rafRef.current = requestAnimationFrame(run)
    } catch (e: any) {
      if (e?.name === "NotAllowedError") setPhase("denied")
      else setPhase("error")
    }
  }, [phase])

  const teardown = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setPhase("idle")
  }, [])

  const processFrame = useCallback(() => {
    const landmarker = landmarkerRef.current
    const video = videoRef.current
    if (!landmarker || !video) return
    // Ensure video has dimensions and is ready
    if (!video.videoWidth || !video.videoHeight) return
    if (video.readyState < 2) return // not enough data loaded
    if (video.paused || video.ended) return // video must be playing

    let lm: any[] | undefined
    try {
      const timestamp = performance.now()
      const result = landmarker.detectForVideo(video, timestamp)
      lm = result?.faceLandmarks?.[0]
      if (!lm || lm.length === 0) {
        setFaceDetected(false)
        return
      }
      setFaceDetected(true)
    } catch (error) {
      console.warn("MediaPipe detection error:", error)
      setFaceDetected(false)
      return
    }
    
    // landmarks normalized [0..1]; convert to px for ratios using width/height
    if (!lm) return
    const w = video.videoWidth
    const h = video.videoHeight
    const pts: number[][] = lm.map((p: any) => [p.x * w, p.y * h])

    const leftEAR = eyeAspectRatio(pts, LEFT_EYE)
    const rightEAR = eyeAspectRatio(pts, RIGHT_EYE)
    let ear = (leftEAR + rightEAR) / 2

    // exponential smoothing to reduce noise
    const ts = performance.now()
    if (emaEarRef.current == null) {
      emaEarRef.current = ear
      lastTsRef.current = ts
    } else {
      const alpha = 0.5 // smoothing factor
      emaEarRef.current = alpha * ear + (1 - alpha) * (emaEarRef.current as number)
    }
    ear = emaEarRef.current as number
    setCurrentEAR(ear) // update display

    // head tilt via eye corners
    const left_eye = pts[33]
    const right_eye = pts[263]
    const dx = right_eye[0] - left_eye[0]
    const dy = right_eye[1] - left_eye[1]
    const headTilt = (Math.atan2(dy, dx) * 180) / Math.PI

    const yawn = mouthOpeningRatio(pts)

    // calibration collection
    if (phaseRef.current === "calib_open") {
      openSamplesRef.current.push(ear)
      return
    }
    if (phaseRef.current === "calib_closed") {
      closedSamplesRef.current.push(ear)
      return
    }

    // running: accurate blink detection with hysteresis and duration constraints
    const thr = thresholdsRef.current
    if (!thr) return
    
    // Original blink logic using calibrated low/high thresholds
    const closeThreshold = thr.low
    const openThreshold = thr.high
    
    const nowMs = ts

    // Blink detection exactly like Python module (no duration gating)
    if (ear < closeThreshold && !blinkStateRef.current) {
      // Eyes just closed
      blinkStateRef.current = true
      closedStartRef.current = nowMs
    } else if (ear >= openThreshold && blinkStateRef.current) {
      // Eyes just opened - evaluate blink duration
      blinkStateRef.current = false
      blinkCountRef.current += 1
      totalBlinkCountRef.current += 1
      setDisplayBlinkCount(blinkCountRef.current)
      setTotalBlinkCount(totalBlinkCountRef.current)
    }

    // periodic send every 3s (reset blink count per interval like Python code)
    const now = performance.now()
    if (!lastSendAtRef.current || now - lastSendAtRef.current > 3000) {
      lastSendAtRef.current = now
      const currentBlinkCount = blinkCountRef.current
      blinkCountRef.current = 0 // reset for next interval
      setDisplayBlinkCount(0) // reset display
      
      void postMetrics({ 
        eye_ratio: ear, 
        blink_count: currentBlinkCount, 
        head_tilt: headTilt, 
        yawn_ratio: yawn
      })
    }
  }, [phase])

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 1000 // 1000 Hz beep
      oscillator.type = "sine"
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.warn("Could not play beep:", e)
    }
  }, [])

  const postMetrics = useCallback(async (payload: { eye_ratio: number; blink_count: number; head_tilt: number; yawn_ratio: number }) => {
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setLastSend(new Date().toLocaleTimeString())
        
        // Play beep if alert status (prevent spam - max once per 2 seconds)
        if (data.status === "alert") {
          const now = performance.now()
          if (!lastAlertTimeRef.current || now - lastAlertTimeRef.current > 2000) {
            lastAlertTimeRef.current = now
            playBeep()
          }
        }
      }
    } catch {
      // ignore transient failures
    }
  }, [playBeep])

  const fetchForecast = useCallback(async () => {
    try {
      const res = await fetch("/api/predict_next", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setForecast(data?.predictions ?? null)
    } catch {
      setForecast(null)
    }
  }, [])

  useEffect(() => {
    return () => {
      teardown()
    }
  }, [teardown])

  return (
    <div className="bg-[#1E293B] rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#22D3EE]">
            Camera
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">State:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              phase === "running" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" :
              phase === "calib_open" || phase === "calib_closed" ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" :
              phase === "idle" ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white" :
              "bg-gradient-to-r from-red-500 to-pink-500 text-white"
            }`}>
              {phase}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative rounded-xl overflow-hidden bg-black p-1">
              <video ref={videoRef} width={640} height={360} playsInline muted className="bg-black rounded-lg w-full h-auto" />
            </div>
            <canvas ref={canvasRef} width={640} height={360} className="hidden" />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {phase === "idle" && (
              <button 
                onClick={initMediaAndModel} 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] hover:from-[#3B82F6] hover:to-[#22D3EE] text-white font-medium shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-200"
              >
                Start & Calibrate
              </button>
            )}
            {phase === "requesting" && (
              <span className="text-sm bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-600">
                <span className="text-gray-300 font-medium">Requesting camera...</span>
              </span>
            )}
            {phase === "calib_open" && (
              <span className="text-sm bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-medium">
                  Calibration: keep eyes OPEN... samples: <span className="font-bold">{openSamplesRef.current.length}</span> {faceDetected ? "✅" : "❌"}
                </span>
              </span>
            )}
            {phase === "calib_closed" && (
              <span className="text-sm bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-medium">
                  Calibration: CLOSE eyes... samples: <span className="font-bold">{closedSamplesRef.current.length}</span> {faceDetected ? "✅" : "❌"}
                </span>
              </span>
            )}
            {phase === "running" && (
              <>
                <button 
                  onClick={fetchForecast} 
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] hover:from-[#3B82F6] hover:to-[#22D3EE] text-white font-medium shadow-md hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-200"
                >
                  Get 5-min forecast
                </button>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-semibold">
                      Blinks (total): <span className="text-green-600">{totalBlinkCount}</span>
                    </span>
                  </span>
                  <span className="text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                      Interval: <span className="text-blue-600">{displayBlinkCount}</span>
                    </span>
                  </span>
                  {currentEAR !== null && (
                    <span className="text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
                        EAR: <span className="text-purple-600">{currentEAR.toFixed(3)}</span>
                      </span>
                    </span>
                  )}
                  {thresholdsRef.current && (
                    <span className="text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                      <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-semibold text-xs">
                        low={thresholdsRef.current.low.toFixed(3)}, high={thresholdsRef.current.high.toFixed(3)}
                      </span>
                    </span>
                  )}
                  {lastSend && (
                    <span className="text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/20">
                      <span className="text-gray-600 font-medium">Last sent: {lastSend}</span>
                    </span>
                  )}
                </div>
                <button 
                  onClick={teardown} 
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium shadow-md hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-200"
                >
                  Stop
                </button>
              </>
            )}
            {phase === "denied" && (
              <div className="text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20">
                <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent font-medium">
                  Permission denied. Allow camera in the browser.
                </span>
              </div>
            )}
            {phase === "error" && (
              <div className="text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20">
                <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent font-medium">
                  Could not initialize camera/model.
                </span>
              </div>
            )}
          </div>
          {forecast && (
            <div className="px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600">
              <span className="text-sm font-medium text-[#22D3EE]">
                Forecast: {forecast.map(f => `${f.t_plus_min}m:${f.fatigue_score}`).join("  ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


