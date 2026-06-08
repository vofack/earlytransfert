export interface Proposition {
  docId: string;
  idOfPost: string;
  propositionEmail: string;
  idPostTransaction: string;
  idPropositionTransaction: string;
  amountReceived: string;
  amountSend: string;
  amount: number;
  progressBarStatus: string;
  status: boolean;
}

export interface Post {
  docId: string;
  telephone: string;
  userEmail: string;
  name: string;
  senderFlag: string;
  receiverFlag: string;
  message: string;
  curve: boolean;
  status: boolean;
  rate: { [key: string]: string };
  propositions: Proposition[];
  createdAt: any;
  listOfLikes: string[];
  // Soft-delete / lifecycle state, mirrored from the Flutter client:
  //   'active' | 'cancelled' | 'trashed'
  lifecycle?: string;
  cancelledAt?: any;
  // Drives the 30-day inactivity clock (defaults to createdAt on legacy docs).
  lastActivityAt?: any;
  // Set when the post is in the corbeille; starts the 30-day restore window.
  trashedAt?: any;
  // 0 = none, 1 = 7-day expiry warning sent, 2 = 1-day warning sent.
  expiryWarningStage?: number;
}
