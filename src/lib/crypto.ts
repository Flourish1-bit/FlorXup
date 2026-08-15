/**
 * Florxup Cryptographic Engine
 * End-to-End Encryption (E2EE) using Web Crypto API (SubtleCrypto)
 * - Algorithm: ECDH (Curve P-256) for asymmetric key agreement
 * - Symmetric Cipher: AES-GCM (256-bit) with 96-bit (12-byte) random Initialization Vectors
 * - Storage: Browser IndexedDB for zero-knowledge private key isolation
 */

const DB_NAME = 'florxup_crypto_vault';
const DB_VERSION = 1;
const STORE_NAME = 'user_private_keys';

// In-memory fallback if IndexedDB is blocked in sandboxes
const memoryKeyStore = new Map<string, CryptoKey>();
// Shared AES-GCM key cache: Map<`${localUserId}_${remotePublicKeyJwk}`, CryptoKey>
const sharedKeyCache = new Map<string, CryptoKey>();

/**
 * Open or initialize the IndexedDB store for private keys
 */
function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 1. Generate an ECDH P-256 Asymmetric Key Pair
 */
export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API (window.crypto.subtle) is not available.');
  }

  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable so we can export public JWK and persist private key in IndexedDB
    ['deriveKey', 'deriveBits']
  );
}

/**
 * 2. Export ECDH Public Key to JSON Web Key (JWK) string for database storage
 */
export async function exportPublicKeyJWK(publicKey: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
  return JSON.stringify(jwk);
}

/**
 * 3. Import ECDH Public Key from JSON Web Key (JWK) string
 */
export async function importPublicKeyJWK(jwkString: string): Promise<CryptoKey> {
  let jwk: JsonWebKey;
  try {
    jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
  } catch (err) {
    throw new Error('Invalid JWK format for public key: ' + err);
  }

  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * 4. Save User's ECDH Private Key into local IndexedDB
 */
export async function savePrivateKeyToIndexedDB(userId: string, privateKey: CryptoKey): Promise<void> {
  memoryKeyStore.set(userId, privateKey);

  try {
    const db = await openKeyDatabase();
    // Export private key as JWK so it can be safely stored in IndexedDB structured clone
    const jwk = await window.crypto.subtle.exportKey('jwk', privateKey);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ userId, jwk, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB write warning; preserved in-memory:', e);
  }
}

/**
 * 5. Load User's ECDH Private Key from local IndexedDB
 */
export async function loadPrivateKeyFromIndexedDB(userId: string): Promise<CryptoKey | null> {
  if (memoryKeyStore.has(userId)) {
    return memoryKeyStore.get(userId)!;
  }

  try {
    const db = await openKeyDatabase();
    const jwkRecord = await new Promise<{ userId: string; jwk: JsonWebKey } | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(userId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (!jwkRecord || !jwkRecord.jwk) {
      return null;
    }

    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      jwkRecord.jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    memoryKeyStore.set(userId, privateKey);
    return privateKey;
  } catch (e) {
    console.warn('Failed to load private key from IndexedDB:', e);
    return memoryKeyStore.get(userId) || null;
  }
}

export const getPrivateKeyFromIndexedDB = loadPrivateKeyFromIndexedDB;

/**
 * 6. Compute Shared 256-bit AES-GCM Secret Key using ECDH Key Agreement
 */
export async function getSharedSecretKey(
  localUserId: string,
  localPrivateKey: CryptoKey,
  remotePublicKeyJWK: string
): Promise<CryptoKey> {
  const cacheKey = `${localUserId}:::${remotePublicKeyJWK}`;
  if (sharedKeyCache.has(cacheKey)) {
    return sharedKeyCache.get(cacheKey)!;
  }

  const remotePublicKey = await importPublicKeyJWK(remotePublicKeyJWK);

  const sharedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: remotePublicKey,
    },
    localPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // Shared AES key does not need to be extractable
    ['encrypt', 'decrypt']
  );

  sharedKeyCache.set(cacheKey, sharedKey);
  return sharedKey;
}

/**
 * 7. Encrypt Plaintext message to Base64 Ciphertext + Base64 12-byte IV
 */
export async function encryptMessage(
  plainText: string,
  sharedKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // Generate 12-byte (96-bit) cryptographically strong IV
  const ivArray = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivArray,
    },
    sharedKey,
    data
  );

  const ciphertextBase64 = arrayBufferToBase64(encryptedBuffer);
  const ivBase64 = arrayBufferToBase64(ivArray.buffer);

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
  };
}

/**
 * 8. Decrypt Base64 Ciphertext with Base64 IV and AES-GCM Shared Key
 */
export async function decryptMessage(
  ciphertextBase64: string,
  ivBase64: string,
  sharedKey: CryptoKey
): Promise<string> {
  try {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
    const ivBuffer = base64ToArrayBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer),
      },
      sharedKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed: Key mismatch or corrupted ciphertext.');
  }
}

/**
 * 9. Safety Number / Security Code Fingerprint Generator
 * Generates an auditable, WhatsApp/Signal-style verification code from two public keys
 */
export async function generateSafetyFingerprint(
  publicKeyJWK_A: string,
  publicKeyJWK_B: string
): Promise<{ fingerprint: string; blocks: string[]; hexDigest: string }> {
  // Sort lexicographically to ensure order independence between user A and user B
  const sorted = [publicKeyJWK_A, publicKeyJWK_B].sort().join('::FLORXUP_E2EE::');
  const encoder = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(sorted));
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexDigest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Turn into 12 digits (3 groups of 4 digits) for easy human verification
  let numStr = '';
  for (let i = 0; i < 6; i++) {
    const val = (hashArray[i * 2] * 256 + hashArray[i * 2 + 1]) % 10000;
    numStr += val.toString().padStart(4, '0');
  }

  const blocks: string[] = [];
  for (let i = 0; i < numStr.length; i += 4) {
    blocks.push(numStr.slice(i, i + 4));
  }

  return {
    fingerprint: blocks.join(' '),
    blocks,
    hexDigest: hexDigest.slice(0, 16).toUpperCase(),
  };
}

/**
 * Helper: ArrayBuffer to Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper: Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
