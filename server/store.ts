import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  statusBio: string;
  avatarUrl: string | null;
  publicKey: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface BackendData {
  users: StoredUser[];
}

const emptyData = (): BackendData => ({ users: [] });

export class Store {
  private data: BackendData = emptyData();
  private readonly filePath = resolve(config.dataFile);

  async load(): Promise<void> {
    try {
      this.data = JSON.parse(await readFile(this.filePath, 'utf8')) as BackendData;
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
      await this.save();
    }
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  listUsers(): StoredUser[] {
    return this.data.users;
  }

  findUserById(id: string): StoredUser | undefined {
    return this.data.users.find((user) => user.id === id);
  }

  findUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find((user) => user.email === email);
  }

  findUserByUsername(username: string): StoredUser | undefined {
    return this.data.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
  }

  async createUser(input: Omit<StoredUser, 'id' | 'createdAt'>): Promise<StoredUser> {
    const user: StoredUser = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    this.data.users.push(user);
    await this.save();
    return user;
  }
}

export function toPublicUser(user: StoredUser) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
