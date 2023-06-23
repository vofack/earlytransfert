import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output, TemplateRef, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import {NgxSpinnerService} from "ngx-spinner";
import { ToastrService } from 'ngx-toastr';
import { FirebaseService } from 'src/app/services/firebase.service';
import { FormGroup, FormControl, Validators, NgForm } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { User } from 'src/app/models/user';
import { MessageService } from 'src/app/services/message.service';
import { Subscription } from 'rxjs';
declare let swal: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None // take the style of the modal popup in considaration
})
export class HeaderComponent implements OnInit {
  private ngAfterSuscribtions: Subscription;
  loader = this.loadingBar.useRef();
  load = '';
  mobileValue = '';
  modalRef: any;
  enableEmail = false;
  enablePassword = false;
  enablePrenom = false;
  enableNom = false;
  enableAdresse = false;
  enableDate = false;
  enableCountry = false;
  enableProvince = false;
  enableTown = false;
  enableTelephone = false;
  enableConfirmPassword = false;
  showUser = false;
  showConnexion = true;
  showAdminOPtions = false;
  enablePasswordMatch = false;
  config = {
    animated: true,
    keyboard: true,
    backdrop: true,
    ignoreBackdropClick: false,
    class: 'modalSmall',
    size: 10
  };

  user = '';
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


  separateDialCode = false;
	phoneForm = new FormGroup({
		phone: new FormControl(undefined, [Validators.required])
	});
  form: FormGroup;
  Input_password: string;
  Inputemail: string;
  InputConfirmPassword: string;
  localesList = [
    { code:'en-US', label: 'EN'},
    { code:'fr', label: 'FR'}
  ];
  language = localStorage.getItem('language');
  indicatifPays = '0';

  constructor(private loadingBar: LoadingBarService,  private modalService:BsModalService,
              private  spinner: NgxSpinnerService, private toastr: ToastrService,
              private router: Router, private firebaseService: FirebaseService,
              private data: DataService, private sendMessage: MessageService,
              private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.unsuscribe();
    
    if(localStorage.getItem('user') !== null) {
      this.showConnexion = false;
      this.showUser = true;
      if (localStorage.getItem('user') === 'pmetask@gmail.com') this.showAdminOPtions = true;
      
      this.getUser(localStorage.getItem('user'));          
    }else{
      this.showConnexion = true;
      this.showUser = false;
      this.showAdminOPtions = false;
    }

  }

  unsuscribe(): void {
    if (this.ngAfterSuscribtions) { 
      this.ngAfterSuscribtions.unsubscribe();
    }
  }

  ngAfterViewInit() {
   this.ngAfterSuscribtions = this.sendMessage.currentMessage.subscribe(message => {

      if(message.includes('User Connected from homeComponent')) {

        if (localStorage.getItem('user') !== null) {
          this.showConnexion = false;
          this.showUser = true;  
          if (localStorage.getItem('first_name') && localStorage.getItem('first_name') !== '')  {
            this.user = localStorage.getItem('first_name');
          } else {
            this.user = 'Welcome';
          }
          
        }else{
          this.showConnexion = true;
          this.showUser = false;
        }
        
      }else if(message.includes('User Disconnected from homeComponent')) {
            this.logOut();
      }

    });
  }

