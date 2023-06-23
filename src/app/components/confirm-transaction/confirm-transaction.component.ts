import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { Service } from 'src/app/services/service';
import { Subscription } from 'rxjs'; 
import { MessageService } from 'src/app/services/message.service';
import { Transaction } from 'src/app/models/transaction';
import { DataService } from 'src/app/services/data.service';
import { AngularFirestore } from '@angular/fire/firestore';
declare let Email: any;
declare function initEmail(message): void;

@Component({
  selector: 'app-confirm-transaction',
  templateUrl: './confirm-transaction.component.html',
  styleUrls: ['./confirm-transaction.component.scss']
})
export class ConfirmTransactionComponent implements OnInit {
  modalRef: any;
  hideButton = false;
  private subscription: Subscription;
  private getavailablePaySuscribtions: Subscription;
  message:string;
  transactionObj: Transaction = {
    id: '',
    userEmail: '',
    transactionCode: '',
    receiver: '',
    amountSend: '',
    amountReceive : '',
    date : '',
    status : '' 
  };
  amount: any;
  transactionId = '';
  
  constructor(private service: Service, private  spinner: NgxSpinnerService,
              private router: Router, private modalService:BsModalService, 
              private sendMessage: MessageService, private data: DataService, private afs : AngularFirestore) { }

  ngOnInit(): void {
    
    if(localStorage.getItem('user')) {
      this.subscription = this.sendMessage.currentMessage.subscribe(message => this.message = message);
      if(localStorage.getItem('messageForTracking') === 'default message' ||
       localStorage.getItem('messageForTracking') === null || 
       !localStorage.getItem('messageForTracking')) { // save data if user reload page

          if(this.message !== 'default message') {
            localStorage.setItem('messageForTracking', this.message + '-Pending');
          }else{
            this.reinitialiazeAll();
            let link = ['/'];
            this.router.navigate(link);
          }
      }
          
    }else{
      this.reinitialiazeAll();
      let link = ['/'];
      this.router.navigate(link);
    }

    this.getavailablePaySuscribtions = this.data.getPay().subscribe(res => {
      this.amount = Number(res[0]['amount']);   
      }, err => {
        console.log('Error while fetching pay');
        this.unsuscribe();
    });
  }

  reinitialiazeAll(): void {
    localStorage.removeItem('recipient');
    localStorage.removeItem('recipientMobile');
    localStorage.removeItem('recipientEmail');
    localStorage.removeItem("dropdownList"); 
    localStorage.removeItem('messageForTracking');
    localStorage.removeItem('messageForTransaction');
    this.sendMessage.changeMessage('default message');
  }
   
  ngOnDestroy() {
    this.unsuscribe();
  }

  tracking(): void {
    this.saveTransaction();
    let link = ['/'];
     this.spinner.show();
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.data.updatePay("mg6GHY8RPYCo7KzHobR2", Number(this.amount - Number(this.transactionObj.amountReceive.split('XAF')[0].trim())));
       this.router.navigate(link);
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup

  }

  saveTransaction(): void {
          let receiveMsg =  localStorage.getItem('messageForTracking').split(':');
          let sendValue =  receiveMsg[1].split('-')[0];
          let receiveValue =  receiveMsg[1].split('-')[1];
          let currentRate =  receiveMsg[1].split('-')[2];
          let currencyToSend = receiveMsg[1].split('-')[3];
          let currencyToReceive = receiveMsg[1].split('-')[4];
          let sender = localStorage.getItem('last_name') +' ' + localStorage.getItem('mobile');
          let recipient = localStorage.getItem('recipient') +' ' + localStorage.getItem('recipientMobile');

          let today = new Date();
          let dd = String(today.getDate()).padStart(2, '0');
          let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
          let yyyy = today.getFullYear();
          let today_ =  yyyy + '/' + mm  + '/' + dd;
     
          this.transactionObj.id = '';
          this.transactionObj.userEmail = localStorage.getItem('user'); // current email connected
          this.transactionObj.transactionCode = this.afs.createId();
          this.transactionObj.receiver = localStorage.getItem('recipient');
          this.transactionObj.amountSend = sendValue + ' ' + currencyToSend;
          this.transactionObj.amountReceive = receiveValue + ' ' + currencyToReceive;
          this.transactionObj.date = today_;
          this.transactionObj.status = 'PENDING';
                  

          this.addTransaction(this.transactionObj);
          this.transactionId = this.transactionObj.transactionCode;
          this.sendEmail();
  
  }

  addTransaction(transactionObj: Transaction) { 
    this.data.addTransaction(transactionObj);
  }

  sendEmail() {

        let Message = this.transactionObj.userEmail + '-' + this.transactionObj.transactionCode + '-' 
                      + this.transactionObj.receiver + '-' + this.transactionObj.amountSend + '-' 
                      + this.transactionObj.amountReceive + '-' + this.transactionObj.date + '-'
                      + this.transactionObj.status;
        let sender = localStorage.getItem('last_name') +' ' + localStorage.getItem('mobile');
        let recipient = localStorage.getItem('recipient') +' ' + localStorage.getItem('recipientMobile');
        let message = this.transactionObj.userEmail + '*' + this.transactionObj.receiver + '*' 
                      + this.transactionObj.amountSend + '*' + this.transactionObj.amountReceive + '*' 
                      + this.transactionObj.date + '*' + this.transactionObj.status + '*' + 'sender : ' + sender + 'recipient : ' + recipient + '*' 
                      + 'Link :  '+ document.location.host +'/trackingWithId?transaction=' + this.transactionId;
        initEmail(message);
        Email.send({
        Host : 'smtp.elasticemail.com',
        Username : 'pemetaskpwd@gmail.com',
        Password : '701397C0CA27A580738317B28763BCFFCA2F',
        To : 'pemetaskpwd@gmail.com',
        From : 'pemetaskpwd@gmail.com',
        Subject : 'transaction',
        Body : `
        <i>This is sent as a feedback from my resume page.</i> <br/> <b>Name: </b>${Message} <br /> <b>Email: </b>${this.transactionObj.userEmail}<br /> <b>Subject: </b>${'transaction'}<br /> <b>Message:</b> <br /> ${Message} <br><br> <b>~End of Message.~</b> `
        }).then( message => {console.log(message); } );
    
  }

  unsuscribe(): void {
    if(this.getavailablePaySuscribtions) {
      this.getavailablePaySuscribtions.unsubscribe();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  

}
