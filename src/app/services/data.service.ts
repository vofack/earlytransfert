import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { AdminMessage } from '../models/admin-message';
import { WalletAccount } from '../models/wallet-account';
import { InteracEmail } from '../models/interac-email';
import { IssueReport } from '../models/issue-report';
import { DepositIssueReport } from '../models/deposit-issue-report';
import { Beneficiary } from '../models/beneficiary';
import { allTransaction, Transaction } from '../models/transaction';
import { User } from '../models/user';
import { Post } from '../models/post';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private afs : AngularFirestore, private fireStorage : AngularFireStorage) { }


  // add user
  adduser(user : User) {
    user.id = this.afs.createId();
    return this.afs.collection('/users').add(user);
  }
  
  // get all users
  getAllusers() { 
    return this.afs.collection('/users').snapshotChanges();
  }

  // get Pay
  getPay() { 
    return this.afs.collection('/pay').valueChanges({idField: '"mg6GHY8RPYCo7KzHobR2"'});
  }

    // delete user
  deleteuser(user : User) {
      this.afs.doc('/users/'+user.id).delete();
  }

  // update user
  updateuser(user : User) {
    this.deleteuser(user);
    this.adduser(user);
  }

  // update pay
  updatePay(id: string, amount: number) {
    const data = {amount: amount};
    this.afs.collection('/pay').doc(id).update(data);
  }

  // add user
  addBeneficiary(beneficiary : Beneficiary) {
    beneficiary.id = this.afs.createId();
    return this.afs.collection('/beneficiaries').add(beneficiary);
  }
  
  // get all beneficiary
  getAllBeneficiary() {
    return this.afs.collection('/beneficiaries').snapshotChanges();
  }

    // delete user
  deleteBeneficiary(beneficiary : Beneficiary) {
      this.afs.doc('/beneficiaries/'+beneficiary.id).delete();
   }

  // update user
  updateBeneficiary(beneficiary : Beneficiary) {
    this.deleteBeneficiary(beneficiary);
    this.addBeneficiary(beneficiary);
  }

     // add transaction
  addTransaction(transaction : Transaction) {
      transaction.id = this.afs.createId();
      return this.afs.collection('/transactions').add(transaction);
  }
  _addTransaction(transaction : allTransaction) {
    transaction.id = this.afs.createId();
    return this.afs.collection('/allTransactions').add(transaction);
  }
  
     // get all transactions
  getAlltransactions() { 
      return this.afs.collection('/transactions').snapshotChanges();
  }
  // get all transactions
  _getAlltransactions() { 
        return this.afs.collection('/allTransactions').snapshotChanges();
  }

      // delete user
  deleteTransaction(transaction : Transaction) {
        this.afs.doc('/transactions/'+transaction.id).delete();
  }
      // delete user
  _deleteTransaction(transaction : allTransaction) {
        this.afs.doc('/allTransactions/'+transaction.id).delete();
  }

   // update user
   updateTransaction(transaction : Transaction) {
    this.deleteTransaction(transaction);
    this.afs.collection('/transactions').add(transaction);
  }
     // update user
  _updateTransaction(transaction : allTransaction) {
      this._deleteTransaction(transaction);
      this.afs.collection('/allTransactions').add(transaction);
  }

  // ── KYC VERIFICATIONS ──

  // get all kyc verifications
  getAllKycVerifications() {
    return this.afs.collection('/kyc_verifications').snapshotChanges();
  }

  // approve kyc verification
  approveKyc(docId: string) {
    return this.afs.collection('/kyc_verifications').doc(docId).update({
      status: 'verified',
      verifiedAt: new Date().toISOString()
    });
  }

  // set kyc verification back to pending
  setKycPending(docId: string) {
    return this.afs.collection('/kyc_verifications').doc(docId).update({
      status: 'pending',
      verifiedAt: '',
      rejectionReason: ''
    });
  }

  // reject kyc verification
  rejectKyc(docId: string, rejectionReason: string) {
    return this.afs.collection('/kyc_verifications').doc(docId).update({
      status: 'rejected',
      rejectionReason: rejectionReason
    });
  }

  // ── ADMIN MESSAGES ──

  // get all admin messages
  getAllAdminMessages() {
    return this.afs.collection('/admin_messages').snapshotChanges();
  }

  // add admin message
  addAdminMessage(msg: AdminMessage) {
    msg.createdAt = new Date().toISOString();
    msg.updatedAt = new Date().toISOString();
    return this.afs.collection('/admin_messages').add(msg);
  }

  // update admin message
  updateAdminMessage(id: string, msg: Partial<AdminMessage>) {
    msg.updatedAt = new Date().toISOString();
    return this.afs.collection('/admin_messages').doc(id).update(msg);
  }

  // delete admin message
  deleteAdminMessage(id: string) {
    return this.afs.collection('/admin_messages').doc(id).delete();
  }

  // ── Wallet Accounts ──────────────────────────────────────────────────────

  getAllWalletAccounts() {
    return this.afs.collection('/walletAccount').snapshotChanges();
  }

  updateWalletAmount(id: string, amount: number) {
    return this.afs.collection('/walletAccount').doc(id).update({ amount });
  }

  // Find a CAD wallet whose interacEmail matches, falling back to usersEmail.
  // Used by the Interac email "Mark Processed" flow to debit the sender's wallet.
  findWalletForInteracSender(senderEmail: string): Promise<WalletAccount | null> {
    const email = (senderEmail || '').trim().toLowerCase();
    if (!email) return Promise.resolve(null);

    const matchByInterac = this.afs
      .collection<WalletAccount>('/walletAccount', ref =>
        ref.where('interacEmail', '==', email).limit(1)
      )
      .get().toPromise();

    return matchByInterac.then(snap => {
      if (snap && !snap.empty) {
        const doc = snap.docs[0];
        return { ...(doc.data() as WalletAccount), id: doc.id };
      }
      return this.afs
        .collection<WalletAccount>('/walletAccount', ref =>
          ref.where('usersEmail', '==', email).where('currency', '==', 'CAD').limit(1)
        )
        .get().toPromise()
        .then(snap2 => {
          if (snap2 && !snap2.empty) {
            const doc = snap2.docs[0];
            return { ...(doc.data() as WalletAccount), id: doc.id };
          }
          return null;
        });
    });
  }

  // ── Interac Emails ──────────────────────────────────────────────────────

  getAllInteracEmails() {
    return this.afs.collection('/interac_emails', ref => ref.orderBy('date', 'desc')).snapshotChanges();
  }

  updateInteracEmailStatus(id: string, status: 'new' | 'processed' | 'ignored') {
    const update: any = { status };
    if (status === 'processed') {
      update.processedAt = new Date().toISOString();
    }
    return this.afs.collection('/interac_emails').doc(id).update(update);
  }

  // ── Issue Report Emails ─────────────────────────────────────────────────

  getAllIssueReportEmails() {
    return this.afs.collection('/issue_report_emails', ref => ref.orderBy('date', 'desc')).snapshotChanges();
  }

  updateIssueReportStatus(id: string, status: 'new' | 'resolved' | 'ignored') {
    const update: any = { status };
    if (status === 'resolved') {
      update.resolvedAt = new Date().toISOString();
    }
    return this.afs.collection('/issue_report_emails').doc(id).update(update);
  }

  // ── Deposit Issue Reports (Interac / Mobile Money) ──────────────────────

  getAllDepositIssueReports() {
    return this.afs.collection('/deposit_issue_reports', ref => ref.orderBy('date', 'desc')).snapshotChanges();
  }

  updateDepositIssueReportStatus(id: string, status: 'new' | 'resolved' | 'ignored') {
    const update: any = { status };
    if (status === 'resolved') {
      update.resolvedAt = new Date().toISOString();
    }
    return this.afs.collection('/deposit_issue_reports').doc(id).update(update);
  }

  // ── Push Notifications ──────────────────────────────────────────────────

  getAllNotifications() {
    return this.afs.collection('/notifications', ref => ref.orderBy('sentAt', 'desc')).snapshotChanges();
  }

  getAllUsers() {
    return this.afs.collection('/users').snapshotChanges();
  }

  // sync user's kycStatus in the users collection
  updateUserKycStatus(userEmail: string, status: string) {
    return this.afs.collection('/users', ref => ref.where('email', '==', userEmail).limit(1))
      .get().toPromise().then(snapshot => {
        if (!snapshot.empty) {
          snapshot.docs[0].ref.update({ kycStatus: status });
        }
      });
  }

  // look up the FCM token for a user by email. Returns null when missing.
  getUserFcmToken(userEmail: string): Promise<string | null> {
    return this.afs.collection('/users', ref => ref.where('email', '==', userEmail).limit(1))
      .get().toPromise().then(snapshot => {
        if (snapshot.empty) return null;
        const data: any = snapshot.docs[0].data();
        return data && data.fcmToken ? data.fcmToken : null;
      });
  }

  // ── Foreign Client Bill Payment Requests ───────────────────────────────
  // Requests from users (typically in Africa) asking an agent in Canada to
  // pay a bill on their behalf. User reimburses the amount plus a commission.

  getAllForeignBillPaymentRequests() {
    return this.afs.collection('/foreignBillPaymentRequests').snapshotChanges();
  }

  markForeignBillPaymentInProgress(id: string) {
    return this.afs.collection('/foreignBillPaymentRequests').doc(id).update({
      status: 'in_progress',
      pickedUpAt: new Date().toISOString(),
    });
  }

  markForeignBillPaymentPaid(id: string, receipt?: { proofUrl?: string; reference?: string; note?: string }) {
    const update: any = {
      status: 'paid',
      paidAt: new Date().toISOString(),
    };
    if (receipt) {
      if (receipt.proofUrl !== undefined) update.proofUrl = receipt.proofUrl;
      if (receipt.reference !== undefined) update.paymentReference = receipt.reference;
      if (receipt.note !== undefined) update.adminNote = receipt.note;
    }
    return this.afs.collection('/foreignBillPaymentRequests').doc(id).update(update);
  }

  markForeignBillPaymentReimbursed(id: string) {
    return this.afs.collection('/foreignBillPaymentRequests').doc(id).update({
      status: 'reimbursed',
      reimbursedAt: new Date().toISOString(),
    });
  }

  rejectForeignBillPayment(id: string, reason: string) {
    return this.afs.collection('/foreignBillPaymentRequests').doc(id).update({
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: new Date().toISOString(),
    });
  }

  setForeignBillUserMessage(id: string, messageEn: string, messageFr: string) {
    return this.afs.collection('/foreignBillPaymentRequests').doc(id).update({
      userMessageEn: messageEn,
      userMessageFr: messageFr,
      userMessageUpdatedAt: new Date().toISOString(),
      // Clear the deprecated single-language field so the user app no longer
      // falls back to stale content once the admin saves a bilingual message.
      userMessage: '',
    });
  }

  // ── Marketplace Posts ───────────────────────────────────────────────────

  // Fetch a single Post by document id. Returns null when not found.
  // Used by the admin transactions grid to show the Post + Proposition that
  // spawned a marketplace transaction pair.
  getPostById(postId: string): Promise<Post | null> {
    return this.afs.collection('/posts').doc(postId).get().toPromise().then(snap => {
      if (!snap.exists) return null;
      const data: any = snap.data();
      return { ...data, docId: snap.id } as Post;
    });
  }

}
