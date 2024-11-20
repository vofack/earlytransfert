import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Beneficiary } from '../models/beneficiary';
import { Transaction } from '../models/transaction';
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
  
     // get all transactions
  getAlltransactions() { 
      return this.afs.collection('/transactions').snapshotChanges();
  }

      // delete user
  deleteTransaction(transaction : Transaction) {
        this.afs.doc('/transactions/'+transaction.id).delete();
  }

   // update user
   updateTransaction(transaction : Transaction) {
    this.deleteTransaction(transaction);
    this.afs.collection('/transactions').add(transaction);
  }
    
}
