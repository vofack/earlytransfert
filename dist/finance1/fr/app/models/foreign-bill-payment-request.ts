export interface ForeignBillPaymentRequest {
  id: string;
  userEmail: string;
  billType: 'tuition' | 'subscription' | 'service' | 'other' | string;
  providerName: string;
  providerWebsite: string;
  accountReference: string;
  amount: number;
  commission: number;
  estimatedTotal: number;
  currency: string;
  destinationCountry: string;
  dueDate: string;
  reimbursementMethod: 'mobile_money' | 'interac' | 'cash' | string;
  contactPhone: string;
  notes: string;
  status: 'pending' | 'in_progress' | 'paid' | 'reimbursed' | 'rejected' | string;
  createdAt: any;
  pickedUpAt?: string;
  paidAt?: string;
  reimbursedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  proofUrl?: string;
  paymentReference?: string;
  adminNote?: string;
  userMessageEn?: string;
  userMessageFr?: string;
  userMessageUpdatedAt?: string;
  // Deprecated: legacy single-language field kept so previously written
  // messages still surface to users until the admin re-saves the request.
  userMessage?: string;
}
