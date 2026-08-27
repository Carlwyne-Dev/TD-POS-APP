import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.headers.authorization !== "sposify2026") return res.status(401).json({error: "Unauthorized"});
  try {
    const devices = await kv.hgetall("devices") || {};
    res.status(200).json(devices);
  } catch(e) {
    res.status(200).json({});
  }
}