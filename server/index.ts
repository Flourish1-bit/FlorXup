import http from 'node:http';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { WebSocketServer, type WebSocket } from 'ws';
import { config } from './config.js';
import { createAccessToken, getUserIdFromToken, hashPassword, verifyPassword } from './security.js';
import { Store, toPublicUser } from './store.js';

const app = express();
const httpServer = http.createServer(app);
const webSockets = new Set<WebSocket>();
const store = new Store();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

function bearerToken(request: Request): string | null {
  const header = request.header('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

function authenticatedUser(request: Request) {
  const token = bearerToken(request);
  const userId = token ? getUserIdFromToken(token) : null;
  return userId ? store.findUserById(userId) : undefined;
}

function publicUserResponse(user: ReturnType<typeof store.findUserById>) {
  return user ? toPublicUser(user) : null;
}

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'florxup-api', timestamp: new Date().toISOString() });
});

app.post('/auth/signup', async (request, response) => {
  const { username, email, password, statusBio = '', avatarUrl = null, publicKey = '' } = request.body ?? {};
  const cleanUsername = typeof username === 'string' ? username.trim().replace(/^@+/, '') : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!/^[a-zA-Z0-9_]{2,32}$/.test(cleanUsername)) {
    return response.status(400).json({ error: 'Username must be 2-32 letters, numbers, or underscores.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return response.status(400).json({ error: 'A valid email address is required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return response.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (store.findUserByEmail(cleanEmail) || store.findUserByUsername(cleanUsername)) {
    return response.status(409).json({ error: 'That email or username is already registered.' });
  }

  const user = await store.createUser({
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: await hashPassword(password),
    statusBio: typeof statusBio === 'string' ? statusBio.trim().slice(0, 280) : '',
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
    publicKey: typeof publicKey === 'string' ? publicKey : '',
    emailVerified: !config.requireEmailVerification,
  });

  const token = createAccessToken(user.id);
  return response.status(201).json({ accessToken: token, user: publicUserResponse(user), emailVerificationRequired: config.requireEmailVerification });
});

app.post('/auth/login', async (request, response) => {
  const { identifier, password } = request.body ?? {};
  const cleanIdentifier = typeof identifier === 'string' ? identifier.trim().replace(/^@+/, '').toLowerCase() : '';
  const user = store.findUserByEmail(cleanIdentifier) || store.findUserByUsername(cleanIdentifier);

  if (!user || typeof password !== 'string' || !(await verifyPassword(password, user.passwordHash))) {
    return response.status(401).json({ error: 'Invalid email/username or password.' });
  }
  if (config.requireEmailVerification && !user.emailVerified) {
    return response.status(403).json({ error: 'Please verify your email before signing in.' });
  }

  return response.json({ accessToken: createAccessToken(user.id), user: publicUserResponse(user) });
});

app.get('/auth/me', (request, response) => {
  const user = authenticatedUser(request);
  return user ? response.json({ user: publicUserResponse(user) }) : response.status(401).json({ error: 'Authentication required.' });
});

app.get('/users/search', (request, response) => {
  const user = authenticatedUser(request);
  if (!user) return response.status(401).json({ error: 'Authentication required.' });

  const query = typeof request.query.email === 'string' ? request.query.email.trim().toLowerCase() : '';
  if (!query) return response.json({ users: [] });

  const users = store.listUsers()
    .filter((candidate) => candidate.id !== user.id && (candidate.email.includes(query) || candidate.username.toLowerCase().includes(query)))
    .slice(0, 20)
    .map(toPublicUser);
  return response.json({ users });
});

const webSocketServer = new WebSocketServer({ server: httpServer, path: '/ws' });
webSocketServer.on('connection', (socket, request) => {
  const token = new URL(request.url || '/', 'http://localhost').searchParams.get('token');
  if (!token || !getUserIdFromToken(token)) {
    socket.close(1008, 'Authentication required');
    return;
  }

  webSockets.add(socket);
  socket.send(JSON.stringify({ type: 'connected' }));
  socket.on('close', () => webSockets.delete(socket));
  socket.on('message', (raw) => {
    for (const peer of webSockets) {
      if (peer !== socket && peer.readyState === peer.OPEN) peer.send(raw.toString());
    }
  });
});

await store.load();
httpServer.listen(config.port, config.host, () => {
  console.log(`Florxup API listening on http://${config.host}:${config.port}`);
  console.log(`WebSocket endpoint: ws://localhost:${config.port}/ws?token=<access-token>`);
});
