import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user';

declare function initProgressBar(): void; 
declare let swal: any;


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
  form: any = this;
  timer4Updates: number;
  trackingInterval: any;
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
  usersList: User[] = [];
  currentUser: User= {
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    address : '',
    password : '',
    dateOfBirth : '',
    town : '',
    province : '',
    country : '',
    occupation : ''
  };
  trackingId: string;
  language = '';
  currentLanguage = '';
  pendingActive = '';
  paymentActive = '';
  depositActive = '';
  transactionActive = '';
  showLoginAlert = true;
  rate = '';
  showCanadaCmr = true;
  showCmrCanada = false;
  showRate = true;
  showRateSpinner = false;
  showAccountLogin = true;
  amountToSendError = false;
  currentValueTosend = 0;
  currentValueToReceive = 0;
  enableEmail: boolean;
  enablePassword: boolean;
  enablePrenom: boolean;
  enableNom: boolean;
  enableAdresse: boolean;
  enableDate: boolean;
  enableCountry: boolean;
  enableProvince: boolean;
  enableTown: boolean;
  enableTelephone: boolean;
  enableConfirmPassword: boolean;
  enablePasswordMatch: boolean;
  available: boolean = true;
  mobileValue = '';
  load = '';
  indicatifPays = '0';
  modalRefArray: any[];
  config = {
    animated: true,
    keyboard: true,
    backdrop: true,
    ignoreBackdropClick: false,
    class: 'modalSmall',
    size: 10
  };
  @ViewChild('template', { static: true }) myTemplateRef!: TemplateRef<any>;




  constructor(private route: ActivatedRoute, private service: Service, private  spinner: NgxSpinnerService,
    private router: Router, private data: DataService, private firebaseService: FirebaseService,
    private sendMessage: MessageService, private modalService:BsModalService) { }
 

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
  

  getTransactionCallBack(this): void {
    this.getTransaction(this.trackingId);
  }

  ngOnInit() {
   
      this.route.queryParams
              .subscribe(params => {
                this.trackingId = params.transaction;
                localStorage.setItem('messageForTrackingWith', this.trackingId);    
              }      
      );
      this.getTransaction(this.trackingId);
      this.trackingInterval = setInterval( ()=> {
        this.getTransaction(this.trackingId);
      }, 5000);
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
      // document.getElementById("firstPoint").click(); // to start the tracking ?
      this.pendingActive = 'active';
      this.paymentActive = '';
      this.depositActive = '';
      this.transactionActive = '';
    }else
    if (this.transactionTrack['status'] === 'INCOMPLETE') {
      // document.getElementById("firstPoint").click(); // to start the tracking 
      // document.getElementById("secondPoint").click(); // to start the tracking
      this.pendingActive = 'active';
      this.paymentActive = 'active';
      this.depositActive = '';
      this.transactionActive = '';
    }else
    if (this.transactionTrack['status'] === 'INPROGRESS') {
      // document.getElementById("firstPoint").click(); // to start the tracking 
      // document.getElementById("secondPoint").click(); // to start the tracking 
      // document.getElementById("thirdPoint").click(); // to start the tracking 
      this.pendingActive = 'active';
      this.paymentActive = 'active';
      this.depositActive = 'active';
      this.transactionActive = '';
    }else
    if (this.transactionTrack['status'] === 'COMPLETE'){
      // document.getElementById("firstPoint").click(); // to start the tracking 
      // document.getElementById("secondPoint").click(); // to start the tracking 
      // document.getElementById("thirdPoint").click(); // to start the tracking
      // document.getElementById("fourthPoint").click(); // to continue the tracking
      this.pendingActive = 'active';
      this.paymentActive = 'active';
      this.depositActive = 'active';
      this.transactionActive = 'active';
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
    debugger
    let reponse = true;
    this.getTransactionsSuscribtions = this.data._getAlltransactions().subscribe(res => {
      this.spinner.show();
      this.allTransactionsList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        if (data.id === id || data.transactionCode === id) {
          this.transactionTrack = data;
          this.spinner.hide();
          if(reponse){
            this.fieldTransaction();
            reponse = false;
          }
        }       
        return data;
      });
      
    }, err => {
      console.log('Error while fetching Transactions data');
      if (this.showLoginAlert) {
        swal.fire({title: 'Early Transfert', text: 'Please you need to login', 
          confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'warning', position: 'top-middle'}).then((result) => {
             this.openModalCreerCompte(this.myTemplateRef);
          });
          this.showLoginAlert = false;
          clearInterval(this.trackingInterval); 
      }
      this.unSuscribe();
    });

    // if(reponse) {
    //   this.unSuscribe();
    //     this.getTransactionsSuscribtions = this.data._getAlltransactions().subscribe(res => {
    //       this.spinner.show();
    //       this.allTransactionsList = res.map((e: any) => {
    //         const data = e.payload.doc.data();
    //         data.id = e.payload.doc.id;
    //         if (data.id === id || data.transactionCode === id) {
    //           this.transactionTrack = data;
    //           this.spinner.hide();
    //           if(reponse){
    //             this.fieldTransaction();
    //             reponse = false;
    //           }
    //         }       
    //         return data;
    //       });
          
    //     }, err => {
    //       console.log('Error while fetching Transactions data');
    //       if (this.showLoginAlert) {
    //         swal.fire({title: 'Early Transfert', text: 'Please you need to login', 
    //           confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'warning', position: 'top-middle'}).then((result) => {
    //             this.openModalCreerCompte(this.myTemplateRef);
    //           });
    //           this.showLoginAlert = false;
    //           clearInterval(this.trackingInterval); 
    //       }
    //       this.unSuscribe();
    //     });
    //   }
  
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

  async authentification(email,password){
    this.reinitialiseError();
    
    if(email.value.length===0 || password.value.length===0){
      this.showAccountLogin = true;
        if (email.value.length === 0) this.enableEmail = true;
        if (password.value.length === 0) this.enablePassword = true;
    }else if(email.value==="admin"&&password.value==="admin"){
        this.openSpinner("Chargement...");
    }else{
        
        let email_ = email.value.toString().trim();
        let password_ = password.value.toString().trim();
        this.getUser(email_);
        this.spinner.show();
        await this.firebaseService.signIn(email_, password_); 
        if (this.firebaseService.isLoggedIn) {
            this.getUser(email_);
            this.openSpinnerForAccount("Chargement...");
            this.modalRef.hide(); // pour fermer le popup
            this.showAccountLogin = false;
            location.reload();
    
        }
        
    }    
  }

  openSpinnerForAccount($event){
    /** spinner starts on init */
    this.load = $event;
    this.spinner.show();
  
    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
    }, 2000);
  }

  openSpinner($event){
    /** spinner starts on init */
    this.load = $event;
    this.spinner.show();

    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
    }, 1000);
    this.modalRef.hide(); // pour fermer le popup
 }

  reinitialiseError(){
    this.enableEmail = false;
    this.enablePassword = false;
    this.enablePrenom = false;
    this.enableNom = false;
    this.enableAdresse = false;
    this.enableDate = false;
    this.enableCountry = false;
    this.enableProvince = false;
    this.enableTown = false;
    this.enableTelephone = false;
    this.enableConfirmPassword = false;
    this.enablePasswordMatch = false;

  }


  getUser(email: string) {

    this.data.getAllusers().subscribe(res => {

      this.usersList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        return data;
      })

      for (const user of this.usersList){
        
          if (user.email === email) {
            this.currentUser = user;
            break;
          }
      }

      localStorage.setItem('last_name', this.currentUser.last_name);
      localStorage.setItem('first_name', this.currentUser.first_name);
      localStorage.setItem('mobile', this.currentUser.mobile);
      
    }, err => {
      console.log('Error while fetching user data');
    })
    
  }


  public openModalCreerCompte(template:TemplateRef<any>){

    this.indicatifPays = '0';
    if(this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template, this.config);
    this.modalRefArray.push(this.modalRef);

    setTimeout(() => {
      /** spinner ends after 0.5 seconds */
      this.clear();
    }, 500);
   
  }

  clear(): void {
  
    let form =  document.getElementById("myForm") as HTMLFormElement;
    form.reset();
  }

}
