import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IDropdownSettings } from 'ng-multiselect-dropdown9'; 
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Beneficiary } from 'src/app/models/beneficiary';
import { DataService } from 'src/app/services/data.service';
import { MessageService } from 'src/app/services/message.service';
import { Service } from 'src/app/services/service';
declare function initParticule(): void; 



@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {
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
  enablePrenom: boolean;
  enableCountry: boolean;
  enableTown: boolean;
  enableTelephone: boolean;
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
  indicatifPays = '0';
  separateDialCode = false;
  phoneForm = new FormGroup({
    phone: new FormControl(undefined, [Validators.required])
  });
  @ViewChild('templateConnexionRequired', {read: TemplateRef}) modalTemplate: TemplateRef<any>;
  constructor(private service: Service, private  spinner: NgxSpinnerService,
              private router: Router, private modalService:BsModalService, 
              private route:ActivatedRoute, private sendMessage: MessageService,
              private data: DataService, private toastr: ToastrService) {
                
               }

  ngOnInit(): void {

    if ( !(localStorage.getItem('recipientMobile') === 'default message' ||
         localStorage.getItem('recipientMobile') === null || 
         !localStorage.getItem('recipientMobile')) ){
     this.confirmTransaction();
     return;
    }

    if(localStorage.getItem('user')){

            this.subscription = this.sendMessage.currentMessage.subscribe(message => this.message = message);

            if(localStorage.getItem('messageForTransaction') === 'default message' ||
              localStorage.getItem('messageForTransaction') === null || 
              !localStorage.getItem('messageForTransaction')) { // save data if user reload page
              localStorage.setItem('messageForTransaction', this.message);
              //location.reload();
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

                    this.getBeneficiaries();
                    this.dropdownSettings = {
                      singleSelection: true,
                      idField: 'item_id',
                      textField: 'item_text',
                      selectAllText: 'Select All',
                      unSelectAllText: 'UnSelect All',
                      itemsShowLimit: 3,
                      allowSearchFilter: true,
                      closeDropDownOnSelection: true
                    };
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
    localStorage.removeItem('messageForTrackingWith');
    this.sendMessage.changeMessage('default message');
  }

  ngAfterViewInit() {
  }

  ngBeforeViewInit(){
    
  }
  
  ngOnDestroy() {
    if(this.subscription) this.subscription.unsubscribe();
  }

  onItemSelect(item: any) {
    this.recipient = item.item_text;
    this.recipientMobile = this.dropdownList[Number(item.item_id)-1].mobile;
    this.enableError = false;
    this.saveNewBenef = false;
  }

  onItemDeSelect(item: any) {
    this.recipient = '';
    this.saveNewBenef = false;
  }

  onSelectAll(items: any) {
  }

  reinitialiseError(): void {
    this.enableError = false;
    this.enableEmail = false;
    this.enablePrenom = false;
    this.enableNom = false;
    this.enableCountry = false;
    this.enableTown = false;
    this.enableTelephone = false;
  }

  confirmTransaction(): void {

    this.reinitialiseError();
    if (this.recipient === ''){
      this.enableError = true;
    }else{
      
      this.sendMessage.changeMessage( this.message );
      localStorage.setItem("recipient", this.recipient);
      localStorage.setItem("recipientMobile", this.recipientMobile);
      
      if(this.saveNewBenef)this.addBeneficiary(this.beneficiaryObj);
      
      let link = ['/confirmTransaction'];
      this.spinner.show();
      setTimeout(() => {
        /** spinner ends after 2 seconds */
        localStorage.removeItem('messageForTransaction');
        this.spinner.hide();
        this.router.navigate(link);
      }, 2000);
      if(this.modalRef) this.modalRef.hide(); // pour fermer le popup
    }

  }
  
  getBeneficiaries(): void {
    
    let receiveDropdownList =  localStorage.getItem('dropdownList').split('*');
    let receiverDropdownWithDouble = [];
    let index = 0;
    for (let i = 0; i < receiveDropdownList.length; i++) {
      if(receiveDropdownList[i] && !receiverDropdownWithDouble.includes(receiveDropdownList[i].split(':')[0])) {
        receiverDropdownWithDouble.push(receiveDropdownList[i].split(':')[0]);
        this.dropdownList.push({ 'item_id': ++index, 'item_text': receiveDropdownList[i].split(':')[0], 'mobile': receiveDropdownList[i].split(':')[1] });
      }
    }

  }

  public openModal(template:TemplateRef<any>){
    this.reinitialiseError();
    if(this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
    this.mobileValue = '';
  }


  ajouter(Inputnom,Inputprenom,InputCountry,InputProvince,InputTown,Inputemail,InputTel): void {

    this.reinitialiseError();
    if (Inputnom.value.length == 0 || Inputprenom.value.length == 0 ||
        InputCountry.value.length == 0 || InputTown.value.length == 0 ||  
        Inputemail.value.length == 0 || InputTel.value.length == 0  || this.indicatifPays === '0') {


        if (Inputnom.value.length == 0) this.enableNom = true;
        if (Inputprenom.value.length == 0) this.enablePrenom = true;
        if (InputCountry.value.length == 0) this.enableCountry = true;
        if (InputTown.value.length == 0) this.enableTown = true;
        if (InputTel.value.length == 0) this.enableTelephone = true;
        if (this.indicatifPays === '0') this.enableTelephone = true;
        if (Inputemail.value.length == 0) this.enableEmail = true;
        this.toastr.error('Erreur de validation','Ajout', {progressBar: true, 
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

          let Inputnom_ = Inputnom.value.toString().trim();
          let Inputprenom_ = Inputprenom.value.toString().trim();
          let InputCountry_ = InputCountry.value.toString().trim();
          let InputTown_ = InputTown.value.toString().trim();
          let Inputemail_ = Inputemail.value.toString().trim();
     
          this.beneficiaryObj.id = '';
          this.beneficiaryObj.userEmail = localStorage.getItem('user'); // current email connected
          this.beneficiaryObj.first_name = Inputprenom_;
          this.beneficiaryObj.last_name = Inputnom_;
          this.beneficiaryObj.email = Inputemail_;
           if (InputTel.value.includes('+')) {
               this.beneficiaryObj.mobile =   InputTel.value;
          }else{
               this.beneficiaryObj.mobile =   indicatif + InputTel.value;
          }
          this.beneficiaryObj.town = InputTown_;
          this.beneficiaryObj.country = InputCountry_;
          

          this.toastr.success('Ajout effectuer avec succes','Early Transfer', {progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000});
          this.modalRef.hide(); // pour fermer le popup
         
          this.dropdownList.push({ 'item_id': 2, 'item_text':  Inputprenom_ + ' ' + Inputnom_, 'mobile': this.mobileValue });

          setTimeout(() => {       
            this.recipient = Inputprenom_ + ' ' + Inputnom_;
            this.recipientMobile = this.mobileValue;
            this.saveNewBenef = true;

            this.selectedItems = [{ 'item_id': this.dropdownList.length + 1, 'item_text':  this.recipient, 'mobile': this.recipientMobile }];
           
          }, 3500);
    }


  }

  onChange(event){
    this.mobileValue = event.internationalNumber;
  }

  addBeneficiary(beneficiaryObj: Beneficiary) { 
    this.data.addBeneficiary(beneficiaryObj);
  }

  selectElement(event:any): void {
    this.indicatifPays = event.target.value;
}


}
