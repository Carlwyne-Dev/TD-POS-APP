import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { deviceId, name } = req.query;
  if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });

  try {
    let device = await kv.hget("devices", deviceId);
    
    if (!device) {
      device = { id: deviceId, name: name || "Unknown Device", locked: false, firstSeen: Date.now(), lastSeen: Date.now() };
    } else {
      device.lastSeen = Date.now();
      if (name && name !== "Unknown Device") device.name = name;
    }
    
    await kv.hset("devices", { [deviceId]: device });
    res.status(200).json(device);
  } catch(e) {
    // Failsafe: if KV not configured, return unlocked
    res.status(200).json({ locked: false });
  }
}