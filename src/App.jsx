import React, { useState, useEffect } from "react"
import { 
  Play, Sparkles, Sliders, Image as ImageIcon, Video, HelpCircle, AlertCircle, Upload, ImagePlus, 
  Settings, Key, CheckCircle, RefreshCw, Layers, Download, ExternalLink, Moon,
  Clock, Maximize2, Monitor, Trash2, Flame, Film, User, Eye, ArrowRight, Sparkle,
  History, HelpCircle as HelpIcon, Heart, Info, Copy, Check
} from "lucide-react"

// Aspect ratio options
const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape (16:9)", desc: "Cocok untuk YouTube, Presentasi, Film", w: 1152, h: 768, icon: "🖥️" },
  { value: "9:16", label: "Vertical (9:16)", desc: "Cocok untuk TikTok, Reels, & Shorts", w: 768, h: 1152, icon: "📱" },
  { value: "1:1", label: "Square (1:1)", desc: "Cocok untuk Instagram Feed & Avatar", w: 800, h: 800, icon: "⏹️" },
  { value: "4:3", label: "Classic (4:3)", desc: "Rasio Retro, Kamera Klasik", w: 1024, h: 768, icon: "📺" }
]

// Frame and duration mappings
const FRAME_OPTIONS = [
  { value: 81, label: "3 Detik (81 frames)", fps: 24, desc: "Sangat cepat, hemat kuota", durationText: "3s" },
  { value: 121, label: "5 Detik (121 frames)", fps: 24, desc: "Kualitas standar produksi", durationText: "5s" },
  { value: 241, label: "10 Detik (241 frames)", fps: 24, desc: "Visual cinematic panjang", durationText: "10s" },
  { value: 441, label: "18 Detik (441 frames)", fps: 24, desc: "Batas maksimal Agnes API", durationText: "18s" }
]

// Resolutions standard mapping
const RESOLUTION_TIERS = [
  { id: "480p", label: "480p (Standard Quality)", desc: "Rendering super cepat & lancar", multiplier: 0.6, badge: "FAST" },
  { id: "720p", label: "720p (HD Quality)", desc: "Keseimbangan kualitas & kecepatan", multiplier: 1.0, badge: "POPULER" },
  { id: "1080p", label: "1080p (Full HD Cinematic)", desc: "Visual ultra premium, detail bioskop", multiplier: 1.5, badge: "PREMIUM" }
]

