import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64));
    return `${salt}:${derivedKey.toString('hex')}`;
}
export async function verifyPassword(password, storedHash) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key)
        return false;
    const derivedKey = (await scrypt(password, salt, 64));
    const storedKey = Buffer.from(key, 'hex');
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}
export function createAccessToken(userId, role = 'USER') {
    return jwt.sign({ sub: userId, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}
export function getUserIdFromToken(token) {
    try {
        const payload = jwt.verify(token, config.jwtSecret);
        return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
    }
    catch {
        return null;
    }
}
