
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { url, body } = await req.json();

    if (!url || !body) {
      return new Response(JSON.stringify({ error: 'Missing url or body' }), { status: 400 });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'User-Agent': 'Odoo-Proxy-GIOFARMA/1.0',
      },
      body: body,
    });

    const data = await response.text();
    
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'Proxy request failed', 
      details: error.message 
    }), { status: 500 });
  }
}
