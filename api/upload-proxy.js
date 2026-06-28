// Vercel Serverless Function — proxy image upload ke ImgBB
// Menghindari CORS block dari browser
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" })
  }

  try {
    const { image, name } = req.body
    if (!image) {
      return res.status(400).json({ error: "No image data" })
    }

    const base64 = image.includes("base64,") ? image.split("base64,")[1] : image

    // Kirim ke ImgBB via URL-encoded (ImgBB support ini)
    const formBody = new URLSearchParams()
    formBody.append("image", base64)
    if (name) formBody.append("name", name)

    const response = await fetch("https://api.imgbb.com/1/upload?key=013d25b0d5d5b47bfb67f82ceb5c6d66", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString()
    })

    const text = await response.text()
    console.log("ImgBB res:", text.substring(0, 300))
    
    let data
    try { data = JSON.parse(text) }
    catch { return res.status(502).json({ error: "ImgBB not JSON", raw: text.substring(0, 200) }) }

    return res.status(200).json(data)
  } catch (err) {
    console.error("Proxy error:", err)
    return res.status(500).json({ error: err.message })
  }
}
