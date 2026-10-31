export default async function handler(req, res) {
  try {
    // 1. Настройки CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, Authorization, Prefer, Range, X-Client-Info');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 2. Адрес Supabase
    const supabaseUrl = 'https://iqmmrfjusbafoqvplud.supabase.co';
    let path = req.url.replace('/api/proxy', '');
    
    if (!path || path === '') {
      path = '/';
    } else if (!path.startsWith('/')) {
      path = '/' + path;
    }
        // Убираем лишние слэши (кроме тех, что после https:)
    path = path.replace(/([^:]\/)\/+/g, "$1");
    
    // Если путь не начинается со слэша, добавляем его
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    const finalUrl = `${supabaseUrl}${path}`;

    // 3. Проверка, есть ли вообще fetch
    if (typeof fetch !== 'function') {
      throw new Error('Встроенный fetch не найден. Убедитесь, что используется Node.js 18+.');
    }

    // 4. Запрос в Supabase
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

    // 5. Возврат ответа
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'connection') {
        res.setHeader(key, value);
      }
    });

    const data = await response.text();
    res.send(data);

  } catch (error) {
    // Если упало — возвращаем красивую ошибку в JSON
    return res.status(500).json({
      error: 'Ошибка внутри прокси',
      message: error.message,
      stack: error.stack
    });
  }
}
