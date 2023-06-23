import { ChangeDetectorRef, Component, HostListener, OnInit, TemplateRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import {NgxSpinnerService} from "ngx-spinner";
import { LoadingBarService } from '@ngx-loading-bar/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { FirebaseService } from 'src/app/services/firebase.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user';
import { DataService } from 'src/app/services/data.service';
import { MessageService } from 'src/app/services/message.service';
import { Subscription } from 'rxjs';
declare let swal: any;
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-hamburger1',
  templateUrl: './hamburger1.component.html',
  styleUrls: ['./hamburger1.component.scss'],
  encapsulation: ViewEncapsulation.None // take the style of the modal popup in considaration
})
export class Hamburger1Component implements OnInit {
  localesList = [
    { code:'en-US', label: 'EN'},
    { code:'fr', label: 'FR'}
  ];
  language = localStorage.getItem('language');
  paddinLeftSize = 0;
    private ngAfterSuscribtions: Subscription;
    modalRef: any;
    loader = this.loadingBar.useRef();
    load = '';
    mobileValue = '';
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
    enablePasswordMatch = false;
    showUser = false;
    showConnexion = true;
    menuOpen = false;
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
    indicatifPays = '0';
    phoneForm = new FormGroup({
      phone: new FormControl(undefined, [Validators.required])
    });
    constructor(private loadingBar: LoadingBarService,  private modalService:BsModalService,
      private  spinner: NgxSpinnerService, private toastr: ToastrService,
      private router: Router, private firebaseService: FirebaseService, 
      private data: DataService, private sendMessage: MessageService,
      private cd: ChangeDetectorRef,private titleService: Title) { 
        //this.titleService.setTitle($localize`${this.language}`);
      }

  ngOnInit(): void {
    this.paddinLeftSize = Number(window.innerWidth) - 120;
    if(localStorage.getItem('user') !== null) {
      this.showConnexion = false;
      this.showUser = true;
      this.getUsers(localStorage.getItem('user'));     
    }else{
      this.showConnexion = true;
      this.showUser = false;
    }
  }

  ngOnDestroy() {
    this.unsuscribe();
  }

  unsuscribe(): void {
    if (this.ngAfterSuscribtions) { 
      this.ngAfterSuscribtions.unsubscribe();
    }
  }

  ngAfterViewInit() {
  this.ngAfterSuscribtions =  this.sendMessage.currentMessage.subscribe(message => {

      if(message.includes('User Connected from homeComponent')) {

        if(localStorage.getItem('user') !== null) {
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
      }else if (message.includes('change language')) {
        this.changeLanguage();
      }

    });
  }
  
  public openModal(template:TemplateRef<any>){
    if(this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
    if (this.menuOpen) {
      document.getElementById("menuCheckbox").click(); // to close the menu
      this.menuOpen = false;
    }
  
  }

  public openModalCreerCompte(template:TemplateRef<any>){
    this.indicatifPays = '0';
    if(this.modalRef) this.modalRef.hide();
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
    document.getElementById("menuCheckbox").click(); // to close the menu
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
     document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  Home(): void {
 
    console.log('Vous avez selectionné Home');
    let link = ['/'];
    document.getElementById("menuCheckbox").click(); // to close the menu
    this.spinner.show();

    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
      this.router.navigate(link);
    }, 2000);
    if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  openSpinner($event){
    /** spinner starts on init */
    this.load = $event;
    this.spinner.show();

    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
    }, 2000);
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

  async authentification(email,password){
    this.reinitialiseError();
    
    if(email.value.length===0 || password.value.length===0){
        this.showConnexion = true;
        this.showUser = false;
        if (email.value.length === 0) this.enableEmail = true;
        if (password.value.length === 0) this.enablePassword = true;
    }else if(email.value==="admin"&&password.value==="admin"){
        this.openSpinnerForAccount("Chargement...");
        this.showUser = true;
        this.showConnexion = false;
    }else{
        
        let email_ = email.value.toString().trim();
        let password_ = password.value.toString().trim();
        
        this.spinner.show();
        await this.firebaseService.signIn(email_, password_);
        if (this.firebaseService.isLoggedIn) {
            this.getUsers(email_);
            this.goToHome(email_);
            this.modalRef.hide(); // pour fermer le popup
        }
        
    }    
  }

  goToHome(email_: string): void {
    this.openSpinnerForAccount("Chargement...");
    this.showUser = true;
    this.showConnexion = false;
    this.sendMessage.changeMessage('User Connected from Hamburger1Component: ' +  email_) //send message to HomeComponent
    let link = ['/'];
    this.router.navigate(link);
  }

  setUser(): void {
      
      this.currentUser = this.userObj; 

      if(localStorage.getItem('last_name') === '') {
        this.user = 'Welcome';
        localStorage.setItem('last_name', this.currentUser.last_name);
        localStorage.setItem('first_name', this.currentUser.first_name);
        localStorage.setItem('mobile', this.currentUser.mobile);
        if(localStorage.getItem('user') === '') localStorage.setItem('user', this.currentUser.email);

        if (localStorage.getItem('user').includes('{')) {
          localStorage.removeItem('user');
          localStorage.setItem('user', this.currentUser.email);
        }
      }else{
        this.user = this.currentUser.last_name;
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
          this.spinner.show();
          let email_ = Inputemail.value.toString().trim();
          let password_ = Inputpassword.value.toString().trim();
          await this.firebaseService.signUp(email_, password_);
          if (this.firebaseService.isLoggedIn) {
            this.adduser(this.userObj);
            this.getUsers(email_);

            this.goToHome(email_);
            this.modalRef.hide(); // pour fermer le popup
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
             this.getUsers(this.currentUser.email);
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
    this.openSpinner("Chargement...");
    this.sendMessage.changeMessage('User Disconnected from Hamburger1Component: ') //send message to HomeComponent
    location.reload();
  }
  
   
   beneficiaire(): void {
   
     console.log('Vous avez selectionné beneficiaire');
     let link = ['/beneficiaire'];
     document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  Transactions(): void {
   
     console.log('Vous avez selectionné transactions');
     let link = ['/transactions'];
     document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
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
    console.log(event);
    this.mobileValue = event.internationalNumber;
  }
 
  adduser(userObj: User) {
    this.data.adduser(userObj);
  }

  updateuser(userObj: User) {
    this.data.updateuser(userObj);
  }

  getUsers(email: string) {

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

  faq(): void {
    // this.loader.start();
     console.log('Vous avez selectionné faq');
     let link = ['/faq'];
     if (document.getElementById("menuCheckbox")) document.getElementById("menuCheckbox").click(); // to close the menu
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  manageMenu(): void {
    this.menuOpen = true;
  }

  clearForm(form: FormGroup) {
    form.reset();
  }
  
  clear(): void {
    let form =  document.getElementById("myForm") as HTMLFormElement;
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
