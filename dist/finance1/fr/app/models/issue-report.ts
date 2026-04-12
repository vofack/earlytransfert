export interface IssueReport {
  id?: string;
  messageId?: string;
  from: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  senderName?: string;
  status: 'new' | 'resolved' | 'ignored';
  resolvedAt?: string;
}
