"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export default function DebugPage() {
  const [apiStatus, setApiStatus] = useState<"idle" | "ok" | "error">("idle")
  const [apiData, setApiData] = useState<any>(null)
  const [apiError, setApiError] = useState<string>("")

  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "requesting" | "ready" | "denied" | "error"
  >("idle")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      setApiStatus("idle")
      setApiError("")
      const res = await fetch("/api/summary", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApiData(data)
      setApiStatus("ok")
    } catch (err: any) {
      setApiError(err?.message ?? "Failed to fetch")
      setApiStatus("error")
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraStatus("requesting")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraStatus("ready")
    } catch (err: any) {
      if (err?.name === "NotAllowedError") setCameraStatus("denied")
      else setCameraStatus("error")
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraStatus("idle")
  }, [])

  useEffect(() => {
    return () => {
      // cleanup on unmount
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Debug: API + Camera</h1>

      <section style={{ display: "grid", gap: 12 }}>
        <h2>API Connectivity</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={fetchSummary} style={{ padding: "6px 12px" }}>Test /summary</button>
          <span>Status: {apiStatus}</span>
        </div>
        {apiStatus === "ok" && (
          <pre style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 8, overflowX: "auto" }}>
            {JSON.stringify(apiData, null, 2)}
          </pre>
        )}
        {apiStatus === "error" && <div style={{ color: "#e33" }}>Error: {apiError}</div>}
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2>Camera</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {cameraStatus !== "ready" && (
            <button onClick={startCamera} style={{ padding: "6px 12px" }}>Start Camera</button>
          )}
          {cameraStatus === "ready" && (
            <button onClick={stopCamera} style={{ padding: "6px 12px" }}>Stop Camera</button>
          )}
          <span>Status: {cameraStatus}</span>
        </div>
        <video ref={videoRef} width={480} height={360} playsInline muted style={{ background: "#000", borderRadius: 8 }} />
        {cameraStatus === "denied" && (
          <div style={{ color: "#e33" }}>
            Permission denied. In Chrome, click the camera icon in the address bar and allow access.
          </div>
        )}
        {cameraStatus === "error" && <div style={{ color: "#e33" }}>Could not access camera.</div>}
      </section>
    </div>
  )
}


