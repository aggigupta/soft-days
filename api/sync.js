// Stores and returns end-to-end encrypted blobs only.
// This server (and whoever owns this Vercel project) never sees a passcode
// or plaintext data — only ciphertext keyed by a one-way hash of the passcode.

const ID_RE = /^[a-f0-9]{64}$/;

async function upstash(cmd) {
  const base = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return { __unconfigured: true };
  const r = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const id = String(req.query.id || "");
    if (!ID_RE.test(id)) return res.status(400).json({ error: "bad_id" });
    const result = await upstash(["GET", `softdays:${id}`]);
    if (result.__unconfigured) return res.status(503).json({ error: "sync_not_configured" });
    if (!result.result) return res.status(200).json({ found: false });
    try {
      return res.status(200).json({ found: true, data: JSON.parse(result.result) });
    } catch {
      return res.status(500).json({ error: "corrupt_record" });
    }
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { id, salt, iv, ciphertext } = body || {};
    if (!ID_RE.test(String(id || ""))) return res.status(400).json({ error: "bad_id" });
    if (typeof salt !== "string" || typeof iv !== "string" || typeof ciphertext !== "string") {
      return res.status(400).json({ error: "bad_payload" });
    }
    if (ciphertext.length > 500000) return res.status(413).json({ error: "too_large" });
    const payload = JSON.stringify({ salt, iv, ciphertext, updatedAt: Date.now() });
    const result = await upstash(["SET", `softdays:${id}`, payload]);
    if (result.__unconfigured) return res.status(503).json({ error: "sync_not_configured" });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method_not_allowed" });
}
