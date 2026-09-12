export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string | null;
  status_bio?: string;
  public_key: string; // JWK JSON string
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  contact_profile?: UserProfile;
  created_at?: string;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  ciphertext: string; // Base64 AES-GCM ciphertext
  iv: string;         // Base64 Initialization Vector (12 bytes)
  sender_ciphertext?: string;
  sender_iv?: string;
  created_at: string;
  is_delivered?: boolean;
  is_read?: boolean;
  delivered_at?: string;
  read_at?: string;
  // Local transient decrypted content (never sent over the wire)
  decryptedContent?: string;
  decryptionError?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'image' | 'code' | 'file' | 'link' | 'snippet';
  title?: string;
  data: string; // URL, Base64, or code snippet
  language?: string;
  size?: number;
}

export interface GlobalDevMessage {
  id: string;
  sender_id: string;
  sender?: UserProfile;
  content: string;
  message_type?: 'text' | 'code' | 'snippet' | 'announcement' | 'humanity_project';
  tags?: string[];
  reactions?: Record<string, string[]>; // emoji -> array of user_ids
  created_at: string;
  pinned?: boolean;
}

export interface SecurityFingerprint {
  fingerprint: string;
  blocks: string[];
  qrData: string;
  verified: boolean;
}

export interface GroupReport {
  id: string;
  reporter_id: string;
  target_type: 'group' | 'message' | 'user';
  target_id: string;
  group_id?: string;
  reason: string;
  details?: string;
  offending_content?: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface GroupMembershipState {
  groupId: string;
  isMember: boolean;
  isBlocked: boolean;
  isMuted?: boolean;
  leftAt?: string;
  blockedAt?: string;
}
