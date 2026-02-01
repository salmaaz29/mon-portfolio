export default async function handler(req, res) {
  // ── CORS headers ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Vérifie que la clé API existe ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Clé API non configurée. Ajoute ANTHROPIC_API_KEY dans les Environment Variables de Vercel." });
  }

  // ── Vérifie le body ──
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Body JSON invalide" });
  }

  const { messages, system } = body || {};

  if (!messages || !system) {
    return res.status(400).json({ error: "Champs 'messages' ou 'system' manquants" });
  }

  // ── Appel à l'API Anthropic ──
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: system,
        messages: messages,
      }),
    });

    // On lit en texte d'abord pour éviter l'erreur "Unexpected end of JSON"
    const rawText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erreur API Anthropic : " + rawText });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: "Réponse Anthropic invalide : " + rawText });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: "Erreur réseau vers Anthropic : " + err.message });
  }
}