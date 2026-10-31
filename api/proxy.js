export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, Authorization, Prefer, Range, X-Client-Info');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = 'https://iqmmrfjusbafoqvplud.supabase.co';
  
  let path = req.url.replace('/api/proxy', '');
  
  if (!path || path === '') {
    path = '/';
  } else if (!path.startsWith('/')) {
    path = '/' + path;
  }

  path = path.replace(/\/+/g, '/');
  const finalUrl = `${supabaseUrl}${path}`;

  try {
    // Проверяем, доступен ли fetch (в новых Node.js он встроен)
    if (typeof fetch !== 'function') {
       return res.status(500).json({ error: 'fetch is not defined in this Node version' });
    }

    const response = await fetch(finalUrl, {
      method: req.method,
      headers: {
        'apikey': req.headers.apikey || '',
        'Authorization': req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Prefer': req.headers.prefer || '',
      },
      body: (req.method !== 'GET' && req.method !== 'HEAD' && req.body) ? JSON.stringify(req.body) : undefined,
    });

    res.status(response.status);
    
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'connection') {
        res.setHeader(key, value);
      }
    });

    const data = await response.text();
    res.send(data);
  } catch (error) {
    // Если что-то пошло не так, показываем ошибку в браузере
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      details: error.message,
      stack: error.stack 
    });
  }
}
