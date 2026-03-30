export interface AdminMessage {
  id?: string;
  messageEn: string;
  messageFr: string;
  isActive: boolean;
  type: 'info' | 'warning' | 'error';
  targetUserEmail: string; // empty string = broadcast to all users
  createdAt?: string;
  updatedAt?: string;
}
