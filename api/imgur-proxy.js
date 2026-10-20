export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  const clientId = process.env.IMGUR_CLIENT_ID || "546c25a59c58ad7"
  const { image, type = "base64" } = req.body || {}
  if (!image) {
    return res.status(400).json({ success: false, error: "image is required" })
  }

  try {
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${clientId}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image, type })
    })
    const text = await response.text()
    let payload
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { success: false, data: { error: text.slice(0, 300) } }
    }
    return res.status(response.status).json(payload)
  } catch (error) {
    return res.status(502).json({ success: false, error: error.message || "Imgur unavailable" })
  }
}
