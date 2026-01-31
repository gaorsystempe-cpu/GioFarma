
export const config = {
  runtime: 'nodejs', // Cambiamos a Node.js para mayor compatibilidad con payloads grandes
};

export default async function handler(req: any, res: any) {
  // Manejo de CORS pre-flight
  if (req.method === 'OPTIONS') {
    return res.status(200).send('ok');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, body } = req.body;

    if (!url || !body) {
      return res.status(400).json({ error: 'Missing url or body' });
    }

    // Realizamos la petición a Odoo desde el servidor
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'User-Agent': 'Odoo-Service-Giofarma/2.0 (Vercel-Serverless)',
      },
      body: body,
    });

    const data = await response.text();

    // Retornamos la respuesta original de Odoo (XML)
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(response.status).send(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy request failed',
      details: error.message || 'Unknown error'
    });
  }
}
