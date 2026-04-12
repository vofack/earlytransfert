import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { AdminMessage } from '../models/admin-message';
import { WalletAccount } from '../models/wallet-account';
import { InteracEmail } from '../models/interac-email';
import { IssueReport } from '../models/issue-report';
import { Beneficiary } from '../models/beneficiary';
import { allTransaction, Transaction } from '../models/transaction';
import { User } from '../models/user';


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

}
