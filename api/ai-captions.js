export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(204).end();

  const { product } = req.body || {};
  if (!product?.name) return res.status(400).json({ error: 'Product is required.' });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: `Create short Hindi + Hinglish viral affiliate captions as JSON for this Amazon product: ${JSON.stringify(product)}`,
      text: { format: { type: 'json_object' } },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'AI caption generation failed.' });
  return res.status(200).json({ content: data.output_text ? JSON.parse(data.output_text) : data });
}