// Sample Prompts
const SAMPLE_PROMPTS = [
  {
    title: "🌅 Golden Hour Sunset Beach",
    desc: "A cinematic slow-motion tracking shot of a beautiful young woman walking along a white sand beach during golden sunset hour, soft crashing waves, warm backlight, lens flare, highly detailed, photorealistic 8k, majestic mood.",
    vibe: "Cinematic, Realistis"
  },
  {
    title: "🏎️ Cyberpunk Tokyo Rain Drive",
    desc: "A futuristic chrome sports car racing down a neon-lit Tokyo street under heavy rain, neon lights reflecting on wet asphalt, camera low to the ground following the car, dramatic motion blur, steam rising, cyberpunk 2077 aesthetic.",
    vibe: "Fast Motion, Cyberpunk"
  },
  {
    title: "🪐 Martian Astronaut Journey",
    desc: "An epic wide-angle dolly shot of an astronaut walking across a dusty, crimson Mars desert, towering red canyons in the background, a second blue moon visible in the orange sky, dust particles swirling in wind, sci-fi masterpiece.",
    vibe: "Sci-Fi, Atmosferik"
  },
  {
    title: "🐉 Sleeping Ruby Dragon",
    desc: "A macro close-up of a giant ruby-scaled dragon slowly opening its slit-pupil golden eye, smoke gently swirling from its nostrils, embers drifting in a dark, gold-filled cavern, dramatic low-key cinematic lighting.",
    vibe: "Fantasi, Mistis"
  }
]

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("agnes_api_key") || "")
  const [activeTab, setActiveTab] = useState("generate") 
  const [copiedPromptId, setCopiedPromptId] = useState(null)
  
  // Generator states
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [numFrames, setNumFrames] = useState(121)
  const [resTier, setResTier] = useState("720p")
  const [seed, setSeed] = useState("")
  const [mode, setMode] = useState("txt2vid") 
  
  // Image URL inputs
  const [imgUrl1, setImgUrl1] = useState("")
  const [imgUrl2, setImgUrl2] = useState("")
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")
  const [imgbbKey, setImgbbKey] = useState(() => localStorage.getItem("imgbb_key") || "c1120fe4efc2441c39639f86056c4de4")
  
  // Progress & Statuses
  const [status, setStatus] = useState("idle") 
  const [errorMsg, setErrorMsg] = useState("")
  const [taskId, setTaskId] = useState("")
  const [videoId, setVideoId] = useState("")
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState("")
  
  // History Saved
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agnes_video_history")) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem("agnes_video_history", JSON.stringify(history))
  }, [history])

  // Polling Status Video
  useEffect(() => {
    if (!videoId || (status !== "queued" && status !== "generating")) return

    let isMounted = true
    let intervalId = setInterval(async () => {
      try {
        const response = await fetch(`https://apihub.agnes-ai.com/agnesapi?video_id=${videoId}`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`
          }
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch status from Agnes API")
        }
        
        const data = await response.json()
        if (!isMounted) return
        
        console.log("Polling result:", data)
        
        if (data.progress !== undefined) {
          setProgress(data.progress)
        }
        
        if (data.status === "completed") {
          setStatus("completed")
          setVideoUrl(data.remixed_from_video_id)
          setProgress(100)
          
          const newItem = {
            id: taskId || Date.now().toString(),
            videoId: videoId,
            prompt,
            mode,
            videoUrl: data.remixed_from_video_id,
            timestamp: new Date().toLocaleString("id-ID"),
            aspectRatio,
            resolution: resTier,
            duration: FRAME_OPTIONS.find(o => o.value === numFrames)?.durationText || "5s"
          }
          setHistory(prev => [newItem, ...prev])
          clearInterval(intervalId)
        } else if (data.status === "failed") {
          setStatus("failed")
          setErrorMsg(data.error?.message || "Gagal me-render video di server Agnes AI.")
          clearInterval(intervalId)
        } else if (data.status === "in_progress") {
          setStatus("generating")
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 4000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [videoId, status, apiKey])

  const handleSaveApiKey = (e) => {
    e.preventDefault()
    const trimmed = apiKey.trim()
    const trimmedImg = imgbbKey.trim()
    localStorage.setItem("agnes_api_key", trimmed)
    localStorage.setItem("imgbb_key", trimmedImg)
    alert("✨ API Key berhasil disimpan di browser lokal Anda!")
  }

  
  // =============================================
  // UPLOAD GAMBAR via ImgBB API (SUPPORT CORS!)
  // Daftar gratis 1 menit di https://api.imgbb.com/
  // =============================================
  const handleImageUpload = async (e, target) => {
    const file = e.target?.files?.[0]
    if (!file) return
    
    if (file.size > 32 * 1024 * 1024) {
      setUploadMsg("❌ Maksimal 32MB!")
      return
    }
    if (!file.type.startsWith("image/")) {
      setUploadMsg("❌ Hanya gambar!")
      return
    }

    const key = imgbbKey.trim()
    if (!key) {
      setUploadMsg("⚠️ Isi ImgBB API Key dulu di header!")
      return
    }

    setUploadingImg(true)
    setUploadMsg("⏳ Upload ke ImgBB...")

    const setUrl = (url) => {
      if (target === "img1") setImgUrl1(url)
      else setImgUrl2(url)
    }

    try {
      const fd = new FormData()
      fd.append("image", file)
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: "POST",
        body: fd
      })
      
      const json = await res.json()
      if (json.success && json.data?.url) {
        setUrl(json.data.url)
        setUploadMsg("✅ Berhasil!")
        setTimeout(() => setUploadMsg(""), 4000)
      } else {
        const err = json.error?.message || "Unknown"
        console.error("ImgBB error:", json)
        if (err.includes("forbidden") || err.includes("Forbidden")) {
          setUploadMsg("❌ Key ImgBB tidak valid. Dapatkan baru di api.imgbb.com")
        } else {
          setUploadMsg("❌ " + err)
        }
      }
    } catch (err) {
      setUploadMsg("❌ " + (err.message || "Error").substring(0, 50))
    } finally {
      setUploadingImg(false)
    }
  }  const handleDrop = (e, target) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      const fakeE = { target: { files: [file] } }
      handleImageUpload(fakeE, target)
    }
  }

const handleGenerate = async () => {
    if (!apiKey) {
      alert("⚠️ Masukkan API Key Agnes AI Anda terlebih dahulu di kolom header kanan atas!")
      return
    }
    if (!prompt.trim()) {
      alert("⚠️ Harap tulis prompt deskripsi video terlebih dahulu!")
      return
    }

    setStatus("submitting")
    setErrorMsg("")
    setProgress(0)
    setVideoUrl("")
    setTaskId("")
    setVideoId("")

    const selectedRatio = ASPECT_RATIOS.find(r => r.value === aspectRatio)
    const tier = RESOLUTION_TIERS.find(t => t.id === resTier)
    
    let width = Math.round(selectedRatio.w * tier.multiplier)
    let height = Math.round(selectedRatio.h * tier.multiplier)
    
    // Normalize multiples of 8
    width = Math.round(width / 8) * 8
    height = Math.round(height / 8) * 8

    const payload = {
      model: "agnes-video-v2.0",
      prompt: prompt.trim(),
      num_frames: numFrames,
      frame_rate: 24,
      width,
      height
    }

    if (negativePrompt.trim()) {
      payload.negative_prompt = negativePrompt.trim()
    }
    if (seed && !isNaN(Number(seed))) {
      payload.seed = Number(seed)
    }

    if (mode === "img2vid") {
      if (!imgUrl1.trim()) {
        alert("⚠️ Mohon masukkan URL gambar referensi!")
        setStatus("idle")
        return
      }
      payload.image = imgUrl1.trim()
    } else if (mode === "keyframes") {
      if (!imgUrl1.trim() || !imgUrl2.trim()) {
        alert("⚠️ Mohon masukkan kedua URL gambar keyframe awal dan akhir!")
        setStatus("idle")
        return
      }
      payload.extra_body = {
        image: [imgUrl1.trim(), imgUrl2.trim()],
        mode: "keyframes"
      }
    }

    try {
      const response = await fetch("https://apihub.agnes-ai.com/v1/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || `Gagal me-render video (${response.status})`)
      }

      const data = await response.json()
      setTaskId(data.task_id || data.id)
      setVideoId(data.video_id)
      setStatus("queued")
    } catch (err) {
      console.error(err)
      setStatus("failed")
      setErrorMsg(err.message || "Gagal terhubung ke server Agnes AI. Silakan periksa koneksi atau API Key Anda.")
    }
  }

  const handleDeleteHistory = (id) => {
    if (confirm("🗑️ Hapus video ini dari riwayat lokal?")) {
      setHistory(prev => prev.filter(item => item.id !== id))
    }
  }

  const handleCopyPrompt = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedPromptId(idx)
    setTimeout(() => setCopiedPromptId(null), 2000)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", paddingBottom: "4rem" }}>
      
      {/* GLOWING HEADER BACKGROUND EFFECT */}
      <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: "250px", background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }}></div>

      {/* HEADER SECTION */}
      <header style={{ position: "relative", zIndex: 10, borderBottom: "1px solid #1e1e24", background: "rgba(9, 9, 11, 0.8)", backdropFilter: "blur(12px)", padding: "1rem 2rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* LOGO */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ background: "linear-gradient(135deg, #f43f5e, #8b5cf6)", borderRadius: "0.75rem", padding: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" }}>
            <Film size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.025em", background: "linear-gradient(to right, #ff7171, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Text-to-Video Free
              </h1>
              <span style={{ background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "#c084fc", fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "2rem", fontWeight: 700 }}>
                18s Max
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#a1a1aa" }}>Max 18 detik · 1080p · Image-to-Video · Keyframe · Gratis</p>
          </div>
        </div>

        {/* WEB INTERACTIVE NAVS */}
        <nav style={{ display: "flex", background: "#18181b", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid #27272a" }}>
          {[
            { id: "generate", label: "🎬 Studio 18s" },
            { id: "gallery", label: `🌌 Galeri Render (${history.length})` },
            { id: "docs", label: "📚 Panduan Studio" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "#27272a" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#a1a1aa",
                border: 0, borderRadius: "0.375rem", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* API SETTINGS QUICK FORM */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <form onSubmit={handleSaveApiKey} style={{ display: "flex", position: "relative" }}>
            <Key size={14} color="#f43f5e" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", zIndex: 12 }} />
            <input 
              type="password"
              placeholder="Agnes API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                background: "#09090b", border: "1px solid #27272a", borderRadius: "0.5rem 0 0 0.5rem", color: "#fff",
                padding: "0.5rem 0.5rem 0.5rem 2.25rem", fontSize: "0.78rem", width: "180px", transition: "all 0.2s", outline: "none"
              }}
            />
            <button 
              type="submit"
              style={{
                background: "linear-gradient(135deg, #f43f5e, #8b5cf6)", border: 0, borderRadius: "0 0.5rem 0.5rem 0", color: "#fff",
                padding: "0 0.75rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
              }}
            >
              Simpan
            </button>
          </form>
          <div style={{ display: "flex", position: "relative" }}>
            <Key size={14} color="#22c55e" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", zIndex: 12 }} />
            <input 
              type="password"
              placeholder="ImgBB API Key..."
              value={imgbbKey}
              onChange={(e) => setImgbbKey(e.target.value)}
              style={{
                background: "#09090b", border: "1px solid #27272a", borderRadius: "0.5rem", color: "#fff",
                padding: "0.5rem 0.5rem 0.5rem 2.25rem", fontSize: "0.78rem", width: "180px", transition: "all 0.2s", outline: "none"
              }}
            />
          </div>
          <a href="https://api.imgbb.com/" target="_blank" rel="noopener" style={{ fontSize: "0.65rem", color: "#22c55e", textDecoration: "none" }}>🔑 Dapatkan ImgBB Key Gratis →</a>
        </div>
          <a 
            href="https://platform.agnes-ai.com/settings/apiKeys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: "flex", padding: "0.55rem", borderRadius: "0.5rem", border: "1px solid #27272a", background: "#18181b", color: "#a1a1aa",
              transition: "all 0.2s", cursor: "pointer"
            }}
            title="Dapatkan API Key Gratis di Platform Agnes"
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#3f3f46" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.borderColor = "#27272a" }}
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </header>

      {/* CORE WORKSPACE LIMIT */}
      <main style={{ maxWidth: "1350px", margin: "0 auto", padding: "2.5rem 2rem", position: "relative", zIndex: 5 }}>
        
        {/* API KEY EMPTY ALERT BANNER */}
        {!apiKey && (
          <div style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.1) 0%, rgba(139,92,246,0.1) 100%)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "2.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertCircle size={22} color="#f43f5e" />
              <div>
                <h4 style={{ margin: "0 0 0.25rem", color: "#fff", fontSize: "0.9rem", fontWeight: 700 }}>API Key Agnes AI Diperlukan</h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#a1a1aa" }}>Masukkan API Key gratis Anda di kanan atas untuk mengaktifkan video rendering di server awan.</p>
              </div>
            </div>
            <a 
              href="https://platform.agnes-ai.com/settings/apiKeys" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.5rem", padding: "0.5rem 1rem", color: "#fff", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.target.style.background = "#27272a" }}
              onMouseLeave={(e) => { e.target.style.background = "#18181b" }}
            >
              Dapatkan Key Gratis <ArrowRight size={14} />
            </a>
          </div>
        )}

        {/* TAB 1: STUDIO GENERATOR */}
        {activeTab === "generate" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2.5rem" }}>
            
            {/* LEFT COLUMN: PARAMETERS FOR CONTROL */}
            <div style={{ background: "#141416", border: "1px solid #232329", borderRadius: "1rem", padding: "2rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #232329", paddingBottom: "1rem", marginBottom: "1.75rem" }}>
                <Sparkles size={20} color="#c084fc" />
                <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Konfigurasi Kreatif Studio</h2>
              </div>

              {/* MODE PILIHAN TAB */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Mode Operasional</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", background: "#09090b", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid #232329" }}>
                  {[
                    { id: "txt2vid", label: "📝 Text to Video" },
                    { id: "img2vid", label: "🖼️ Image to Video" },
                    { id: "keyframes", label: "✨ Keyframes Transition" }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setMode(item.id)}
                      style={{
                        padding: "0.6rem", border: 0, borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.2s",
                        background: mode === item.id ? "linear-gradient(135deg, #f43f5e, #8b5cf6)" : "transparent",
                        color: mode === item.id ? "#fff" : "#71717a"
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION & PROMPT */}
              <div style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", alignItems: "center" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Deskripsi / Prompt Video</label>
                  <span style={{ fontSize: "0.7rem", color: "#c084fc", fontWeight: 600 }}>Bahasa Inggris Direkomendasikan</span>
                </div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Deskripsikan video impian Anda secara detail di sini. Contoh: A majestic cinematic shot of a futuristic spaceship lands on wet neon cyberpunk road, lens flare, reflections, camera tracking..."
                  style={{
                    width: "100%", height: "110px", padding: "0.85rem", background: "#09090b", border: "1px solid #232329", borderRadius: "0.5rem",
                    color: "#fff", resize: "none", fontSize: "0.875rem", boxSizing: "border-box", transition: "all 0.2s", outline: "none", lineHeight: "1.5"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
                  onBlur={(e) => e.target.style.borderColor = "#232329"}
                />
              </div>

              {/* IMAGE URL ON DEMAND */}
              {mode === "img2vid" && (
                <div style={{ marginBottom: "1.75rem", background: "#09090b", border: "1px solid #232329", padding: "1.25rem", borderRadius: "0.75rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                    <ImageIcon size={14} color="#f43f5e" /> Gambar Referensi
                  </label>
                  
                  {/* UPLOAD ZONE */}
                  <label 
                    onDrop={(e) => handleDrop(e, "img1")}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      width: "100%", padding: "1.5rem", background: "rgba(139, 92, 246, 0.05)", 
                      border: "2px dashed rgba(139, 92, 246, 0.3)", borderRadius: "0.75rem",
                      cursor: "pointer", transition: "0.2s", marginBottom: "0.75rem"
                    }}
                    onMouseEnter={(e) => { e.target.style.background = "rgba(139, 92, 246, 0.1)"; e.target.style.borderColor = "rgba(139, 92, 246, 0.6)" }}
                    onMouseLeave={(e) => { e.target.style.background = "rgba(139, 92, 246, 0.05)"; e.target.style.borderColor = "rgba(139, 92, 246, 0.3)" }}
                  >
                    <input 
                      type="file" accept="image/*" hidden
                      onChange={(e) => handleImageUpload(e, "img1")}
                      disabled={uploadingImg}
                    />
                    {uploadingImg ? (
                      <><RefreshCw size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} color="#8b5cf6" /><span style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>Uploading...</span></>
                    ) : (
                      <><Upload size={18} color="#8b5cf6" /><span style={{ color: "#a1a1aa", fontSize: "0.85rem", fontWeight: 600 }}>Klik atau Drag & Drop Foto di Sini</span><span style={{ color: "#22c55e", fontSize: "0.7rem", fontWeight: 600 }}>— Auto-upload via Imgur (no login!)</span></>
                    )}
                  </label>
                  
                  {uploadMsg && (
                    <div style={{ marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: uploadMsg.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(244,63,94,0.1)", borderRadius: "0.4rem", fontSize: "0.75rem", color: uploadMsg.startsWith("✅") ? "#22c55e" : "#f43f5e", fontWeight: 600 }}>
                      {uploadMsg}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div style={{ flex: 1, height: "1px", background: "#232329" }}></div>
                    <span style={{ color: "#52525b", fontSize: "0.7rem", fontWeight: 600 }}>ATAU PASTE URL</span>
                    <div style={{ flex: 1, height: "1px", background: "#232329" }}></div>
                  </div>

                  <input 
                    type="url"
                    placeholder="Atau paste URL gambar publik (e.g. https://domain.com/photo.jpg)"
                    value={imgUrl1}
                    onChange={(e) => setImgUrl1(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem", background: "#141416", border: "1px solid #232329", borderRadius: "0.5rem",
                      color: "#fff", fontSize: "0.85rem", boxSizing: "border-box", outline: "none"
                    }}
                  />
                  {imgUrl1 && (
                    <div style={{ marginTop: "1rem", position: "relative", border: "1px solid #232329", borderRadius: "0.5rem", overflow: "hidden" }}>
                      <img src={imgUrl1} alt="Preview" style={{ width: "100%", maxHeight: "150px", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", background: "rgba(139, 92, 246, 0.9)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontWeight: 600, color: "#fff" }}>Gambar Aktif</div>
                    </div>
                  )}
                </div>
              )}

              {mode === "keyframes" && (
                <div style={{ marginBottom: "1.75rem", background: "#09090b", border: "1px solid #232329", padding: "1.25rem", borderRadius: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                      🎬 Keyframe Awal (Start)
                    </label>
                    {/* UPLOAD KEYFRAME START */}
                    <label 
                      onDrop={(e) => handleDrop(e, "img1")}
                      onDragOver={(e) => e.preventDefault()}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
                        width: "100%", padding: "0.6rem", background: "rgba(139, 92, 246, 0.05)", 
                        border: "2px dashed rgba(139, 92, 246, 0.25)", borderRadius: "0.4rem",
                        cursor: "pointer", marginBottom: "0.5rem", transition: "0.15s"
                      }}
                      onMouseEnter={(e) => { e.target.style.background = "rgba(139, 92, 246, 0.1)"; e.target.style.borderColor = "rgba(139, 92, 246, 0.6)" }}
                      onMouseLeave={(e) => { e.target.style.background = "rgba(139, 92, 246, 0.05)"; e.target.style.borderColor = "rgba(139, 92, 246, 0.25)" }}
                    >
                      <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e, "img1")} disabled={uploadingImg} />
                      <ImagePlus size={14} color="#8b5cf6" />
                      <span style={{ color: "#a1a1aa", fontSize: "0.7rem", fontWeight: 600 }}>Upload Foto</span>
                    </label>
                    <input 
                      type="url"
                      placeholder="Atau URL Gambar Start..."
                      value={imgUrl1}
                      onChange={(e) => setImgUrl1(e.target.value)}
                      style={{
                        width: "100%", padding: "0.75rem", background: "#141416", border: "1px solid #232329", borderRadius: "0.5rem",
                        color: "#fff", fontSize: "0.85rem", boxSizing: "border-box", outline: "none"
                      }}
                    />
                    {imgUrl1 && (
                      <img src={imgUrl1} alt="Start Preview" style={{ marginTop: "0.75rem", width: "100%", height: "100px", objectFit: "cover", borderRadius: "0.35rem", border: "1px solid #232329" }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                      🏁 Keyframe Akhir (End)
                    </label>
                    {/* UPLOAD KEYFRAME END */}
                    <label 
                      onDrop={(e) => handleDrop(e, "img2")}
                      onDragOver={(e) => e.preventDefault()}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
                        width: "100%", padding: "0.6rem", background: "rgba(139, 92, 246, 0.05)", 
                        border: "2px dashed rgba(139, 92, 246, 0.25)", borderRadius: "0.4rem",
                        cursor: "pointer", marginBottom: "0.5rem", transition: "0.15s"
                      }}
                      onMouseEnter={(e) => { e.target.style.background = "rgba(139, 92, 246, 0.1)"; e.target.style.borderColor = "rgba(139, 92, 246, 0.6)" }}
                      onMouseLeave={(e) => { e.target.style.background = "rgba(139, 92, 246, 0.05)"; e.target.style.borderColor = "rgba(139, 92, 246, 0.25)" }}
                    >
                      <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e, "img2")} disabled={uploadingImg} />
                      <ImagePlus size={14} color="#8b5cf6" />
                      <span style={{ color: "#a1a1aa", fontSize: "0.7rem", fontWeight: 600 }}>Upload Foto</span>
                    </label>
                    <input 
                      type="url"
                      placeholder="Atau URL Gambar End..."
                      value={imgUrl2}
                      onChange={(e) => setImgUrl2(e.target.value)}
                      style={{
                        width: "100%", padding: "0.75rem", background: "#141416", border: "1px solid #232329", borderRadius: "0.5rem",
                        color: "#fff", fontSize: "0.85rem", boxSizing: "border-box", outline: "none"
                      }}
                    />
                    {imgUrl2 && (
                      <img src={imgUrl2} alt="End Preview" style={{ marginTop: "0.75rem", width: "100%", height: "100px", objectFit: "cover", borderRadius: "0.35rem", border: "1px solid #232329" }} />
                    )}
                  </div>
                </div>
              )}

              {/* RESOLUTION LEVEL GRID */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Resolusi Output Maksimal</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {RESOLUTION_TIERS.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => setResTier(tier.id)}
                      style={{
                        padding: "1rem", border: "1px solid", borderRadius: "0.75rem", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                        borderColor: resTier === tier.id ? "#8b5cf6" : "#232329",
                        background: resTier === tier.id ? "rgba(139,92,246,0.08)" : "#09090b",
                        color: resTier === tier.id ? "#fff" : "#a1a1aa"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.85rem", color: resTier === tier.id ? "#c084fc" : "#e4e4e7" }}>{tier.label.split(" ")[0]}</span>
                        <span style={{ fontSize: "0.55rem", background: resTier === tier.id ? "#8b5cf6" : "#27272a", color: "#fff", padding: "0.15rem 0.35rem", borderRadius: "0.25rem", fontWeight: 700 }}>{tier.badge}</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#71717a", lineHeight: 1.3 }}>{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DURATION PRESET LIST */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Atur Durasi & Frames</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {FRAME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNumFrames(opt.value)}
                      style={{
                        padding: "1rem", border: "1px solid", borderRadius: "0.75rem", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                        borderColor: numFrames === opt.value ? "#3b82f6" : "#232329",
                        background: numFrames === opt.value ? "rgba(59,130,246,0.08)" : "#09090b",
                        color: numFrames === opt.value ? "#fff" : "#a1a1aa"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.85rem", color: numFrames === opt.value ? "#60a5fa" : "#e4e4e7" }}>{opt.label.split(" ")[0]} {opt.label.split(" ")[1]}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: numFrames === opt.value ? "#3b82f6" : "#71717a" }}>{opt.durationText}</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#71717a", lineHeight: 1.3 }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ASPECT RATIO SELECTORS */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Aspek Rasio Dimensi</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {ASPECT_RATIOS.map(ratio => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      style={{
                        padding: "0.85rem", border: "1px solid", borderRadius: "0.75rem", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                        borderColor: aspectRatio === ratio.value ? "#10b981" : "#232329",
                        background: aspectRatio === ratio.value ? "rgba(16,185,129,0.08)" : "#09090b",
                        color: aspectRatio === ratio.value ? "#fff" : "#a1a1aa"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "1rem" }}>{ratio.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: "0.85rem", color: aspectRatio === ratio.value ? "#34d399" : "#e4e4e7" }}>{ratio.label}</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#71717a" }}>{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ADVANCED EXTRA BODY SETTINGS */}
              <div style={{ background: "#09090b", border: "1px solid #232329", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <Sliders size={16} color="#8b5cf6" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Pengaturan Lanjutan (Opsional)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#71717a", marginBottom: "0.35rem", fontWeight: 600 }}>Negative Prompt</label>
                    <input 
                      type="text"
                      placeholder="blur, text, low resolution, watermark..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      style={{
                        width: "100%", padding: "0.6rem", background: "#141416", border: "1px solid #232329", borderRadius: "0.375rem",
                        color: "#fff", fontSize: "0.8rem", boxSizing: "border-box", outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#71717a", marginBottom: "0.35rem", fontWeight: 600 }}>Random Seed (Awan)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 524108"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      style={{
                        width: "100%", padding: "0.6rem", background: "#141416", border: "1px solid #232329", borderRadius: "0.375rem",
                        color: "#fff", fontSize: "0.8rem", boxSizing: "border-box", outline: "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* GENERATE SUBMIT ACTION BUTTON */}
              <button
                onClick={handleGenerate}
                disabled={status === "submitting" || status === "queued" || status === "generating"}
                style={{
                  width: "100%", padding: "1.1rem", border: 0, borderRadius: "0.75rem", cursor: "pointer", fontSize: "1rem", fontWeight: 800,
                  background: "linear-gradient(135deg, #f43f5e, #8b5cf6)", color: "#fff",
                  boxShadow: "0 4px 25px rgba(139, 92, 246, 0.25)", transition: "all 0.2s",
                  opacity: (status === "submitting" || status === "queued" || status === "generating") ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem"
                }}
              >
                {(status === "submitting" || status === "queued" || status === "generating") ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Sedang diproses... ({progress}%)</span>
                  </>
                ) : (
                  <>
                    <Play size={20} fill="#fff" />
                    <span>Generate Video Cinematic Sekarang</span>
                  </>
                )}
              </button>

            </div>

            {/* RIGHT COLUMN: SCREEN MONITOR AND PLAYBACK */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* VIDEO PLAYER MONITOR SCREEN */}
              <div style={{ background: "#141416", border: "1px solid #232329", borderRadius: "1rem", padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "480px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                
                {/* IDLE MONITOR SCREEN */}
                {status === "idle" && (
                  <div style={{ textAlign: "center", color: "#71717a", padding: "2rem" }}>
                    <div style={{ width: "80px", height: "80px", background: "#18181b", border: "1px solid #27272a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}>
                      <Video size={36} color="#71717a" />
                    </div>
                    <h3 style={{ color: "#fff", margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>Studio Monitor</h3>
                    <p style={{ fontSize: "0.85rem", color: "#71717a", maxWidth: "340px", margin: "0.5rem auto 0", lineHeight: 1.5 }}>
                      Sesuaikan pengaturan kreatif di sebelah kiri, lalu mulailah render. Pemantau video akan aktif saat rendering dimulai.
                    </p>
                  </div>
                )}

                {/* ACTIVE QUEUE OR GENERATION RENDERING */}
                {(status === "submitting" || status === "queued" || status === "generating") && (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    
                    {/* Ring progress bar animation spinner */}
                    <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 2.25rem" }}>
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="60" cy="60" r="50" fill="transparent" stroke="#1c1c21" strokeWidth="8" />
                        <circle cx="60" cy="60" r="50" fill="transparent" stroke="url(#gradient)" strokeWidth="8" 
                          strokeDasharray={2 * Math.PI * 50} 
                          strokeDashoffset={2 * Math.PI * 50 * (1 - progress / 100)} 
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 0.3s ease" }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontWeight: 800, fontSize: "1.5rem", background: "linear-gradient(135deg, #ff7171, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {progress}%
                      </div>
                    </div>

                    <h3 style={{ margin: "0 0 0.5rem", color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>
                      {status === "submitting" && "📤 Mengirim Data ke Agnes Cloud..."}
                      {status === "queued" && "⏳ Menunggu Antrian GPU Cloud..."}
                      {status === "generating" && "🎬 Sedang Render Video Cinematic..."}
                    </h3>
                    
                    <p style={{ margin: "0 auto 1.5rem", fontSize: "0.85rem", color: "#a1a1aa", maxWidth: "340px", lineHeight: 1.5 }}>
                      Video diproses di server asinkron Agnes menggunakan akselerasi AI Sapiens Labs. Proses ini biasanya memakan waktu beberapa menit.
                    </p>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#71717a", background: "#09090b", padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #232329" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", background: "#ec4899", borderRadius: "50%" }}></span>
                      Task ID: {taskId || "Memulai..."}
                    </div>

                  </div>
                )}

                {/* GENERATION COMPLETED PLAYER */}
                {status === "completed" && videoUrl && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    
                    <div style={{ borderBottom: "1px solid #232329", paddingBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "50%", padding: "0.35rem", display: "flex" }}>
                          <CheckCircle size={16} color="#10b981" />
                        </div>
                        <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>Video Selesai Dirender!</span>
                      </div>

                      <a 
                        href={videoUrl} 
                        download="agnes-cinematic.mp4" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "linear-gradient(135deg, #10b981, #059669)", border: 0, padding: "0.5rem 1rem", borderRadius: "0.5rem",
                          color: "#fff", display: "flex", alignItems: "center", gap: "0.35rem", textDecoration: "none", fontSize: "0.8rem", fontWeight: 700,
                          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)"
                        }}
                      >
                        <Download size={14} /> Download MP4
                      </a>
                    </div>

                    <div style={{ background: "#000", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid #232329", boxShadow: "0 10px 25px rgba(0,0,0,0.6)", display: "flex", position: "relative" }}>
                      <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        loop 
                        style={{ width: "100%", maxHeight: "360px", objectFit: "contain" }} 
                      />
                    </div>

                    <div style={{ background: "#09090b", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #232329" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.75rem", color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                        <Sparkle size={12} fill="#c084fc" /> Prompt Yang Digunakan
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "#e4e4e7" }}>{prompt}</p>
                    </div>

                  </div>
                )}

                {/* COMPILING FAILED ERROR VIEW */}
                {status === "failed" && (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#f43f5e" }}>
                    <div style={{ width: "70px", height: "70px", background: "rgba(244, 63, 94, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                      <AlertCircle size={32} color="#f43f5e" />
                    </div>
                    <h3 style={{ margin: "0 0 0.5rem", color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>Gagal Render Video</h3>
                    <p style={{ margin: "0 auto 1.5rem", fontSize: "0.85rem", color: "#a1a1aa", maxWidth: "320px", lineHeight: 1.5 }}>
                      {errorMsg}
                    </p>
                    <button 
                      onClick={() => setStatus("idle")}
                      style={{ background: "#27272a", color: "#fff", border: 0, padding: "0.6rem 1.25rem", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", transition: "all 0.2s" }}
                      onMouseEnter={(e) => e.target.style.background = "#3f3f46"}
                      onMouseLeave={(e) => e.target.style.background = "#27272a"}
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: RENDERS HISTORY GALLERY */}
        {activeTab === "gallery" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e1e24", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Galeri Render Anda</h2>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#71717a" }}>Semua karya video sinematik yang tersimpan di browser Anda</p>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={() => { if(confirm("🗑️ Bersihkan riwayat dan semua video dari galeri lokal Anda?")) setHistory([]) }}
                  style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", color: "#f43f5e", cursor: "pointer", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.target.style.background = "rgba(244, 63, 94, 0.15)"}
                  onMouseLeave={(e) => e.target.style.background = "rgba(244, 63, 94, 0.1)"}
                >
                  Bersihkan Semua
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "6rem 2rem", background: "#141416", border: "1px solid #232329", borderRadius: "1rem" }}>
                <Video size={48} color="#27272a" style={{ margin: "0 auto 1.25rem" }} />
                <h3 style={{ margin: "0 0 0.5rem", color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>Belum Ada Koleksi</h3>
                <p style={{ fontSize: "0.85rem", color: "#71717a", maxWidth: "300px", margin: "0.5rem auto 0", lineHeight: 1.5 }}>
                  Anda belum pernah me-render video. Silakan buka tab <strong>Studio 18s</strong> untuk memulai pembuatan karya video pertama Anda secara gratis!
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                {history.map((item) => (
                  <div key={item.id} style={{ background: "#141416", border: "1px solid #232329", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: 600 }}>📅 {item.timestamp}</span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <a 
                          href={item.videoUrl} 
                          download="agnes-cinematic.mp4" 
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: "#27272a", border: 0, borderRadius: "0.375rem", color: "#fff", display: "flex", padding: "0.45rem", cursor: "pointer", transition: "all 0.2s" }}
                          title="Unduh MP4"
                          onMouseEnter={(e) => e.currentTarget.style.background = "#3f3f46"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#27272a"}
                        >
                          <Download size={14} />
                        </a>
                        <button 
                          onClick={() => handleDeleteHistory(item.id)}
                          style={{ background: "rgba(244, 63, 94, 0.1)", border: 0, borderRadius: "0.375rem", color: "#f43f5e", display: "flex", padding: "0.45rem", cursor: "pointer", transition: "all 0.2s" }}
                          title="Hapus Dari Galeri"
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(244, 63, 94, 0.18)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ background: "#000", borderRadius: "0.5rem", overflow: "hidden", display: "flex", border: "1px solid #232329" }}>
                      <video 
                        src={item.videoUrl} 
                        controls 
                        loop 
                        style={{ width: "100%", maxHeight: "280px", objectFit: "contain" }} 
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.65rem", background: "rgba(236, 72, 153, 0.12)", color: "#f43f5e", padding: "0.2rem 0.5rem", borderRadius: "2rem", fontWeight: 700 }}>🎬 {item.mode === "txt2vid" ? "Text to Video" : item.mode === "img2vid" ? "Image to Video" : "Keyframes"}</span>
                        <span style={{ fontSize: "0.65rem", background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", padding: "0.2rem 0.5rem", borderRadius: "2rem", fontWeight: 700 }}>📏 {item.aspectRatio}</span>
                        <span style={{ fontSize: "0.65rem", background: "rgba(139, 92, 246, 0.12)", color: "#c084fc", padding: "0.2rem 0.5rem", borderRadius: "2rem", fontWeight: 700 }}>🔮 {item.resolution}</span>
                        <span style={{ fontSize: "0.65rem", background: "rgba(16, 185, 129, 0.12)", color: "#34d399", padding: "0.2rem 0.5rem", borderRadius: "2rem", fontWeight: 700 }}>⏱️ {item.duration}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#e4e4e7", lineHeight: 1.5 }}>{item.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOCUMENTATION & PROMPTS PRE-MADE */}
        {activeTab === "docs" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
            
            {/* INSTRUCTIONS */}
            <div style={{ background: "#141416", border: "1px solid #232329", borderRadius: "1rem", padding: "2rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #232329", paddingBottom: "1rem", marginBottom: "1.75rem" }}>
                <Film size={20} color="#ec4899" />
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Spesifikasi Agnes Video V2.0</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontSize: "0.875rem", lineHeight: 1.6, color: "#a1a1aa" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.35rem", color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>⚡ Integrasi Cloud Otomatis</h4>
                  <p style={{ margin: 0 }}>
                    Aplikasi ini berkomunikasi langsung dengan gateway model <code>agnes-video-v2.0</code> dari Sapiens AI Labs. Seluruh rendering asinkron diproses menggunakan arsitektur Diffusion Transformer (DiT).
                  </p>
                </div>
                
                <div>
                  <h4 style={{ margin: "0 0 0.35rem", color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>📏 Aturan Frame & Durasi (8n + 1)</h4>
                  <p style={{ margin: 0 }}>
                    Durasi video Agnes diatur berdasarkan frame standar FPS 24. Pilihan yang tersedia di Studio secara otomatis dikonversikan ke API sesuai aturan internal:
                  </p>
                  <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", fontSize: "0.8rem" }}>
                    <li><strong>3 Detik</strong> = 81 frames</li>
                    <li><strong>5 Detik</strong> = 121 frames</li>
                    <li><strong>10 Detik</strong> = 241 frames</li>
                    <li><strong>18 Detik</strong> = 441 frames (Batas durasi maksimal)</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 0.35rem", color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>📐 Ketentuan Resolusi & Dimensi</h4>
                  <p style={{ margin: 0 }}>
                    Resolusi gambar maksimum yang didukung adalah <strong>480p, 720p, dan 1080p</strong>. Sistem standardisasi Agnes akan secara otomatis menyesuaikan parameter dimensi terdekat berdasarkan rasio yang Anda pilih (16:9, 9:16, 1:1, atau 4:3).
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 0.35rem", color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>🚀 100% Bebas Biaya Rendering</h4>
                  <p style={{ margin: 0 }}>
                    Sesuai kebijakan rilis global terbaru pada tanggal 1 Juni 2026, Sapiens AI menggratiskan seluruh modalitas video API mereka bagi developer. Kuota default untuk akun non-langganan adalah <strong>20 RPM</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* PRE-MADE PROMPTS */}
            <div style={{ background: "#141416", border: "1px solid #232329", borderRadius: "1rem", padding: "2rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #232329", paddingBottom: "1rem", marginBottom: "1.75rem" }}>
                <Sparkles size={20} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Koleksi Prompt Sinematik Pilihan</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {SAMPLE_PROMPTS.map((p, idx) => (
                  <div key={idx} style={{ background: "#09090b", border: "1px solid #232329", borderRadius: "0.75rem", padding: "1.25rem", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff" }}>{p.title}</span>
                      <span style={{ fontSize: "0.65rem", background: "rgba(139, 92, 246, 0.15)", color: "#c084fc", padding: "0.15rem 0.4rem", borderRadius: "2rem", fontWeight: 700 }}>{p.vibe}</span>
                    </div>
                    <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#a1a1aa", lineHeight: 1.5 }}>{p.desc}</p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => { setPrompt(p.desc); setActiveTab("generate"); }}
                        style={{ background: "linear-gradient(135deg, #f43f5e, #8b5cf6)", color: "#fff", border: 0, borderRadius: "0.375rem", padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "opacity 0.2s" }}
                        onMouseEnter={(e) => e.target.style.opacity = 0.9}
                        onMouseLeave={(e) => e.target.style.opacity = 1}
                      >
                        Gunakan Prompt
                      </button>
                      <button 
                        onClick={() => handleCopyPrompt(p.desc, idx)}
                        style={{ background: "#18181b", border: "1px solid #27272a", color: "#a1a1aa", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        {copiedPromptId === idx ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{copiedPromptId === idx ? "Copied" : "Salin"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer style={{ borderTop: "1px solid #1e1e24", padding: "2rem", textAlign: "center", marginTop: "5rem", fontSize: "0.8rem", color: "#71717a" }}>
        <p style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
          Dikembangkan dengan <Heart size={12} fill="#f43f5e" color="#f43f5e" /> oleh <strong>bangke1212</strong>. Powered by Agnes Video V2.0 & Zaro Labs © 2026.
        </p>
      </footer>

    </div>
  )
}


