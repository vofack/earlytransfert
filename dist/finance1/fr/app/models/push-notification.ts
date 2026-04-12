export interface PushNotification {
  id?: string;
  title: string;
  body: string;
  targetEmail: string; // user email or 'all'
  sentAt?: string;
  successCount?: number;
  failureCount?: number;
  totalTokens?: number;
}
