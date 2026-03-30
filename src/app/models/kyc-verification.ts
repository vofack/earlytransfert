export interface KycVerification {
  id: string;
  userEmail: string;
  status: string;
  idPhotoUrl: string;
  selfieUrl: string;
  extractedName: string;
  extractedDocumentNumber: string;
  submittedAt: string;
  verifiedAt: string;
  rejectionReason: string;
}
