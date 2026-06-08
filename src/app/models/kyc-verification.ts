export interface KycVerification {
  id: string;
  userEmail: string;
  status: string;
  idPhotoUrl: string;
  idBackPhotoUrl: string;
  selfieUrl: string;
  extractedName: string;
  extractedDocumentNumber: string;
  submittedAt: string;
  verifiedAt: string;
  rejectionReason: string;
  // Computed client-side (not stored in Firestore): this row's chronological
  // attempt number for the user, and the user's total number of attempts.
  attemptNumber?: number;
  totalAttempts?: number;
}
