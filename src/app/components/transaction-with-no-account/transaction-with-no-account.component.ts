import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown9'; 
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Beneficiary } from 'src/app/models/beneficiary';
import { DataService } from 'src/app/services/data.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MessageService } from 'src/app/services/message.service';
import { Service } from 'src/app/services/service';
declare function initParticule(): void; 



@Component({
  selector: 'app-transaction-with-no-account',
  templateUrl: './transaction-with-no-account.component.html',
  styleUrls: ['./transaction-with-no-account.component.scss']
})
export class TransactionWithNoAccountComponent implements OnInit, AfterViewInit {
  dropdownList = [];
  selectedItems = [];
  dropdownSettings:IDropdownSettings = {};
  modalRef: any;
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
  recipientMobile = '';
  mobileValue = '';
  enableError = false;
  saveNewBenef = false;
  enableEmail: boolean;
  enableNom: boolean;
  enableNomDest: boolean;
  enablePrenom: boolean;
  enablePrenomDest: boolean;
  enableCountry: boolean;
  enableTown: boolean;
  enableTelephone: boolean;
  enableTelephoneDest: boolean;
  allBeneficiariesList: Beneficiary[] = [];
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
  language = '';
  currentLanguage = '';

  separateDialCode = false;
  phoneForm = new FormGroup({
    phone: new FormControl(undefined, [Validators.required])
  });
  @ViewChild('templateConnexionRequired', {read: TemplateRef}) modalTemplate: TemplateRef<any>;
  constructor(private service: Service, private  spinner: NgxSpinnerService,
              private router: Router, private modalService:BsModalService, 
              private route:ActivatedRoute, private sendMessage: MessageService,
              private data: DataService, private toastr: ToastrService, private firebaseService: FirebaseService) {
                
               }

