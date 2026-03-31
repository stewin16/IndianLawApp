const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_BASE = process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1';
const GROQ_DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3-32b';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const CHAT_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS || 768);
const CHAT_TEMP = Number(process.env.GROQ_TEMPERATURE || 0.2);

const DEFAULT_MODELS = [
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'openai/gpt-oss-20b',
].map((name) => ({ name }));

const parseModelList = () => {
  const raw = process.env.GROQ_MODELS;
  if (!raw) {
    return DEFAULT_MODELS;
  }

  const models = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  return models.length > 0 ? models : DEFAULT_MODELS;
};

const GROQ_MODELS = parseModelList();

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false, 
    message: { status: 'error', message: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.AI_RPM_LIMIT || 25),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'AI rate limit reached. Please retry shortly.' },
});

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '2mb' }));
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'API Gateway',
    ai_provider: 'groq',
    model: GROQ_DEFAULT_MODEL,
    fallback_model: GROQ_FALLBACK_MODEL,
    rag_proxy: RAG_SERVICE_URL,
    groq_key_configured: Boolean(GROQ_API_KEY),
  });
});

const groqHeaders = () => ({
  Authorization: `Bearer ${GROQ_API_KEY}`,
  'Content-Type': 'application/json',
});

const buildChatPayload = ({ model, messages, stream = false, format, options }) => {
  const payload = {
    model,
    messages,
    temperature: Number.isFinite(options?.temperature) ? options.temperature : CHAT_TEMP,
    max_tokens: Math.min(Number(options?.num_predict || CHAT_MAX_TOKENS), CHAT_MAX_TOKENS),
    stream,
  };

  if (format === 'json') {
    payload.response_format = { type: 'json_object' };
  }

  return payload;
};

const callGroqChat = async (payload) => {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: groqHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    const retryAfter = response.headers.get('retry-after');
    const err = new Error(`Groq request failed: ${response.status} ${body}`);
    err.status = response.status;
    err.retryAfter = retryAfter;
    throw err;
  }

  return response;
};

const withModelFallback = async (builder) => {
  const primary = GROQ_DEFAULT_MODEL;
  const fallback = GROQ_FALLBACK_MODEL;
  try {
    return await builder(primary);
  } catch (err) {
    if (!fallback || fallback === primary) {
      throw err;
    }
    console.warn(`[Groq] Primary model failed (${primary}), retrying ${fallback}`);
    return builder(fallback);
  }
};

app.get('/ollama/api/tags', aiLimiter, async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY on server.' });
  }

  try {
    const response = await fetch(`${GROQ_API_BASE}/models`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    });

    if (!response.ok) {
      return res.json({ models: GROQ_MODELS });
    }

    const data = await response.json();
    const models = (data?.data || [])
      .map((m) => ({ name: m.id }))
      .filter((m) => Boolean(m.name));

    return res.json({ models: models.length > 0 ? models : GROQ_MODELS });
  } catch (error) {
    return res.json({ models: GROQ_MODELS });
  }
});

app.post('/ollama/api/generate', aiLimiter, async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY on server.' });
  }

  const { model, prompt, format, options = {} } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const response = await withModelFallback((resolvedModel) => {
      const payload = buildChatPayload({
        model: model || resolvedModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        format,
        options,
      });
      return callGroqChat(payload);
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return res.json({
      model: model || GROQ_DEFAULT_MODEL,
      created_at: new Date().toISOString(),
      response: text,
      done: true,
    });
  } catch (error) {
    const status = error.status || 500;
    if (error.retryAfter) {
      res.setHeader('retry-after', error.retryAfter);
    }
    return res.status(status).json({ error: error.message || 'Generation failed.' });
  }
});

app.post('/ollama/api/chat', aiLimiter, async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY on server.' });
  }

  const { model, messages = [], stream = false, format, options = {} } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  try {
    const response = await withModelFallback((resolvedModel) => {
      const payload = buildChatPayload({
        model: model || resolvedModel,
        messages,
        stream,
        format,
        options,
      });
      return callGroqChat(payload);
    });

    if (!stream) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return res.json({
        model: model || GROQ_DEFAULT_MODEL,
        message: {
          role: 'assistant',
          content,
        },
        done: true,
      });
    }

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) {
          continue;
        }

        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          res.write(`${JSON.stringify({ done: true })}\n`);
          res.end();
          return;
        }

        try {
          const chunk = JSON.parse(data);
          const token = chunk?.choices?.[0]?.delta?.content || '';
          if (token) {
            res.write(`${JSON.stringify({ message: { content: token }, done: false })}\n`);
          }
        } catch (error) {
          // Ignore malformed chunks from upstream.
        }
      }
    }

    res.write(`${JSON.stringify({ done: true })}\n`);
    res.end();
  } catch (error) {
    const status = error.status || 500;
    if (error.retryAfter) {
      res.setHeader('retry-after', error.retryAfter);
    }
    return res.status(status).json({ error: error.message || 'Chat failed.' });
  }
});

// API Routes Proxy
app.use('/api/v1', createProxyMiddleware({ 
    target: RAG_SERVICE_URL, 
    changeOrigin: true,
    pathRewrite: {
        '^/api/v1': '', // Remove /api/v1 prefix when forwarding to RAG service
    },
    onProxyReq: (proxyReq, req, res) => {
        // Optional: Add logging or auth headers here
        console.log(`[Gateway] Forwarding ${req.method} request to: ${proxyReq.path}`);
    },
    proxyTimeout: 300000,
    timeout: 300000
}));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying /api/v1 -> ${RAG_SERVICE_URL}`);
  console.log('Serving Groq-backed Ollama compatibility routes at /ollama/api/*');
});
