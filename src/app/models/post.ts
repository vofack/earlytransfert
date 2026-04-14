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
}