  public openModal(template:TemplateRef<any>){
    this.reinitialiseError();
    if(this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
  
  }

  public openModalCreerCompte(template:TemplateRef<any>){
    
    this.indicatifPays = '0';
    this.reinitialiseError();
    if (this.modalRef)this.modalRef.hide();
    this.modalRef = this.modalService.show(template, this.config);
    

    setTimeout(() => {
      /** spinner ends after 0.5 seconds */
      this.clear();
    }, 500);
    
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

  contact(): void {
  
    console.log('Vous avez selectionné contact');
    let link = ['/contact'];
    if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
    this.spinner.show();

    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
      this.router.navigate(link);
    }, 2000);
    if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  about(): void {
   
     console.log('Vous avez selectionné contact');
     let link = ['/about'];
     if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  beneficiaire(): void {
   
     console.log('Vous avez selectionné beneficiaire');
     let link = ['/beneficiaire'];
     if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  transactions(): void {
    
     console.log('Vous avez selectionné transactions');
     let link = ['/transactions'];
     if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  Managetransactions(): void {
   
     console.log('Vous avez selectionné Managetransactions');
     let link = ['/manageTransaction'];
     if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  } 

  faq(): void {
    
     console.log('Vous avez selectionné currency');
     let link = ['/faq'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }
  
  currency(): void {
 
     console.log('Vous avez selectionné currency');
     let link = ['/currency'];
     if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  Home(): void {

    let link = ['/'];
    if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
    this.spinner.show();

    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
      this.router.navigate(link);
    }, 2000);
    if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
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

  openSpinnerForModif($event){
    /** spinner starts on init */
    this.load = $event;
    this.spinner.show();
  
    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
      this.modalRef.hide(); // pour fermer le popup
      this.showUser = true;
      this.showConnexion = false;
      swal.fire({title: 'Edit', text: 'Done successfuly', 
            confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'success', position: 'top-middle'});
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

  async authentification(email,password){
    this.reinitialiseError();
     if(email.value.length===0 || password.value.length===0){
        this.showConnexion = true;
        this.showUser = false;
        this.showAdminOPtions = false;
        if (email.value.length === 0) this.enableEmail = true;
        if (password.value.length === 0) this.enablePassword = true;
     }else if(email.value==="admin"&&password.value==="admin"){
         this.openSpinner("Chargement...");
         this.showUser = true;
         this.showConnexion = false;
    }else{
         
         let email_ = email.value.toString().trim();
         let password_ = password.value.toString().trim();
         this.spinner.show();
         await this.firebaseService.signIn(email_, password_);
         if (this.firebaseService.isLoggedIn) {
            
            this.getUser(email_);
            this.showConnexion = false;
            this.openSpinnerForAccount("Chargement...");
            this.modalRef.hide(); // pour fermer le popup
            this.showUser = true;
            this.showConnexion = false;
            if (localStorage.getItem('user') === 'pmetask@gmail.com') this.showAdminOPtions = true;
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
             this.openSpinnerForAccount("Chargement...");
             this.modalRef.hide(); // pour fermer le popup
             this.showUser = true;
             this.showConnexion = false;
          }
      } else {
        this.enablePasswordMatch = true;
      }
          
    }

  } 

  async modifierCompte(Inputnom, Inputprenom, Inputdate, InputCountry, InputProvince, InputTown, Inputadress, InputTel): Promise<void>{
      
    this.reinitialiseError();
    if (Inputnom.value.length == 0 || Inputprenom.value.length == 0 || Inputdate.value.length == 0 || 
    InputCountry.value.length == 0 || InputTown.value.length == 0 || Inputadress.value.length == 0 || 
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
       
        this.userObj.id = this.currentUser.id;
        this.userObj.email = this.currentUser.email;
        this.userObj.password = this.currentUser.password;
        this.userObj.first_name = Inputprenom.value;
        this.userObj.last_name = Inputnom.value;
        if (InputTel.value.includes('+')) {
          this.userObj.mobile =   InputTel.value;
        }else{
          this.userObj.mobile =   indicatif + InputTel.value;
        }
        this.userObj.address = Inputadress.value;
        this.userObj.dateOfBirth = Inputdate.value;
        this.userObj.town = InputTown.value;
        this.userObj.province = InputProvince.value;
        this.userObj.country = InputCountry.value;
        this.userObj.occupation = '';

          this.spinner.show();
          
          if (this.firebaseService.isLoggedIn) {
             this.updateuser(this.userObj);
             
             this.getUser(this.currentUser.email);
             this.openSpinnerForModif("Chargement...");
          }
          
    }

  } 

  logOut(): void {
    this.firebaseService.logOut();
    let link = ['/'];
    this.router.navigate(link);
    this.showUser = false;
    this.showConnexion = true;
    this.showAdminOPtions = false;
    this.openSpinner("Chargement...");
 
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
  
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    event.target.innerWidth;
    if(localStorage.getItem('user') !== null) {
      this.showConnexion = false;
      this.showUser = true;
    }else{
      this.showConnexion = true;
      this.showUser = false;
    }
  }

  
  onChange(event){
  
    this.mobileValue = event.internationalNumber;
  }

  adduser(userObj: User) {
    this.data.adduser(userObj);
  }

  updateuser(userObj: User) {
    this.data.updateuser(userObj);
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

      if(this.currentUser.first_name === '') {
        this.user = 'Welcome';
      }else{
        this.user = this.currentUser.first_name;
      }
      localStorage.setItem('last_name', this.currentUser.last_name);
      localStorage.setItem('first_name', this.currentUser.first_name);
      localStorage.setItem('mobile', this.currentUser.mobile);
      if (localStorage.getItem('user').includes('{')) {
         localStorage.removeItem('user');
         localStorage.setItem('user', email);
      }
      
    }, err => {
      console.log('Error while fetching user data');
    })
    
  }

  clear(): void {
  
    let form =  document.getElementById("myForm") as HTMLFormElement;
    form.reset();
  }

  clearForm(form: FormGroup) {
    form.reset();
  }

  open(template:TemplateRef<any>): void {

    this.reinitialiseError();
    if (this.modalRef)this.modalRef.hide();
    this.modalRef = this.modalService.show(template, this.config);
  
  
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

  changeLanguage(): void {
    
    if (this.language === 'FR') {
      
      this.language = 'EN';
      localStorage.setItem('language', 'EN');
      window.location.href = '/' + this.localesList[1].code + '/';
    }else{
      
      this.language = 'FR';
      localStorage.setItem('language', 'FR');
      window.location.href = '/' + this.localesList[0].code + '/';
    }
    
  }
}
