// Vercel Serverless Function — proxy image upload ke ImgBB
// Menghindari CORS block dari browser
export default async function handler(req, res) {
  // Enable CORS
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

    // Proxy ke ImgBB
    const formData = new FormData()
    formData.append("image", image) // base64 string langsung
    if (name) formData.append("name", name)

    const response = await fetch("https://api.imgbb.com/1/upload?key=013d25b0d5d5b47bfb67f82ceb5c6d66", {
      method: "POST",
      body: formData
    })

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
