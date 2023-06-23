import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { Beneficiary } from 'src/app/models/beneficiary';
import { Transaction } from 'src/app/models/transaction';
import { DataService } from 'src/app/services/data.service';
import { MessageService } from 'src/app/services/message.service';
import { Service } from 'src/app/services/service';
declare function initProgressBar(): void; 

@Component({
  selector: 'app-tracking-with-id',
  templateUrl: './tracking-with-id.component.html',
  styleUrls: ['./tracking-with-id.component.scss']
})
export class TrackingWithIdComponent implements OnInit, AfterViewInit {

  private getTransactionsSuscribtions: Subscription;
  subscription: Subscription;
  private ngAfterSuscribtions: Subscription;
  modalRef: any;
  firstPoint = false;
  secondPoint = false;
  thirdPoint = false;
  fourthPoint = false;
  trackingInterval = setInterval(this.getTransactionCallBack, 5000);
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
  allTransactionsList: Beneficiary[] = [];
  transactionTrack: any[];
  trackingId: string;
  language = '';
  currentLanguage = '';
  

  constructor(private route: ActivatedRoute, private service: Service, private  spinner: NgxSpinnerService,
    private router: Router, private data: DataService, 
    private sendMessage: MessageService) { }
 

  ngAfterViewInit() {
    initProgressBar();
    let link = window.location.href;
    if (link.includes('/fr')) {
      this.language = 'EN';
      this.currentLanguage = 'fr';
    }else{
      this.language = 'FR';
      this.currentLanguage = 'en-US';
    }
  }
  

  getTransactionCallBack(): void {
    this.getTransaction(this.trackingId);
  }

  ngOnInit() {
   
      this.route.queryParams
              .subscribe(params => {
                this.trackingId = params.transaction;
                localStorage.setItem('messageForTrackingWith', this.trackingId);    
              }      
      );
      debugger
      this.getTransaction(this.trackingId);
  }

  reinitialiazeAll(): void {
    localStorage.removeItem('recipient');
    localStorage.removeItem('recipientMobile');
    localStorage.removeItem('recipientEmail');
    localStorage.removeItem("dropdownList"); 
    localStorage.removeItem('messageForTracking');
    localStorage.removeItem('messageForTransaction');
    localStorage.removeItem('messageForTrackingWith');
    this.sendMessage.changeMessage('default message');
  }

  ngOnDestroy() {
   this.unSuscribe();
   clearInterval(this.trackingInterval);
  }

  unSuscribe(): void {
    if(this.subscription) this.subscription.unsubscribe();
    if(this.getTransactionsSuscribtions) this.getTransactionsSuscribtions.unsubscribe();
    if(this.ngAfterSuscribtions) this.ngAfterSuscribtions.unsubscribe();
  }

  trackingPayement(): void {

    if (this.transactionTrack['status'] === 'PENDING') {
      document.getElementById("firstPoint").click(); // to start the tracking 
    }else
    if (this.transactionTrack['status'] === 'INCOMPLETE') {
      document.getElementById("firstPoint").click(); // to start the tracking 
      document.getElementById("secondPoint").click(); // to start the tracking
    }else
    if (this.transactionTrack['status'] === 'INPROGRESS') {
      document.getElementById("firstPoint").click(); // to start the tracking 
      document.getElementById("secondPoint").click(); // to start the tracking 
      document.getElementById("thirdPoint").click(); // to start the tracking 
    }else
    if (this.transactionTrack['status'] === 'COMPLETE'){
      document.getElementById("firstPoint").click(); // to start the tracking 
      document.getElementById("secondPoint").click(); // to start the tracking 
      document.getElementById("thirdPoint").click(); // to start the tracking
      document.getElementById("fourthPoint").click(); // to continue the tracking
      clearInterval(this.trackingInterval);
    }

  }
  
  Home(): void {
     let link = [ '/'];
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

   getTransaction(id: string) {
    this.getTransactionsSuscribtions = this.data.getAlltransactions().subscribe(res => {
      let reponse = true;
      this.allTransactionsList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        if (data.id === id || data.transactionCode === id) {
          this.transactionTrack = data;
          if(reponse){
            this.fieldTransaction();
            reponse = false;
          }
        }       
        return data;
      });
      
    }, err => {
      console.log('Error while fetching Transactions data');
      this.unSuscribe();
    })
  
  }

  fieldTransaction(): void {
    
    this.sendValue =  this.transactionTrack['amountSend'];
    this.receiveValue =  this.transactionTrack['amountReceive'];
    if (this.sendValue.includes('CAD')) this.currencyToSend = 'CAD';
    else this.currencyToSend = 'XAF';

    if (this.receiveValue.includes('XAF')) this.currencyToReceive = 'XAF';
    else this.currencyToReceive = 'CAD';

    if (localStorage.getItem('last_name') && localStorage.getItem('mobile')) {
      this.sender = localStorage.getItem('last_name') +' ' + localStorage.getItem('mobile');
    }else{
      this.sender = this.transactionTrack['userEmail'];
    }
    
    this.recipient = this.transactionTrack['receiver'];

    if (this.currencyToSend === 'CAD') {
      this.countryToSend = 'Canada';
      this.countryToReceive = 'Cameroun';
      this.sendValue = this.sendValue;
      this.receiveValue =  this.receiveValue;
      this.fees = '0 $CA';
      this.currentRate = '1 $CA = '+ Number(this.receiveValue.split(' ')[0]) / Number(this.sendValue.split(' ')[0]) + ' XAF';
    } else {
      this.countryToSend = 'Cameroun';
      this.countryToReceive = 'Canada';
      this.sendValue = this.sendValue;
      this.receiveValue =  this.receiveValue;
      this.fees = '0 XAF';
      this.currentRate = '1 XAF = '+ Number(this.receiveValue.split(' ')[0]) / Number(this.sendValue.split(' ')[0]) + ' $CA';
    }
    this.trackingPayement(); // to start the tracking 
  }

}
