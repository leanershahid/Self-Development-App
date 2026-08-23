import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = 'BNrODkDt3H2J88zld58M2P1mTHwGbpPFOQxsD55rg8pihHNCqV5bXoBFKU-9BgPrcSbJQCHJZ-5cd9Pk8Hxq6KA';
const VAPID_PRIVATE_KEY = '2x4MAnGU2IokfigacBlV6XyjhIYKENMJklHxEFI3wUQ';
const VAPID_SUBJECT = 'mailto:admin@example.com';

function base64urlToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function makeVapidJwt(audience: string): Promise<string> {
  const header = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  })));
  const signingInput = `${header}.${payload}`;
  const privateKey = await crypto.subtle.importKey(
    'raw', base64urlToUint8Array(VAPID_PRIVATE_KEY),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, privateKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${uint8ArrayToBase64url(new Uint8Array(sig))}`;
}

async function sendPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await makeVapidJwt(audience);
  const authHeader = `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`;

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey));

  const clientPublicKey = await crypto.subtle.importKey(
    'raw', base64urlToUint8Array(subscription.keys.p256dh),
    { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey }, serverKeyPair.privateKey, 256
  );
  const authSecret = base64urlToUint8Array(subscription.keys.auth);
  const encoder = new TextEncoder();

  async function hkdf(ikm: ArrayBuffer, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8);
    return new Uint8Array(bits);
  }

  const prk = await hkdf(sharedSecret, authSecret,
    encoder.encode('WebPush: info\x00' + String.fromCharCode(...base64urlToUint8Array(subscription.keys.p256dh)) + String.fromCharCode(...serverPublicKeyRaw)), 32
  );
  const cek = await hkdf(prk, salt, encoder.encode('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdf(prk, salt, encoder.encode('Content-Encoding: nonce\x00'), 12);

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const plaintext = encoder.encode(payload);
  const paddedPlaintext = new Uint8Array(plaintext.length + 2);
  paddedPlaintext.set(plaintext);
  paddedPlaintext[plaintext.length] = 2;

  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, paddedPlaintext));

  const header = new Uint8Array(21 + serverPublicKeyRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = serverPublicKeyRaw.length;
  header.set(serverPublicKeyRaw, 21);

  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header);
  body.set(ciphertext, header.length);

  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body,
  });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { title, body, url } = await req.json();

  const { data: subs, error } = await supabase.from('push_subscriptions').select('subscription');
  if (error) return new Response(error.message, { status: 500, headers: CORS });
  if (!subs?.length) return new Response('No subscribers', { status: 200, headers: CORS });

  const payload = JSON.stringify({
    title: title || '📨 Job Applied',
    body: body || 'Application saved!',
    tag: 'job-apply',
    url: url || '/job-finder',
    actions: [
      { action: 'open', title: '📋 View Applications' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  });

  await Promise.allSettled(
    subs.map((row) => sendPush(
      typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription,
      payload
    ))
  );

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
});
