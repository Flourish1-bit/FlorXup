import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
const emptyData = () => ({ users: [] });
export class Store {
    data = emptyData();
    filePath = resolve(config.dataFile);
    async load() {
        try {
            this.data = JSON.parse(await readFile(this.filePath, 'utf8'));
            this.data.users = (this.data.users || []).map((user) => ({
                ...user,
                role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
            }));
        }
        catch (error) {
            if (error?.code !== 'ENOENT')
                throw error;
            await this.save();
        }
    }
    async save() {
        await mkdir(dirname(this.filePath), { recursive: true });
        await writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    }
    listUsers() {
        return this.data.users;
    }
    findUserById(id) {
        return this.data.users.find((user) => user.id === id);
    }
    findUserByEmail(email) {
        return this.data.users.find((user) => user.email === email);
    }
    findUserByUsername(username) {
        return this.data.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
    }
    async createUser(input) {
        const user = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
        this.data.users.push(user);
        await this.save();
        return user;
    }
    async updateUser(id, updates) {
        const user = this.findUserById(id);
        if (!user)
            return undefined;
        Object.assign(user, updates);
        await this.save();
        return user;
    }
    async deleteUser(id) {
        const originalLength = this.data.users.length;
        this.data.users = this.data.users.filter((user) => user.id !== id);
        if (this.data.users.length === originalLength)
            return false;
        await this.save();
        return true;
    }
}
export function toPublicUser(user) {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
}
