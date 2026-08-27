import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.headers.authorization !== "sposify2026") return res.status(401).json({error: "Unauthorized"});
  const { deviceId, locked } = req.query;
  
  let device = await kv.hget("devices", deviceId);
  if (device) {
    device.locked = locked === "true";
    await kv.hset("devices", { [deviceId]: device });
  }
  res.status(200).json({ success: true });
}