// Returns ONLY a count of how many encrypted sync records exist.
// Never returns key names, contents, timestamps, or anything that could
// identify who created a record — the server can't read that anyway,
// since every record is end-to-end encrypted client-side.

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

  const key = req.query.key || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "forbidden" });
  }

  let cursor = "0";
  let count = 0;
  let guard = 0;
  do {
    const result = await upstash(["SCAN", cursor, "MATCH", "softdays:*", "COUNT", "200"]);
    if (result.__unconfigured) return res.status(503).json({ error: "sync_not_configured" });
    if (!Array.isArray(result.result)) break;
    cursor = result.result[0];
    count += (result.result[1] || []).length;
    guard++;
  } while (cursor !== "0" && guard < 500);

  return res.status(200).json({ recordCount: count });
}
