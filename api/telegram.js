const TELEGRAM_API = 'https://api.telegram.org';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const botToken = process.env.TELEGRAM_BOT_TOKEN || req.body?.botToken;
  const channelId = process.env.TELEGRAM_CHANNEL_ID || req.body?.channelId;
  const { caption, image } = req.body || {};

  if (!botToken || !channelId) return res.status(400).json({ error: 'Telegram bot token or channel ID is missing.' });
  if (!caption) return res.status(400).json({ error: 'Telegram caption is required.' });

  const endpoint = image ? 'sendPhoto' : 'sendMessage';
  const payload = image
    ? { chat_id: channelId, photo: image, caption, parse_mode: 'Markdown' }
    : { chat_id: channelId, text: caption, parse_mode: 'Markdown', disable_web_page_preview: false };

  const response = await fetch(`${TELEGRAM_API}/bot${botToken}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) return res.status(response.status).json({ error: data.description || 'Telegram post failed.' });
  return res.status(200).json({ ok: true, result: data.result });
}
