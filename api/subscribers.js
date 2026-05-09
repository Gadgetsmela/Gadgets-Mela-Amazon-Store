import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SUBSCRIBER_DB_PATH = process.env.GADGETS_MELA_SUBSCRIBER_DB_PATH || path.join(process.cwd(), '.data', 'subscribers.json');
const SEGMENT_TAGS = ['Mobile gadgets', 'Smart home', 'Gaming', 'Audio', 'Kitchen gadgets'];

async function readSubscribers() {
  try {
    return JSON.parse(await readFile(SUBSCRIBER_DB_PATH, 'utf8'));
  } catch {
    return [];
  }
}

async function writeSubscribers(subscribers) {
  await mkdir(path.dirname(SUBSCRIBER_DB_PATH), { recursive: true });
  await writeFile(SUBSCRIBER_DB_PATH, JSON.stringify(subscribers, null, 2));
  return subscribers;
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

function normalizeSubscriber(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid email is required.');
  if (payload.honeypot) throw new Error('Spam rejected.');
  if (payload.consent === false) throw new Error('Consent is required.');

  return {
    id: payload.id || `gm-sub-${Date.now()}`,
    name: String(payload.name || '').trim() || 'Gadget Lover',
    email,
    tags: Array.isArray(payload.tags) ? payload.tags.filter((tag) => SEGMENT_TAGS.includes(tag)) : [],
    country: String(payload.country || 'IN').slice(0, 2).toUpperCase(),
    createdAt: payload.createdAt || new Date().toISOString(),
    unsubscribedAt: null,
    source: payload.source || 'website',
  };
}

async function syncProvider(subscriber) {
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
    await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ email: subscriber.email, first_name: subscriber.name, unsubscribed: false }),
    }).catch(() => null);
    return { provider: 'resend', synced: true, subscriber };
  }

  if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({ email: subscriber.email, attributes: { FIRSTNAME: subscriber.name, COUNTRY: subscriber.country }, listIds: [Number(process.env.BREVO_LIST_ID)], updateEnabled: true }),
    }).catch(() => null);
    return { provider: 'brevo', synced: true, subscriber };
  }

  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX && process.env.MAILCHIMP_LIST_ID) {
    const memberHash = crypto.createHash('md5').update(subscriber.email).digest('hex');
    await fetch(`https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members/${memberHash}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}` },
      body: JSON.stringify({ email_address: subscriber.email, status_if_new: 'subscribed', merge_fields: { FNAME: subscriber.name } }),
    }).catch(() => null);
    return { provider: 'mailchimp', synced: true, subscriber };
  }

  return { provider: 'local-json', synced: false, subscriber };
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') return response.end();

  try {
    if (request.method === 'GET') {
      const subscribers = await readSubscribers();
      const activeSubscribers = subscribers.filter((subscriber) => !subscriber.unsubscribedAt);
      return sendJson(response, 200, { subscribers, totalSubscribers: activeSubscribers.length });
    }

    if (request.method === 'POST') {
      const body = await parseBody(request);
      const subscriber = normalizeSubscriber(body);
      const subscribers = await readSubscribers();
      const existingIndex = subscribers.findIndex((item) => item.email === subscriber.email);
      const nextSubscribers = existingIndex >= 0
        ? subscribers.map((item, index) => (index === existingIndex ? { ...item, ...subscriber, id: item.id, createdAt: item.createdAt } : item))
        : [subscriber, ...subscribers];
      await writeSubscribers(nextSubscribers);
      const providerResult = await syncProvider(subscriber);
      return sendJson(response, 201, { ...providerResult, subscriber });
    }

    if (request.method === 'DELETE') {
      const url = new globalThis.URL(request.url, `https://${request.headers.host || 'localhost'}`);
      const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
      const subscribers = (await readSubscribers()).map((subscriber) => (
        subscriber.email === email ? { ...subscriber, unsubscribedAt: new Date().toISOString() } : subscriber
      ));
      await writeSubscribers(subscribers);
      return sendJson(response, 200, { ok: true });
    }

    return sendJson(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    return sendJson(response, 400, { error: error.message });
  }
}
