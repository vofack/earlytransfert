import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { Transaction } from 'src/app/models/transaction';
import { MessageService } from 'src/app/services/message.service';
import { Service } from 'src/app/services/service';
declare function initProgressBar(): void; 

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss']
})
export class TrackingComponent implements OnInit {

  modalRef: any;
  firstPoint = false;
  secondPoint = false;
  thirdPoint = false;
  fourthPoint = false;
  trackingInterval = setInterval(this.trackingPayement, 5000);
  subscription: Subscription;
  message:string;
  sendValue = '0';
  receiveValue = '0';
  currentRate = '';
  currencyToSend = '';
  currencyToReceive = '';
  countryToSend = '';
  countryToReceive = '';
  fees = '';
  sender = '';
  recipient = '';
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

  constructor(private service: Service, private  spinner: NgxSpinnerService,
              private router: Router, private modalService:BsModalService, 
              private sendMessage: MessageService) { }

  ngOnInit(): void {

    if(localStorage.getItem('user')){

            initProgressBar();
            document.getElementById("firstPoint").click(); // to start the tracking 

            
            this.subscription = this.sendMessage.currentMessage.subscribe(message => this.message = message);

            if(localStorage.getItem('messageForTracking') === 'default message' ||
              localStorage.getItem('messageForTracking') === null || 
              !localStorage.getItem('messageForTracking')) { // save data if user reload page
              localStorage.setItem('messageForTracking', this.message);
            }else{
              this.message = localStorage.getItem('messageForTracking');
            }

            
            let receiveMsg =  this.message.split(':');

            if (receiveMsg[1]){

                  this.sendValue =  receiveMsg[1].split('-')[0];
                  this.receiveValue =  receiveMsg[1].split('-')[1];
                  this.currentRate =  receiveMsg[1].split('-')[2];
                  this.currencyToSend = receiveMsg[1].split('-')[3];
                  this.currencyToReceive = receiveMsg[1].split('-')[4];
                  this.sender = localStorage.getItem('last_name') +' ' + localStorage.getItem('mobile');
                  this.recipient = localStorage.getItem('recipient') +' ' + localStorage.getItem('recipientMobile');

                  if (this.currencyToSend === 'CAD') {
                    this.countryToSend = 'Canada';
                    this.countryToReceive = 'Cameroun';
                    this.sendValue = this.sendValue + ' $CA';
                    this.receiveValue =  this.receiveValue + ' XAF';
                    this.fees = '0 $CA';
                    this.currentRate = '1 $CA = '+ this.currentRate + ' XAF';
                  } else {
                    this.countryToSend = 'Cameroun';
                    this.countryToReceive = 'Canada';
                    this.sendValue = this.sendValue + ' XAF';
                    this.receiveValue =  this.receiveValue + ' $CA';
                    this.fees = '0 XAF';
                    this.currentRate = '1 XAF = '+ this.currentRate + ' $CA';
                  }
            }else{
                  this.reinitialiazeAll();
                  let link = ['/'];
                  this.router.navigate(link);
            }

      }else{
            this.reinitialiazeAll();
            let link = ['/'];
            this.router.navigate(link);
      }

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
   if(this.subscription) this.subscription.unsubscribe();
  }

  trackingPayement(): void {

    if (this.firstPoint) {
      document.getElementById("secondPoint").click(); // to start the tracking 
      this.firstPoint = false;
      this.secondPoint = true;
    }else
    if (this.secondPoint) {
      document.getElementById("thirdPoint").click(); // to start the tracking 
      this.secondPoint = false;
      this.thirdPoint = true;
    }else
    if (this.thirdPoint) {
      document.getElementById("fourthPoint").click(); // to continue the tracking
      this.thirdPoint = false
      this.fourthPoint = true;
    }else
    if (this.fourthPoint){
      this.fourthPoint = false;
      clearInterval(this.trackingInterval);
    }

  }
  
  Home(): void {

     let link = ['/'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       localStorage.removeItem('recipient');
       localStorage.removeItem('recipientMobile');
       localStorage.removeItem('recipientEmail');
       localStorage.removeItem("dropdownList"); 
       localStorage.removeItem('messageForTracking');
       this.spinner.hide();
       this.router.navigate(link);
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
   }
  

}
