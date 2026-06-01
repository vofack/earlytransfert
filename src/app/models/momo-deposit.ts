export interface MomoDeposit {
  id?: string;
  walletId: string;
  walletEmail: string;
  momoCode?: string;
  amount: number;
  currency: string;             // 'XAF'
  transactionId: string;        // MoMo transaction reference from the SMS
  operator: 'MTN' | 'ORANGE';
  senderPhone?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;          // ISO
  approvedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
}
