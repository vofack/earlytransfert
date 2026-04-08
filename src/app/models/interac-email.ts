export interface InteracEmail {
  id?: string;
  messageId?: string;
  from: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  amount?: string;
  senderName?: string;
  status: 'new' | 'processed' | 'ignored';
  processedAt?: string;
}
