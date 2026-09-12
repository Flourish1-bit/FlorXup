import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { createAccessToken, getUserIdFromToken, hashPassword, verifyPassword } from './security.js';
import { Store, toPublicUser } from './store.js';
const app = express();
const httpServer = http.createServer(app);
const webSockets = new Set();
const store = new Store();
const ADMIN_EMAIL = 'flourishokafor13@gmail.com';
const ADMIN_USERNAME = 'Admin_Flourish_Okafor';
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
function bearerToken(request) {
    const header = request.header('authorization');
    return header?.startsWith('Bearer ') ? header.slice(7) : null;
}
function authenticatedUser(request) {
    const token = bearerToken(request);
    const userId = token ? getUserIdFromToken(token) : null;
    return userId ? store.findUserById(userId) : undefined;
}
function adminUser(request) {
    const user = authenticatedUser(request);
    return user?.role === 'ADMIN' ? user : undefined;
}
function publicUserResponse(user) {
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
        role: cleanEmail === ADMIN_EMAIL && cleanUsername === ADMIN_USERNAME ? 'ADMIN' : 'USER',
        passwordHash: await hashPassword(password),
        statusBio: typeof statusBio === 'string' ? statusBio.trim().slice(0, 280) : '',
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
        publicKey: typeof publicKey === 'string' ? publicKey : '',
        emailVerified: !config.requireEmailVerification,
    });
    const token = createAccessToken(user.id, user.role);
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
    return response.json({ accessToken: createAccessToken(user.id, user.role), user: publicUserResponse(user) });
});
app.get('/auth/me', (request, response) => {
    const user = authenticatedUser(request);
    return user ? response.json({ user: publicUserResponse(user) }) : response.status(401).json({ error: 'Authentication required.' });
});
app.get('/users/search', (request, response) => {
    const user = authenticatedUser(request);
    if (!user)
        return response.status(401).json({ error: 'Authentication required.' });
    const query = typeof request.query.email === 'string' ? request.query.email.trim().toLowerCase() : '';
    if (!query)
        return response.json({ users: [] });
    const users = store.listUsers()
        .filter((candidate) => candidate.id !== user.id && (candidate.email.includes(query) || candidate.username.toLowerCase().includes(query)))
        .slice(0, 20)
        .map(toPublicUser);
    return response.json({ users });
});
app.get('/admin/overview', (request, response) => {
    const user = adminUser(request);
    if (!user)
        return response.status(403).json({ error: 'Administrator access required.' });
    const users = store.listUsers();
    return response.json({
        metrics: {
            totalUsers: users.length,
            onlineUsers: users.filter((candidate) => candidate.id !== user.id).length,
            adminCount: users.filter((candidate) => candidate.role === 'ADMIN').length,
            revenueTotal: 0,
        },
        users: users.map(toPublicUser),
        revenue: [],
    });
});
app.patch('/admin/users/:id', async (request, response) => {
    const user = adminUser(request);
    if (!user)
        return response.status(403).json({ error: 'Administrator access required.' });
    if (request.params.id === user.id && request.body?.role === 'USER') {
        return response.status(400).json({ error: 'The administrator cannot remove their own admin role.' });
    }
    const updates = request.body ?? {};
    const targetUser = store.findUserById(request.params.id);
    if (!targetUser)
        return response.status(404).json({ error: 'User not found.' });
    const allowedUpdates = {
        username: typeof updates.username === 'string' ? updates.username.trim() : undefined,
        email: typeof updates.email === 'string' ? updates.email.trim().toLowerCase() : undefined,
        statusBio: typeof updates.statusBio === 'string' ? updates.statusBio.trim().slice(0, 280) : undefined,
        avatarUrl: typeof updates.avatarUrl === 'string' || updates.avatarUrl === null ? updates.avatarUrl : undefined,
        emailVerified: typeof updates.emailVerified === 'boolean' ? updates.emailVerified : undefined,
        role: updates.role === 'ADMIN' &&
            typeof updates.email === 'string' && updates.email.trim().toLowerCase() === ADMIN_EMAIL &&
            typeof updates.username === 'string' && updates.username.trim() === ADMIN_USERNAME
            ? 'ADMIN'
            : updates.role === 'USER' ? 'USER' : undefined,
    };
    const cleanedUpdates = Object.fromEntries(Object.entries(allowedUpdates).filter(([, value]) => value !== undefined));
    const updatedUser = await store.updateUser(request.params.id, cleanedUpdates);
    return response.json({ user: publicUserResponse(updatedUser) });
});
app.delete('/admin/users/:id', async (request, response) => {
    const user = adminUser(request);
    if (!user)
        return response.status(403).json({ error: 'Administrator access required.' });
    if (request.params.id === user.id)
        return response.status(400).json({ error: 'The administrator cannot delete their own account.' });
    const deleted = await store.deleteUser(request.params.id);
    return deleted ? response.status(204).send() : response.status(404).json({ error: 'User not found.' });
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
            if (peer !== socket && peer.readyState === peer.OPEN)
                peer.send(raw.toString());
        }
    });
});
await store.load();
httpServer.listen(config.port, config.host, () => {
    console.log(`Florxup API listening on http://${config.host}:${config.port}`);
    console.log(`WebSocket endpoint: ws://localhost:${config.port}/ws?token=<access-token>`);
});