               async ngOnInit(): Promise<void> {

            
          
                        if ( !(localStorage.getItem('recipientEmail') === 'default message' ||
                             localStorage.getItem('recipientEmail') === null || 
                             !localStorage.getItem('recipientEmail')) ){
                              this.confirmTransaction();
                              return;
                        }
                        this.subscription = this.sendMessage.currentMessage.subscribe(message => this.message = message);
            
                        if(localStorage.getItem('messageForTransaction') === 'default message' ||
                          localStorage.getItem('messageForTransaction') === null || 
                          !localStorage.getItem('messageForTransaction')) { // save data if user reload page
                          localStorage.setItem('messageForTransaction', this.message);
                          let link = localStorage.getItem('language');;
                          if (link === 'EN') {
                            this.currentLanguage = 'en-US';     
                          }else{
                            this.currentLanguage = 'fr';
                          }
                          
                          //location.reload();
                          //window.open(window.location.href, "_self");
                          //window.location.href = '/' + this.currentLanguage + '/transactionWithNoAccount'
                        }else{
                          this.message = localStorage.getItem('messageForTransaction');
                        }
            
                        let receiveMsg =  this.message.split(':');
            
                        if (receiveMsg !== null && receiveMsg && receiveMsg[1]) {
                         
                                this.sendValue =  receiveMsg[1].split('-')[0];
                                this.receiveValue =  receiveMsg[1].split('-')[1];
                                this.currentRate =  receiveMsg[1].split('-')[2];
                                this.currencyToSend = receiveMsg[1].split('-')[3];
                                this.currencyToReceive = receiveMsg[1].split('-')[4];
            
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
                          let link = [ '/'];
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
      localStorage.removeItem('messageForTrackingWith');
      this.sendMessage.changeMessage('default message');
    }

    ngAfterViewInit(): void {
      let link = localStorage.getItem('language');;
      if (link === 'EN') {
        this.currentLanguage = 'en-US';     
      }else{
        this.currentLanguage = 'fr';
      }
  }

    ngBeforeViewInit(){
      
    }
  
    ngOnDestroy() {
      if(this.subscription) this.subscription.unsubscribe();
    }

  

    onSelectAll(items: any) {
    }

    reinitialiseError(): void {
      //this.enableError = false;
      this.enableEmail = false;
      this.enablePrenom = false;
      this.enablePrenomDest = false;
      this.enableNom = false;
      this.enableNomDest = false;
      this.enableCountry = false;
      this.enableTown = false;
      this.enableTelephone = false;
      this.enableTelephoneDest = false;
    }

    async confirm(): Promise<void> {
      await this.firebaseService.signInWithNoAccount('guest@gmail.com', 'Shama@16');
      if (this.firebaseService.isLoggedIn) {
          this.confirmTransaction();
      }
    }

    confirmTransaction(): void {
    
        this.sendMessage.changeMessage( this.message );
        localStorage.setItem("recipient", this.recipient);
        localStorage.setItem("recipientMobile", this.recipientMobile);
        localStorage.setItem("recipientEmail", this.beneficiaryObj.email); // set recipient Email
       
        
        let link = [ '/confirmTransactionWna'];
        this.spinner.show();
        setTimeout(() => {
          /** spinner ends after 2 seconds */
          localStorage.removeItem('messageForTransaction');
          this.spinner.hide();
          this.router.navigate(link);
        }, 2000); 

    }
  




    ajouter(Inputnom,InputnomDest,Inputprenom,InputprenomDest,
                  InputCountry,InputPostal,InputTown,Inputemail,InputTel,InputTelDest,Inputselect, InputselectDest): void {

      this.reinitialiseError();

      if (Inputnom.value.length == 0 || InputnomDest.value.length == 0 || 
          Inputprenom.value.length == 0 || InputprenomDest.value.length == 0 ||
          InputCountry.value.length == 0 || InputTown.value.length == 0 ||  
          Inputemail.value.length == 0 || InputTel.value.length == 0  || 
          InputTelDest.value.length == 0 || Inputselect.value == '0' || InputselectDest.value == '0') {


          if (Inputnom.value.length === 0) this.enableNom = true;
          if (InputnomDest.value.length === 0) this.enableNomDest = true;
          if (Inputprenom.value.length === 0) this.enablePrenom = true;
          if (InputprenomDest.value.length === 0) this.enablePrenomDest = true;
          if (InputCountry.value.length === 0) this.enableCountry = true;
          if (InputTown.value.length === 0) this.enableTown = true;
          if (InputTel.value.length === 0) this.enableTelephone = true;
          if (Inputselect.value == '0' ) this.enableTelephone = true;
          if (InputTelDest.value.length === 0) this.enableTelephoneDest = true;
          if (InputselectDest.value == '0') this.enableTelephoneDest = true;
          if (Inputemail.value.length === 0) this.enableEmail = true;
          this.toastr.error('Erreur de validation','Ajout', {progressBar: true, 
            toastClass: 'toast-custom', closeButton: true,
            positionClass: 'toast-bottom-left'});

          
      }else{


            let indicatif = '';
            if (Inputselect.value === 'CM') {
              indicatif = '+237';
            }else if (Inputselect.value === 'CI'){
              indicatif = '+225';
            }else if (Inputselect.value === 'CA'){
              indicatif = '+1';
            }else if (Inputselect.value === 'US'){
              indicatif = '+1';
            }else if (Inputselect.value === 'CN'){
              indicatif = '+86';
            }else if (Inputselect.value === 'FR'){
              indicatif = '+33';
            }else if (Inputselect.value=== 'GB'){
              indicatif = '+44';
            }

            let indicatifDest = '';
            if (InputselectDest.value === 'CM') {
              indicatifDest = '+237';
            }else if (InputselectDest.value === 'CI'){
              indicatifDest = '+225';
            }else if (InputselectDest.value === 'CA'){
              indicatifDest = '+1';
            }else if (InputselectDest.value === 'US'){
              indicatifDest = '+1';
            }else if (InputselectDest.value === 'CN'){
              indicatifDest = '+86';
            }else if (InputselectDest.value === 'FR'){
              indicatifDest = '+33';
            }else if (InputselectDest.value === 'GB'){
              indicatifDest = '+44';
            }

            let Inputnom_ = Inputnom.value.toString().trim();
            let InputnomDest_ = InputnomDest.value.toString().trim();
            let Inputprenom_ = Inputprenom.value.toString().trim();
            let InputprenomDest_ = InputprenomDest.value.toString().trim();
            let InputCountry_ = InputCountry.value.toString().trim();
            let InputTown_ = InputTown.value.toString().trim();
            let Inputemail_ = Inputemail.value.toString().trim();
      
            this.beneficiaryObj.id = '';
            this.beneficiaryObj.userEmail = localStorage.getItem('user'); // current email connected
            this.beneficiaryObj.first_name = InputprenomDest_;
            this.beneficiaryObj.last_name = InputnomDest_;
            this.beneficiaryObj.email = Inputemail_;
            if (InputTel.value.includes('+')) {
                this.beneficiaryObj.mobile =   InputTel.value;
            }else{
                this.beneficiaryObj.mobile =   indicatif + InputTel.value;
            }
            this.beneficiaryObj.town = InputTown_;
            this.beneficiaryObj.country = InputCountry_;
            

            this.toastr.success('Transaction en cours','Early Transfer', {progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 1000});
            this.recipient = InputprenomDest_ + ' ' + InputnomDest_;
            this.recipientMobile = this.beneficiaryObj.mobile;


            setTimeout(() => {

              this.confirm();
            }, 1500);
      }


    }

    onChange(event){
      this.mobileValue = event.internationalNumber;
    }

    addBeneficiary(beneficiaryObj: Beneficiary) { 
      this.data.addBeneficiary(beneficiaryObj);
    }

    changeLanguage(): void {  
      this.sendMessage.changeMessage('change language'); //send message to Hamburger1Component
    }

}

