import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { Timeouts } from 'selenium-webdriver';
import { User } from 'src/app/models/user';
import { Service } from 'src/app/services/service';
declare function initParticule(): void;
import { DataService } from 'src/app/services/data.service';
import { Beneficiary } from 'src/app/models/beneficiary';
import { MessageService } from 'src/app/services/message.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { IDropdownSettings } from 'ng-multiselect-dropdown9';
declare let swal: any;


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private getCurrencySuscribtions: Subscription;
  private getBeneficiarySuscribtions: Subscription;
  private getavailablePaySuscribtions: Subscription;
  rate = '';
  modalRef: any;
  showCanadaCmr = true;
  showCmrCanada = false;
  showRate = true;
  showRateSpinner = false;
  showAccountLogin = true;
  amountToSendError = false;
  currencyToSend = 'CAD';
  currencyToReceive = 'XAF';
  currentValueTosend = 0;
  currentValueToReceive = 0;
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
  userObj: User = {
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
  beneficiaryObj: Beneficiary = {
    id: '',
    userEmail: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile : '',
    town : '',
    country : '' 
  };
  config = {
    animated: true,
    keyboard: true,
    backdrop: true,
    ignoreBackdropClick: false,
    class: 'modalSmall',
    size: 10
  };
  id : '';
  first_name : '';
  last_name : '';
  email : '';
  mobile : '';
  address : '';
  password : '';
  dateOfBirth : '';
  town : '';
  province : '';
  country : '';
  occupation : '';
  load = '';
  recipientFlag = 'flag-icon flag-icon-ca';
  receiverFlag = 'flag-icon flag-icon-cm';
  @Output() messageEvent = new EventEmitter<string>();
  @Input() childMessage: string;
  allBeneficiariesList: any[];
  idleTimer = 0;
  currencyInterval: any;
  dropdownList = '';
  paddinLeftSize = 0;
  margingLeftSize = 0;
  paddinLeftSizeForLogOut = 0;
  @ViewChild('template', {read: TemplateRef}) modalTemplateAuth: TemplateRef<any>;
  @ViewChild('templateLogout', {read: TemplateRef}) modalTemplate: TemplateRef<any>;
  @ViewChild('templateNobeneficiary', {read: TemplateRef}) modalTemplateNobeneficiary: TemplateRef<any>;
  @ViewChild('templateConnexionRequired', {read: TemplateRef}) modalTemplateConnexionRequired: TemplateRef<any>;
  allModalTemplate: TemplateRef<any>[];
  modalRefArray: any[];
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
  
  separateDialCode = false;
	phoneForm = new FormGroup({
		phone: new FormControl(undefined, [Validators.required])
	});
amountAvailable: any;
indicatifPays = '0';
dropdownSettings:IDropdownSettings = {};
dropdownList_ = [];
selectedItems = [];
localesList = [
  { code:'en-US', label: 'EN'},
  { code:'fr', label: 'FR'}
];
language = '';
currentLanguage = '';

  constructor(private service: Service, private  spinner: NgxSpinnerService,
              private router: Router, private modalService:BsModalService,
              private data: DataService, private sendMessage: MessageService, 
              private firebaseService: FirebaseService, private toastr: ToastrService,
              private cd: ChangeDetectorRef) {}

  ngAfterViewInit(): void {

          this.sendMessage.currentMessage.subscribe(message => {

            if(message.includes('User Connected from Hamburger1Component')){
                this.showAccountLogin = false;
            }else if (message.includes('User Disconnected from Hamburger1Component')){
                this.showAccountLogin = true;
                location.reload();
            }
      
          });
          let link = window.location.href;
          if (link.includes('/fr')) {
            this.language = 'EN';
            this.currentLanguage = 'fr';
          }else{
            this.language = 'FR';
            this.currentLanguage = 'en-US';
          }
  }

  ngOnInit(): void {
    this.goToTop();
    this.getCurrency(); 
   
    if (this.firebaseService.isLoggedIn || localStorage.getItem('user')) {
      this.showAccountLogin = false;
    }else{
      this.showAccountLogin = true;
    }
    this.paddinLeftSize = Number(window.innerWidth) - 160;
    this.paddinLeftSizeForLogOut = Number(window.innerWidth) - 50;
    //this.margingLeftSize = Number(window.innerWidth) - 10;

    this.dropdownSettings = {
      singleSelection: true,
      idField: 'item_id',
      textField: 'item_text',
      itemsShowLimit: 3,
      allowSearchFilter: true,
      closeDropDownOnSelection: true
    };
    this.dropdownList_ = [{ 'item_id': 1, 'item_text': 'CANADA'},
                            { 'item_id': 2, 'item_text': 'USA' },
                            { 'item_id': 3, 'item_text': 'FRANCE' }];
    this.selectedItems = [{ 'item_id': 1, 'item_text': 'CANADA'}];
    
  }

  ngOnDestroy() {
    clearInterval(this.currencyInterval);
    this.unsuscribe();
  }

  getCurrency(): void {
    
    let currency = 'CAD';
    let currencySend = 'CAD';

    if(this.recipientFlag  ==='flag-icon flag-icon-ca') {
      currency = 'CAD';
      currencySend = 'CAD';
    }else if (this.recipientFlag  ==='flag-icon flag-icon-us'){
      currency = 'USD';
      currencySend = 'USD';
    }else{
      currency = 'EUR';
      currencySend = 'EUR';
    }

    if(this.showCmrCanada){
      currency = 'XAF';
    }
    
    this.getCurrencySuscribtions = this .service.getCurrency(currency).subscribe(data => {

        this.available = true;
        this.rate = data.rates['XAF'].toFixed(2);
        if(this.showCmrCanada){
          this.rate = data.rates[currencySend].toFixed(3);
        }
        
    }, 
      (err) => {
            this.available = false;
            if (err.status === 200){
              this.unsuscribe();
            }
      }
    );

  }

  unsuscribe(): void {
    if (this.getCurrencySuscribtions) { 
      this.getCurrencySuscribtions.unsubscribe();
    }

    if (this.getBeneficiarySuscribtions) { 
      this.getBeneficiarySuscribtions.unsubscribe();
    }

    if(this.getavailablePaySuscribtions) {
      this.getavailablePaySuscribtions.unsubscribe();
    }
  }
  HowItWorks(): void {
    if (document.getElementById("HowItWorks")) document.getElementById("HowItWorks").scrollIntoView({behavior: 'smooth'});
    if (document.getElementById("HowItWorksXs")) document.getElementById("HowItWorksXs").scrollIntoView({behavior: 'smooth'});
  }

  goToTop(): void {
    document.getElementById("goToTop").scrollIntoView({behavior: 'smooth'});
  }

  about(): void {
     let link = ['/about'];
     if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
       //this.unsuscribe();
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  About(): void {
     let link = ['/about'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
       //this.unsuscribe();
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  getVal(item){
    
    this.currentValueTosend = Number(item.target.value);
    let currency = 'CAD';
    let currencySend = 'CAD';

    if(this.recipientFlag  ==='flag-icon flag-icon-ca') {
      currency = 'CAD';
      currencySend = 'CAD';
    }else if (this.recipientFlag  ==='flag-icon flag-icon-us'){
      currency = 'USD';
      currencySend = 'USD';
    }else{
      currency = 'EUR';
      currencySend = 'EUR';
    }

    if(this.showCmrCanada){
      currency = 'XAF';
    }

    if ( this.currentValueTosend  < 5 || this.currentValueTosend  > 999 ) {
      this.amountToSendError = true;
    }else{
      this.amountToSendError = false;
    }

    this.getCurrencySuscribtions = this .service.getCurrency(currency).subscribe (data => {
     
        this.available = true;
        this.rate = data.rates['XAF'].toFixed(2);
        if(this.showCmrCanada){
          this.rate = data.rates['CAD'].toFixed(3);
        }
        
        let input = document.getElementById("receiveInput") as HTMLFormElement;
        input.value = Math.round( Number(item.target.value) * Number(data.rates['XAF']) );
        if(this.showCmrCanada){
          input.value = Math.round( Number(item.target.value) * Number(data.rates['CAD']) );
        }
        this.currentValueToReceive = input.value;

    }, 
      (err) => {
            this.available = false;
            if (err.status === 200){
              this.unsuscribe();
            }
      }
    );
  }

  changeCurrency(): void {

   
    if (this.showCanadaCmr) {
      this.showCanadaCmr = false;
      this.showCmrCanada = true;

      this.currencyToSend = 'XAF';
      if(this.recipientFlag  ==='flag-icon flag-icon-ca') {
        this.currencyToReceive = 'CAD';
      }else if (this.recipientFlag  ==='flag-icon flag-icon-us'){
        this.currencyToReceive = 'USD';
      }else{
        this.currencyToReceive = 'EUR';
      }
    }else{
      this.showCanadaCmr = true;
      this.showCmrCanada = false;

      if(this.recipientFlag  ==='flag-icon flag-icon-ca') {
        this.currencyToSend = 'CAD';
      }else if (this.recipientFlag  ==='flag-icon flag-icon-us'){
        this.currencyToSend = 'USD';
      }else{
        this.currencyToSend = 'EUR';
      }
      this.currencyToReceive = 'XAF';
      
    }

    this.getCurrency();
    this.showRate = false;
    this.showRateSpinner = true;
    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.showRate = true;
    this.showRateSpinner = false;
    
    let input = document.getElementById("receiveInput") as HTMLFormElement;
    input.value = Math.round( this.currentValueTosend * Number(this.rate) );
    this.currentValueToReceive = input.value;
    }, 4000);
  }

  async  checkAvailableAmount(): Promise<number> {
    
    this.data.getPay().subscribe(res => {
     const amount = res[0]['amount'];
    
    return  Number(amount) - Number(this.currentValueToReceive) > 5000;
   }, err => {
     console.log('Error while fetching pay');
   });
  return 0;
 }

 async asynTransition() {

  if(this.recipientFlag !== 'flag-icon flag-icon-ca') {
    swal.fire({title: 'Early Transfert', text: 'Comming Soon', 
    confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'info', position: 'top-middle'});
    return;
  }
    this.getavailablePaySuscribtions = await this.data.getPay().subscribe(res => {
      
      this.amountAvailable = res[0]['amount'];   
      
      this.transaction();
      }, err => {
        console.log('Error while fetching pay');
        this.unsuscribe();
    });
 }

   transaction() {
      const payAvailable = Number(this.amountAvailable) - Number(this.currentValueToReceive) > 5000;
      
      if(!this.available || !payAvailable) {
        swal.fire({title: 'Early Transfert', text: 'Service unavailable now, please try again later', 
        confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'info', position: 'top-middle'});
        return;
      }

      this.getBeneficiaries(localStorage.getItem('user')); 
   }

  getBeneficiaries(email: string): boolean {
    
    this.reinitialiazeAll();
    let respomse = false;
    this.getBeneficiarySuscribtions = this.data.getAllBeneficiary().subscribe(res => {     
      this.allBeneficiariesList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        if (data.userEmail === email) {
          this.dropdownList += data.first_name + ' ' + data.last_name + ':' + data.mobile + '*';
        } 
        return data;
      });
      
            localStorage.setItem("dropdownList", this.dropdownList);

            this.sendMessage.changeMessage( 'Message for transaction:' + this.currentValueTosend + '-'
            + this.currentValueToReceive + '-' + this.rate + '-' 
                    + this.currencyToSend + '-' + this.currencyToReceive) + '_separeItems_' + this.dropdownList;
            if ( this.currentValueTosend  < 5 || this.currentValueTosend  > 999 ) {
                this.amountToSendError = true;
            }else{

                this.amountToSendError = false;
                let link = ['/transaction'];
                if (!localStorage.getItem('user'))  link = ['/transactionWithNoAccount'];
                this.spinner.show();
                initParticule();
                setTimeout(() => {
                /** spinner ends after 2 seconds */
                this.spinner.hide();
                this.router.navigate(link);
                }, 2000);
                if(this.modalRef) this.modalRef.hide(); // pour fermer le popup
            } 
      return respomse;
    }, err => {
      console.log('Error while fetching beneficiary data');
      localStorage.setItem("dropdownList", this.dropdownList);
      this.unsuscribe();
    });

    return respomse;
    
  }

  public openModal(template:TemplateRef<any>){
    if(this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
    this.modalRefArray.push(this.modalRef);
   
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

  reinitialiazeAll(): void {
    localStorage.removeItem('recipient');
    localStorage.removeItem('recipientMobile');
    localStorage.removeItem('recipientEmail');
    localStorage.removeItem("dropdownList"); 
    localStorage.removeItem('messageForTracking'); 
    localStorage.removeItem('messageForTransaction');
    localStorage.removeItem('messageForTrackingWith');
    this.sendMessage.changeMessage('default message');
    this.dropdownList = '';
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
            this.sendMessage.changeMessage('User Connected from homeComponent: ' +  this.currentUser.first_name) //send message to Hamburger1Component
            let link = ['/'];
            this.router.navigate(link);
    
        }
        
    }    
  }

  async creerCompte(Inputnom, Inputprenom, Inputdate, InputCountry, InputProvince, InputTown, Inputadress, Inputemail,
    Inputpassword, InputConfirmPassword, InputTel): Promise<void>{

    this.reinitialiseError();
    
    if (Inputnom.value.length == 0 || Inputprenom.value.length == 0 || Inputdate.value.length == 0 || 
    InputCountry.value.length == 0 || InputTown.value.length == 0 || Inputadress.value.length == 0 || 
    Inputemail.value.length == 0 || Inputpassword.value.length == 0 || InputConfirmPassword.value.length == 0 ||
    InputTel.value.length == 0 || InputProvince.value.length == 0 || this.indicatifPays === '0') {


        if (Inputnom.value.length == 0) this.enableNom = true;
        if (Inputprenom.value.length == 0) this.enablePrenom = true;
        if (Inputdate.value.length == 0) this.enableDate = true;
        if (InputCountry.value.length == 0) this.enableCountry = true; 
        if (InputProvince.value.length == 0) this.enableProvince = true;
        if (InputTown.value.length == 0) this.enableTown = true;
        if (Inputadress.value.length == 0) this.enableAdresse = true;
        if (InputTel.value.length == 0) this.enableTelephone = true;
        if (this.indicatifPays === '0') this.enableTelephone = true;
        if (Inputemail.value.length == 0) this.enableEmail = true;
        if (Inputpassword.value.length == 0) this.enablePassword = true;
        if (InputConfirmPassword.value.length == 0) this.enableConfirmPassword = true;
        this.toastr.error('Erreur inatadue','Creation', {progressBar: true, 
          toastClass: 'toast-custom', closeButton: true,
          positionClass: 'toast-bottom-left'});

    }else{

        let indicatif = '';
        if (this.indicatifPays === 'CM') {
          indicatif = '+237';
        }else if (this.indicatifPays === 'CI'){
          indicatif = '+225';
        }else if (this.indicatifPays === 'CA'){
          indicatif = '+1';
        }else if (this.indicatifPays === 'US'){
          indicatif = '+1';
        }else if (this.indicatifPays === 'CN'){
          indicatif = '+86';
        }else if (this.indicatifPays === 'FR'){
          indicatif = '+33';
        }else if (this.indicatifPays === 'GB'){
          indicatif = '+44';
        }
        
        this.userObj.id = '';
        this.userObj.email = Inputemail.value;
        this.userObj.first_name = Inputprenom.value;
        this.userObj.last_name = Inputnom.value;
        if (InputTel.value.includes('+')) {
          this.userObj.mobile =   InputTel.value;
        }else{
          this.userObj.mobile =   indicatif + InputTel.value;
        }
        this.userObj.address = Inputadress.value;
        this.userObj.password = Inputpassword.value;
        this.userObj.dateOfBirth = Inputdate.value;
        this.userObj.town = InputTown.value;
        this.userObj.province = InputProvince.value;
        this.userObj.country = InputCountry.value;
        this.userObj.occupation = '';

       if ( Inputpassword.value === InputConfirmPassword.value) { 

          let email_ = Inputemail.value.toString().trim();
          let password_ = Inputpassword.value.toString().trim();
          this.spinner.show();
          await this.firebaseService.signUp(email_, password_);
          
          if (this.firebaseService.isLoggedIn) {
             this.adduser(this.userObj);
             this.getUser(email_);

             if (localStorage.getItem('user').includes('{')) {
                localStorage.removeItem('user');
                localStorage.setItem('user', email_);
             }

             this.openSpinnerForAccount("Chargement...");
             this.modalRef.hide(); // pour fermer le popup
             this.showAccountLogin = false;
             this.sendMessage.changeMessage('User Connected from homeComponent: ' +  this.userObj.first_name) //send message to Hamburger1Component
     
          }
      } else {
        this.enablePasswordMatch = true;
      }
          
    }

  } 

  open(template:TemplateRef<any>): void {

    this.reinitialiseError();
    if (this.modalRef)this.modalRef.hide();
    this.modalRef = this.modalService.show(template, this.config);
    this.modalRefArray.push(this.modalRef);
  
  
    let Inputprenom = document.getElementById("Inputprenom") as HTMLFormElement;
    let Inputnom = document.getElementById("Inputnom") as HTMLFormElement;
    let Inputdate = document.getElementById("Inputdate") as HTMLFormElement;
    let InputCountry = document.getElementById("InputCountry") as HTMLFormElement;
    let InputProvince = document.getElementById("InputProvince") as HTMLFormElement;
    let InputTown = document.getElementById("InputTown") as HTMLFormElement;
    let Inputadress = document.getElementById("Inputadress") as HTMLFormElement;
  
    Inputprenom.value = this.currentUser.first_name;
    Inputnom.value = this.currentUser.last_name;
    Inputdate.value = this.currentUser.dateOfBirth;
    InputCountry.value = this.currentUser.country;
    InputProvince.value = this.currentUser.province;
    InputTown.value = this.currentUser.town;
    Inputadress.value = this.currentUser.address;

    let select = document.getElementById('selectId')as HTMLFormElement;

    if (this.currentUser.mobile.includes('+237')) {
       select.value = "CM";
    }else if (this.currentUser.mobile.includes('+225')){
      select.value = "CI";
    }else if (this.currentUser.mobile.includes('+1')){
      select.value = "CA";
    }else if (this.currentUser.mobile.includes('+86')){
      select.value = "CN";
    }else if (this.currentUser.mobile.includes('+33')){
      select.value = "FR";
    }else if (this.currentUser.mobile.includes('+44')){
      select.value = "GB";
    }
    this.indicatifPays = select.value;
    let obj = document.getElementById("InputTel") as HTMLFormElement;
    obj.value = this.currentUser.mobile;

    this.cd.detectChanges();

  }

  selectElement(event:any): void {
    this.indicatifPays = event.target.value;
  }

  async forgotPassword(Inputemail): Promise<void> {
    let email_ = Inputemail.value.toString().trim();
    await  this.firebaseService.forgotPassword(email_);
    if (this.firebaseService.emailSend) {
        swal.fire({title: 'Reset Password', text: 'Link  send successfuly', 
        confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'success', position: 'top-middle'});
        this.openSpinner("Chargement...");
    }
  }

  logOut(): void {
   
    this.showAccountLogin = true;
   if(this.modalRef)  this.modalRef.hide(); // pour fermer le popup
    this.sendMessage.changeMessage('User Disconnected from homeComponent: '); //send message to Hamburger1Component
    for (var modal of this.modalRefArray) { // close all popup
      modal.hide()
    }
    location.reload();
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

 openSpinnerForAccount($event){
  /** spinner starts on init */
  this.load = $event;
  this.spinner.show();

  setTimeout(() => {
    /** spinner ends after 2 seconds */
    this.spinner.hide();
  }, 2000);
}

 
 onChange(event){
  
  this.mobileValue = event.internationalNumber;
}

  adduser(userObj: User) {
    this.data.adduser(userObj);
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

  @HostListener('window:resize', ['$event'])
  onResize(event) {
 
    this.paddinLeftSize = Number(window.innerWidth) - 160;
    this.paddinLeftSizeForLogOut = Number(window.innerWidth) - 50;
    this.margingLeftSize = Number(window.innerWidth) - 150;

    if (this.firebaseService.isLoggedIn || localStorage.getItem('user')) {
      this.showAccountLogin = false;
    }else{
      this.showAccountLogin = true;
    }
    
  }

  beneficiaire(): void {
 
     let link = ['/beneficiaire'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  clear(): void {
  
    let form =  document.getElementById("myForm") as HTMLFormElement;
    form.reset();
  }

  apply(): void {
    swal.fire({title: 'Apply', text: 'Comming soon', 
    confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'info', position: 'top-middle'});
  }

  houseLoan(): void {

     let link = ['/houseLoan'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
       //this.unsuscribe();
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

 
  

  alerte(): void{  
    //let input = document.getElementById("selectedFlag") as HTMLFormElement;

    //document.getElementById('selectedFlag').onchange.call(this.changeFlag(document.getElementById("selectedFlag")));

  }

  onItemSelect(item: any) {
    this.changeFlag(item.item_text);
  }

  onItemDeSelect(item: any) {
    this.selectedItems = [{ 'item_id': 1, 'item_text': 'CANADA'}];
  }

  onSelectAll(items: any) {
  }

  changeFlag(input:any): void {
    this.showRate = false;
    this.showRateSpinner = true;

    let currency = '';
    if(this.showCanadaCmr){
        if(input ==='CANADA') {
          this.currencyToSend = 'CAD';
        }else if (input === 'USA'){
          this.currencyToSend = 'USD';
        }else{
          this.currencyToSend = 'EUR';
        }
        this.currencyToReceive = 'XAF';
        currency = this.currencyToSend;
    }else{
        if(input ==='CANADA') {
          this.currencyToReceive = 'CAD';
        }else if (input === 'USA'){
          this.currencyToReceive = 'USD';
        }else{
          this.currencyToReceive = 'EUR';
        }
        this.currencyToSend = 'XAF';
        currency = this.currencyToSend;
    }
      
    this.getCurrencySuscribtions = this .service.getCurrency(currency).subscribe(data => {

      this.available = true;
      this.rate = data.rates['XAF'].toFixed(2);
      if(this.showCmrCanada){
        this.rate = data.rates[this.currencyToReceive].toFixed(3);
      }

      //let input = document.getElementById("receiveInput") as HTMLFormElement;
      let inputSend = document.getElementById("sendInput") as HTMLFormElement;
      this.currentValueToReceive = Math.round( Number(inputSend.value) * Number(data.rates['XAF']) );
      if(this.showCmrCanada){
        this.currentValueToReceive = Math.round( Number(inputSend.value) * Number(data.rates['CAD']) );
      }
      //this.currentValueToReceive = input.value;
      
      
  }, 
    (err) => {
          this.available = false;
          if (err.status === 200){
            this.unsuscribe();
          }
    }
  );

    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.showRateSpinner = false;
      this.showRate = true;

      if(input ==='CANADA') {
        this.recipientFlag = 'flag-icon flag-icon-ca';
      }else if (input === 'USA'){
        this.recipientFlag = 'flag-icon flag-icon-us';
      }else{
        this.recipientFlag = 'flag-icon flag-icon-fr';
      }
      let receiveInput = document.getElementById("receiveInput") as HTMLFormElement;
      receiveInput.value = this.currentValueToReceive; // change the value to receive when user click in different flag
    }, 2000);
  }

  changeLanguage(): void {  
    this.sendMessage.changeMessage('change language'); //send message to Hamburger1Component
  }
}
