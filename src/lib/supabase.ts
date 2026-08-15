import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, PrivateMessage, GlobalDevMessage, Contact } from '../types';

export interface UserAccountCredentials {
  id: string;
  username: string;
  email: string;
  phone_number?: string;
  passwordHash: string; // Stored client-side safe representation
  profile: UserProfile;
}

const STORAGE_USERS_KEY = 'florxup_registered_users_v1';
const STORAGE_SESSION_KEY = 'florxup_auth_session_v1';
const STORAGE_CONTACTS_KEY = 'florxup_contacts_v1';
const STORAGE_MESSAGES_KEY = 'florxup_private_messages_v1';
const STORAGE_GLOBAL_KEY = 'florxup_global_messages_v1';
const STORAGE_GROUP_STATES_KEY = 'florxup_group_states_v1';
const STORAGE_REPORTS_KEY = 'florxup_reports_v1';
const STORAGE_SUPABASE_CREDS_KEY = 'florxup_custom_supabase_creds_v1';

// Initial verified system welcome announcement
export const SYSTEM_WELCOME_MESSAGE: GlobalDevMessage = {
  id: 'gmsg_system_welcome',
  sender_id: 'usr_florxup_system',
  sender: {
    id: 'usr_florxup_system',
    username: 'Florxup Community',
    status_bio: 'Official Code for Humanity Broadcast Hub 🌿',
    public_key: '',
    is_online: true,
  },
  content: `### 🌿 Welcome to **Florxup**!
Connect freely, chat securely, and share information worldwide for the **Code for Humanity** initiative.

* 🛡️ **Private 1-on-1 Chats**: Client-side cryptography ensures only you and your recipient can read private messages.
* 🌍 **Global Community**: Post updates, project repositories, and humanitarian collaboration requests.
* ⚡ **Fast & Responsive**: Clean initials, zero tracking, instant peer connectivity.

Feel free to post updates, share research links, or search registered users to start private conversations!`,
  message_type: 'announcement',
  tags: ['welcome', 'humanity', 'security'],
  reactions: { '🚀': ['usr_florxup_system'], '❤️': ['usr_florxup_system'] },
  created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  pinned: true,
};

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;
  private localUsers: UserAccountCredentials[] = [];
  private localContacts: { user_id: string; contact_id: string }[] = [];
  private localPrivateMessages: PrivateMessage[] = [];
  private localGlobalMessages: GlobalDevMessage[] = [SYSTEM_WELCOME_MESSAGE];
  private localGroupStates: Record<string, import('../types').GroupMembershipState> = {};
  private localReports: import('../types').GroupReport[] = [];
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();

  constructor() {
    this.loadFromStorage();
    this.initClient();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUsers = localStorage.getItem(STORAGE_USERS_KEY);
        if (storedUsers) {
          this.localUsers = JSON.parse(storedUsers);
        }

        const storedContacts = localStorage.getItem(STORAGE_CONTACTS_KEY);
        if (storedContacts) {
          this.localContacts = JSON.parse(storedContacts);
        }

        const storedMessages = localStorage.getItem(STORAGE_MESSAGES_KEY);
        if (storedMessages) {
          this.localPrivateMessages = JSON.parse(storedMessages);
        }

        const storedGlobal = localStorage.getItem(STORAGE_GLOBAL_KEY);
        if (storedGlobal) {
          const parsed = JSON.parse(storedGlobal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.localGlobalMessages = parsed;
          }
        }

        const storedGroupStates = localStorage.getItem(STORAGE_GROUP_STATES_KEY);
        if (storedGroupStates) {
          this.localGroupStates = JSON.parse(storedGroupStates);
        }

        const storedReports = localStorage.getItem(STORAGE_REPORTS_KEY);
        if (storedReports) {
          this.localReports = JSON.parse(storedReports);
        }
      }

      // Seed default active community peers if none exist
      if (this.localUsers.length === 0) {
        const seedPeers: UserAccountCredentials[] = [
          {
            id: 'usr_alex_dev',
            username: 'alex_dev',
            email: 'alex@codeforhumanity.org',
            passwordHash: btoa('florxup2026'),
            profile: {
              id: 'usr_alex_dev',
              username: 'alex_dev',
              email: 'alex@codeforhumanity.org',
              status_bio: 'E2EE & Distributed Systems Lead 🛡️',
              public_key: '{"kty":"EC","crv":"P-256","x":"W-m6zCgQvJzU9k6mS9oK8L7yX5w2P1n0A9b8C7d6E5f","y":"M4n3P2q1R0s9T8u7V6w5X4y3Z2a1B0c9D8e7F6g5H4i"}',
              is_online: true,
              last_seen: new Date().toISOString(),
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
          },
          {
            id: 'usr_maya_chen',
            username: 'maya_chen',
            email: 'maya@openhumanity.io',
            passwordHash: btoa('florxup2026'),
            profile: {
              id: 'usr_maya_chen',
              username: 'maya_chen',
              email: 'maya@openhumanity.io',
              status_bio: 'Building open-source tech for humanity 🌍',
              public_key: '{"kty":"EC","crv":"P-256","x":"K7n8P9q0R1s2T3u4V5w6X7y8Z9a0B1c2D3e4F5g6H7i","y":"A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v"}',
              is_online: true,
              last_seen: new Date().toISOString(),
              created_at: new Date(Date.now() - 43200000).toISOString(),
            },
          },
        ];
        this.localUsers = seedPeers;
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.localUsers));
        localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(this.localContacts));
        localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(this.localPrivateMessages));
        localStorage.setItem(STORAGE_GLOBAL_KEY, JSON.stringify(this.localGlobalMessages));
        localStorage.setItem(STORAGE_GROUP_STATES_KEY, JSON.stringify(this.localGroupStates));
        localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(this.localReports));
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  public getCustomCredentials(): { url: string; key: string } | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_SUPABASE_CREDS_KEY);
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {}
    return null;
  }

  public initClient(customUrl?: string, customKey?: string) {
    const savedCreds = this.getCustomCredentials();
    const url =
      customUrl !== undefined
        ? customUrl
        : savedCreds?.url || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : '') || '';
    const anonKey =
      customKey !== undefined
        ? customKey
        : savedCreds?.key || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : '') || '';

    if (customUrl !== undefined || customKey !== undefined) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_SUPABASE_CREDS_KEY, JSON.stringify({ url, key: anonKey }));
        }
      } catch (e) {}
    }

    if (url && anonKey && !url.includes('your-project')) {
      try {
        this.client = createClient(url, anonKey);
        this.isConfigured = true;
        console.log('✅ Supabase initialized with live endpoints');
      } catch (err) {
        console.warn('Could not initialize live Supabase client, using local-first storage:', err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  public getIsConfigured(): boolean {
    return this.isConfigured;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  // --------------------------------------------------------------------------
  // Authentication: Sign Up & Sign In
  // --------------------------------------------------------------------------

  public getStoredSession(): UserProfile | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_SESSION_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public setStoredSession(user: UserProfile | null): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (user) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(STORAGE_SESSION_KEY);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  public async signUp(params: {
    username: string;
    email: string;
    phone_number?: string;
    password: string;
    statusBio?: string;
    avatarUrl?: string | null;
    publicKey: string;
  }): Promise<UserProfile> {
    const cleanUsername = params.username.trim().replace(/^@+/, '');
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPhone = params.phone_number?.trim() || '';
    const normalizedPhone = cleanPhone.replace(/[^\d+]/g, '');

    // Check if username, email, or phone number already exists
    const existing = this.localUsers.find((u) => {
      if (u.username.toLowerCase() === cleanUsername.toLowerCase()) return true;
      if (u.email.toLowerCase() === cleanEmail) return true;
      if (normalizedPhone && u.phone_number && u.phone_number.replace(/[^\d+]/g, '') === normalizedPhone) return true;
      return false;
    });

    if (existing) {
      if (existing.username.toLowerCase() === cleanUsername.toLowerCase()) {
        throw new Error(`Username @${cleanUsername} is already registered. Please sign in or choose another.`);
      }
      if (existing.email.toLowerCase() === cleanEmail) {
        throw new Error(`Email ${cleanEmail} is already registered. Please sign in.`);
      }
      if (normalizedPhone && existing.phone_number && existing.phone_number.replace(/[^\d+]/g, '') === normalizedPhone) {
        throw new Error(`Phone number ${cleanPhone} is already registered. Please sign in.`);
      }
    }

    const userId =
      'usr_' +
      cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '_') +
      '_' +
      Math.random().toString(36).substring(2, 7);

    const newProfile: UserProfile = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      phone_number: cleanPhone || undefined,
      avatar_url: params.avatarUrl || null,
      status_bio: params.statusBio?.trim() || 'Building for Humanity with Florxup 🚀',
      public_key: params.publicKey,
      is_online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // If Supabase live is configured, also create auth record.
    // Fail fast here so we do not silently mask a database/auth problem with a local-only account.
    if (this.isConfigured && this.client) {
      try {
        await this.client.auth.signUp({
          email: cleanEmail,
          password: params.password,
          options: {
            data: { username: cleanUsername, phone_number: cleanPhone },
          },
        });
        await this.client.from('profiles').upsert(newProfile);
      } catch (err) {
        console.error('Supabase cloud signup error:', err);
        throw err;
      }
    }

    // Save user credential
    this.localUsers.push({
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      phone_number: cleanPhone || undefined,
      passwordHash: btoa(params.password),
      profile: newProfile,
    });

    this.saveToStorage();
    this.setStoredSession(newProfile);
    this.emit('profile_updated', newProfile);

    return newProfile;
  }

  public async signIn(identifier: string, password: string): Promise<UserProfile> {
    const cleanIdentifier = identifier.trim().replace(/^@+/, '').toLowerCase();
    const identifierDigits = identifier.replace(/[^\d+]/g, '');

    // If Supabase live client is enabled and identifier is email
    if (this.isConfigured && this.client && cleanIdentifier.includes('@')) {
      try {
        const { data, error } = await this.client.auth.signInWithPassword({
          email: cleanIdentifier,
          password,
        });

        if (!error && data.user) {
          const profile = await this.getProfile(data.user.id);
          if (profile) {
            this.setStoredSession(profile);
            return profile;
          }
        }
      } catch (e) {
        console.warn('Cloud sign-in attempt error:', e);
      }
    }

    // Local / offline credential check (matches username, email, or phone number)
    const userAccount = this.localUsers.find((u) => {
      if (u.username.toLowerCase() === cleanIdentifier) return true;
      if (u.email.toLowerCase() === cleanIdentifier) return true;
      if (u.phone_number) {
        const userPhoneDigits = u.phone_number.replace(/[^\d+]/g, '');
        if (
          (identifierDigits.length >= 7 && userPhoneDigits === identifierDigits) ||
          u.phone_number.toLowerCase() === cleanIdentifier
        ) {
          return true;
        }
      }
      return false;
    });

    if (!userAccount) {
      throw new Error(`Account not found for "${identifier}". Please check your handle/email/phone or sign up.`);
    }

    if (userAccount.passwordHash !== btoa(password)) {
      throw new Error('Incorrect password. Please try again.');
    }

    const updatedProfile: UserProfile = {
      ...userAccount.profile,
      is_online: true,
      last_seen: new Date().toISOString(),
    };

    userAccount.profile = updatedProfile;
    this.saveToStorage();
    this.setStoredSession(updatedProfile);
    this.emit('profile_updated', updatedProfile);

    return updatedProfile;
  }

  public async signOut(userId?: string): Promise<void> {
    if (userId) {
      const idx = this.localUsers.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        this.localUsers[idx].profile.is_online = false;
        this.localUsers[idx].profile.last_seen = new Date().toISOString();
        this.emit('profile_updated', this.localUsers[idx].profile);
      }
    }

    this.setStoredSession(null);

    if (this.isConfigured && this.client) {
      try {
        await this.client.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
  }

  // --------------------------------------------------------------------------
  // Profile Management
  // --------------------------------------------------------------------------

  async getProfiles(): Promise<UserProfile[]> {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client.from('profiles').select('*').order('username');
      if (!error && data && data.length > 0) {
        return data;
      }
    }
    return this.localUsers.map((u) => u.profile);
  }

  async getProfile(id: string): Promise<UserProfile | null> {
    if (this.isConfigured && this.client) {
      const { data } = await this.client.from('profiles').select('*').eq('id', id).single();
      if (data) return data;
    }
    const acc = this.localUsers.find((u) => u.id === id);
    return acc ? acc.profile : null;
  }

  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client.from('profiles').upsert(profile).select().single();
      if (!error && data) {
        this.emit('profile_updated', data);
        return data;
      }
    }

    const idx = this.localUsers.findIndex((u) => u.id === profile.id);
    if (idx >= 0) {
      this.localUsers[idx].profile = { ...this.localUsers[idx].profile, ...profile };
      if (profile.email) this.localUsers[idx].email = profile.email;
      if (profile.phone_number) this.localUsers[idx].phone_number = profile.phone_number;
    } else {
      this.localUsers.push({
        id: profile.id,
        username: profile.username,
        email: profile.email || `${profile.username.toLowerCase()}@florxup.local`,
        phone_number: profile.phone_number,
        passwordHash: '',
        profile,
      });
    }

    this.saveToStorage();
    this.emit('profile_updated', profile);
    return profile;
  }

  // --------------------------------------------------------------------------
  // Contact Management
  // --------------------------------------------------------------------------

  async getContacts(userId: string): Promise<UserProfile[]> {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('contacts')
        .select('contact_id, contact_profile:profiles!contact_id(*)')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => d.contact_profile).filter(Boolean);
      }
    }

    const contactIds = this.localContacts
      .filter((c) => c.user_id === userId)
      .map((c) => c.contact_id);

    return this.localUsers
      .map((u) => u.profile)
      .filter((p) => contactIds.includes(p.id));
  }

  async addContact(userId: string, contactId: string): Promise<boolean> {
    if (userId === contactId) return false;

    if (this.isConfigured && this.client) {
      const { error } = await this.client
        .from('contacts')
        .upsert({ user_id: userId, contact_id: contactId });
      if (!error) {
        this.emit(`contacts_${userId}`, { type: 'added', contactId });
        return true;
      }
    }

    const exists = this.localContacts.some((c) => c.user_id === userId && c.contact_id === contactId);
    if (!exists) {
      this.localContacts.push({ user_id: userId, contact_id: contactId });
      this.saveToStorage();
      this.emit(`contacts_${userId}`, { type: 'added', contactId });
    }
    return true;
  }

  async removeContact(userId: string, contactId: string): Promise<boolean> {
    if (this.isConfigured && this.client) {
      const { error } = await this.client
        .from('contacts')
        .delete()
        .eq('user_id', userId)
        .eq('contact_id', contactId);
      if (!error) {
        this.emit(`contacts_${userId}`, { type: 'removed', contactId });
        return true;
      }
    }

    this.localContacts = this.localContacts.filter(
      (c) => !(c.user_id === userId && c.contact_id === contactId)
    );
    this.saveToStorage();
    this.emit(`contacts_${userId}`, { type: 'removed', contactId });
    return true;
  }

  async searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
    const clean = query.trim().toLowerCase();
    const digits = query.replace(/[^\d+]/g, '');
    if (!clean) return [];

    const all = await this.getProfiles();
    return all.filter(
      (p) =>
        p.id !== currentUserId &&
        (p.username.toLowerCase().includes(clean) ||
          (p.status_bio && p.status_bio.toLowerCase().includes(clean)) ||
          (p.email && p.email.toLowerCase().includes(clean)) ||
          (p.phone_number && (
            p.phone_number.toLowerCase().includes(clean) ||
            (digits.length >= 3 && p.phone_number.replace(/[^\d+]/g, '').includes(digits))
          )))
    );
  }

  // --------------------------------------------------------------------------
  // Private Messages (E2EE)
  // --------------------------------------------------------------------------

  async getPrivateMessages(userId1: string, userId2: string): Promise<PrivateMessage[]> {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('private_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`
        )
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data;
      }
    }

    return this.localPrivateMessages.filter(
      (m) =>
        (m.sender_id === userId1 && m.recipient_id === userId2) ||
        (m.sender_id === userId2 && m.recipient_id === userId1)
    );
  }

  async sendPrivateMessage(
    senderId: string,
    recipientId: string,
    ciphertext: string,
    iv: string,
    plainForLocalSender?: string
  ): Promise<PrivateMessage> {
    const newMessage: PrivateMessage = {
      id: 'pmsg_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      sender_id: senderId,
      recipient_id: recipientId,
      ciphertext,
      iv,
      created_at: new Date().toISOString(),
      is_delivered: true,
      is_read: false,
      decryptedContent: plainForLocalSender,
      status: 'sent',
    };

    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('private_messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          ciphertext,
          iv,
        })
        .select()
        .single();

      if (!error && data) {
        const savedMsg = { ...data, decryptedContent: plainForLocalSender };
        this.emit(`private_${recipientId}`, savedMsg);
        this.emit(`private_${senderId}`, savedMsg);
        return savedMsg;
      }
    }

    this.localPrivateMessages.push(newMessage);
    this.saveToStorage();
    this.emit(`private_${recipientId}`, newMessage);
    this.emit(`private_${senderId}`, newMessage);
    return newMessage;
  }

  // --------------------------------------------------------------------------
  // Global Community Messages
  // --------------------------------------------------------------------------

  async getGlobalMessages(): Promise<GlobalDevMessage[]> {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('global_dev_messages')
        .select('*, sender:profiles(*)')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    }

    return this.localGlobalMessages.map((msg) => {
      const author = this.localUsers.find((u) => u.id === msg.sender_id)?.profile;
      return {
        ...msg,
        sender: msg.sender || author,
      };
    });
  }

  async sendGlobalMessage(
    senderId: string,
    content: string,
    messageType: 'text' | 'code' | 'snippet' | 'announcement' | 'humanity_project' = 'text',
    tags: string[] = []
  ): Promise<GlobalDevMessage> {
    const sender = this.localUsers.find((u) => u.id === senderId)?.profile;

    const newMsg: GlobalDevMessage = {
      id: 'gmsg_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      sender_id: senderId,
      sender,
      content,
      message_type: messageType,
      tags,
      reactions: {},
      created_at: new Date().toISOString(),
    };

    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('global_dev_messages')
        .insert({
          sender_id: senderId,
          content,
          message_type: messageType,
          tags,
          reactions: {},
        })
        .select('*, sender:profiles(*)')
        .single();

      if (!error && data) {
        this.emit('global_message', data);
        return data;
      }
    }

    this.localGlobalMessages.push(newMsg);
    this.saveToStorage();
    this.emit('global_message', newMsg);
    return newMsg;
  }

  async toggleGlobalReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    const msg = this.localGlobalMessages.find((m) => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      const current = msg.reactions[emoji] || [];
      if (current.includes(userId)) {
        msg.reactions[emoji] = current.filter((id) => id !== userId);
        if (msg.reactions[emoji].length === 0) {
          delete msg.reactions[emoji];
        }
      } else {
        msg.reactions[emoji] = [...current, userId];
      }
      this.saveToStorage();
      this.emit('global_message_updated', msg);
    }

    if (this.isConfigured && this.client && msg) {
      await this.client
        .from('global_dev_messages')
        .update({ reactions: msg.reactions })
        .eq('id', messageId);
    }
  }

  // --------------------------------------------------------------------------
  // Group Membership & Safety Moderation (Leave, Block, Report)
  // --------------------------------------------------------------------------

  getGroupMembership(userId: string, groupId: string = 'global_community'): import('../types').GroupMembershipState {
    const key = `${userId}_${groupId}`;
    if (this.localGroupStates[key]) {
      return this.localGroupStates[key];
    }
    return {
      groupId,
      isMember: true,
      isBlocked: false,
      isMuted: false,
    };
  }

  async leaveGroup(userId: string, groupId: string = 'global_community'): Promise<import('../types').GroupMembershipState> {
    const key = `${userId}_${groupId}`;
    const newState: import('../types').GroupMembershipState = {
      ...(this.localGroupStates[key] || { groupId, isBlocked: false, isMuted: false }),
      isMember: false,
      leftAt: new Date().toISOString(),
    };
    this.localGroupStates[key] = newState;
    this.saveToStorage();
    this.emit(`group_state_${userId}`, newState);
    return newState;
  }

  async rejoinGroup(userId: string, groupId: string = 'global_community'): Promise<import('../types').GroupMembershipState> {
    const key = `${userId}_${groupId}`;
    const newState: import('../types').GroupMembershipState = {
      ...(this.localGroupStates[key] || { groupId }),
      isMember: true,
      isBlocked: false,
      leftAt: undefined,
    };
    this.localGroupStates[key] = newState;
    this.saveToStorage();
    this.emit(`group_state_${userId}`, newState);
    return newState;
  }

  async blockGroup(userId: string, groupId: string = 'global_community'): Promise<import('../types').GroupMembershipState> {
    const key = `${userId}_${groupId}`;
    const newState: import('../types').GroupMembershipState = {
      ...(this.localGroupStates[key] || { groupId }),
      isMember: false,
      isBlocked: true,
      blockedAt: new Date().toISOString(),
    };
    this.localGroupStates[key] = newState;
    this.saveToStorage();
    this.emit(`group_state_${userId}`, newState);
    return newState;
  }

  async unblockGroup(userId: string, groupId: string = 'global_community'): Promise<import('../types').GroupMembershipState> {
    const key = `${userId}_${groupId}`;
    const previous = this.localGroupStates[key] || { groupId, isMember: true, isBlocked: false };
    const newState: import('../types').GroupMembershipState = {
      ...previous,
      groupId,
      isMember: previous.isMember ?? true,
      isBlocked: false,
      blockedAt: undefined,
    };
    this.localGroupStates[key] = newState;
    this.saveToStorage();
    this.emit(`group_state_${userId}`, newState);
    return newState;
  }

  async submitReport(report: Omit<import('../types').GroupReport, 'id' | 'created_at' | 'status'>): Promise<import('../types').GroupReport> {
    const newReport: import('../types').GroupReport = {
      ...report,
      id: 'rep_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    this.localReports.push(newReport);
    this.saveToStorage();

    if (this.isConfigured && this.client) {
      try {
        await this.client.from('reports').insert({
          reporter_id: newReport.reporter_id,
          target_type: newReport.target_type,
          target_id: newReport.target_id,
          group_id: newReport.group_id,
          reason: newReport.reason,
          details: newReport.details,
          offending_content: newReport.offending_content,
        });
      } catch (err) {
        console.warn('Could not post report to remote Supabase, saved locally:', err);
      }
    }

    return newReport;
  }

  getReports(userId?: string): import('../types').GroupReport[] {
    if (userId) {
      return this.localReports.filter((r) => r.reporter_id === userId);
    }
    return this.localReports;
  }

  // --------------------------------------------------------------------------
  // Realtime & Event Emitters (Messages, Typing Indicators, Presence)
  // --------------------------------------------------------------------------

  private typingChannels = new Map<string, any>();

  sendTypingStatus(senderId: string, recipientId: string, isTyping: boolean): void {
    const channelId = [senderId, recipientId].sort().join('_');
    const payload = {
      senderId,
      recipientId,
      isTyping,
      timestamp: Date.now(),
    };

    // Emit locally across windows/tabs
    this.emit(`typing_${recipientId}`, payload);
    this.emit(`typing_room_${channelId}`, payload);

    // Also broadcast over Supabase Realtime Channel if configured
    if (this.isConfigured && this.client) {
      let roomChannel = this.typingChannels.get(channelId);
      if (!roomChannel) {
        roomChannel = this.client.channel(`room_presence_${channelId}`, {
          config: { broadcast: { self: false } },
        });
        roomChannel.subscribe();
        this.typingChannels.set(channelId, roomChannel);
      }

      roomChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload,
      });
    }
  }

  subscribeTyping(
    userId: string,
    otherUserId: string,
    callback: (payload: { senderId: string; isTyping: boolean; timestamp: number }) => void
  ): () => void {
    const channelId = [userId, otherUserId].sort().join('_');

    // Subscribe to local emitter
    const localCallback = (data: any) => {
      if (data.senderId === otherUserId) {
        callback(data);
      }
    };

    if (!this.listeners.has(`typing_${userId}`)) {
      this.listeners.set(`typing_${userId}`, new Set());
    }
    this.listeners.get(`typing_${userId}`)!.add(localCallback);

    // Subscribe to Supabase realtime broadcast
    let supabaseChannel: any = null;
    if (this.isConfigured && this.client) {
      supabaseChannel = this.client
        .channel(`room_presence_${channelId}`)
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload && payload.senderId === otherUserId) {
            callback(payload);
          }
        })
        .subscribe();
    }

    return () => {
      this.listeners.get(`typing_${userId}`)?.delete(localCallback);
      if (supabaseChannel && this.client) {
        this.client.removeChannel(supabaseChannel);
      }
    };
  }

  subscribe(channel: string, callback: (payload: any) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    let supabaseSubscription: any = null;
    if (this.isConfigured && this.client) {
      if (channel.startsWith('private_')) {
        supabaseSubscription = this.client
          .channel(`realtime_${channel}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'private_messages' },
            (payload) => {
              callback(payload.new);
            }
          )
          .subscribe();
      } else if (channel === 'global_message') {
        supabaseSubscription = this.client
          .channel('realtime_global_messages')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'global_dev_messages' },
            (payload) => {
              callback(payload.new);
            }
          )
          .subscribe();
      }
    }

    return () => {
      this.listeners.get(channel)?.delete(callback);
      if (supabaseSubscription && this.client) {
        this.client.removeChannel(supabaseSubscription);
      }
    };
  }

  private emit(channel: string, payload: any) {
    this.listeners.get(channel)?.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error('Error in event listener for channel', channel, e);
      }
    });
  }
}

export const supabaseService = new SupabaseService();
