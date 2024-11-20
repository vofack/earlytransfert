
import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { IAfterGuiAttachedParams, ICellRendererParams } from 'ag-grid-community';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { Beneficiary } from 'src/app/models/beneficiary';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-edit-renderer',
  templateUrl: './edit-renderer.component.html',
  styleUrls: ['./edit-renderer.component.scss']
})
export class EditRendererComponent implements OnInit, ICellRendererAngularComp {

  private params: any;
  modalRef: any;
  itemToEdit = '';
  allBeneficiariesList: Beneficiary[] = [];
  
  mobileValue = '';
  enableEmail: boolean;
  enableNom: boolean;
  enablePrenom: boolean;
  enableCountry: boolean;
  enableTown: boolean;
  enableTelephone: boolean;
  separateDialCode = false;
  phoneForm = new FormGroup({
    phone: new FormControl(undefined, [Validators.required])
  });
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
  prevBeneficiaryObj: Beneficiary = {
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
  @ViewChild('templateEdit', {read: TemplateRef}) modalTemplate: TemplateRef<any>;

  constructor(private modalService:BsModalService, private toastr: ToastrService,
              private data: DataService, private cd: ChangeDetectorRef) { }
  
  refresh(params: ICellRendererParams): boolean {
    throw new Error('Method not implemented.');
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
  }

  onChange(event){
    console.log(event);
    this.mobileValue = event.internationalNumber;
  }

  handleClickEvent(event:any) {
    this.itemToEdit = this.params.data.last_name;
   
    this.modalRef = this.modalService.show(this.modalTemplate);
    let Inputprenom = document.getElementById("Inputprenom") as HTMLFormElement;
    let Inputnom = document.getElementById("Inputnom") as HTMLFormElement;
    let InputCountry = document.getElementById("InputCountry") as HTMLFormElement;
    let InputTown = document.getElementById("InputTown") as HTMLFormElement;
    let Inputemail = document.getElementById("Inputemail") as HTMLFormElement;
    Inputprenom.value = this.params.data.first_name;
    Inputnom.value = this.params.data.last_name;
    InputCountry.value = this.params.data.country;
    InputTown.value = this.params.data.town;
    Inputemail.value = this.params.data.email;

    let select = document.getElementById('selectId')as HTMLFormElement;

    if (this.params.data.mobile.includes('+237')) {
       select.value = "CM";
    }else if (this.params.data.mobile.includes('+225')){
      select.value = "CI";
    }else if (this.params.data.mobile.includes('+1')){
      select.value = "CA";
    }else if (this.params.data.mobile.includes('+86')){
      select.value = "CN";
    }else if (this.params.data.mobile.includes('+33')){
      select.value = "FR";
    }else if (this.params.data.mobile.includes('+44')){
      select.value = "GB";
    }
    this.indicatifPays = select.value;
    let obj = document.getElementById("InputTel") as HTMLFormElement;
    obj.value = this.params.data.mobile;
   
    this.cd.detectChanges();

    this.prevBeneficiaryObj.id = this.params.data.id;
    this.prevBeneficiaryObj.userEmail = this.params.data.userEmail; // current email connected
    this.prevBeneficiaryObj.first_name = this.params.data.first_name;
    this.prevBeneficiaryObj.last_name = this.params.data.last_name;
    this.prevBeneficiaryObj.email = this.params.data.email;
    this.prevBeneficiaryObj.mobile = this.params.data.mobile;
    this.prevBeneficiaryObj.town = this.params.data.town;
    this.prevBeneficiaryObj.country = this.params.data.country;
  }

  reinitialiseError(){
    this.enableEmail = false;
    this.enablePrenom = false;
    this.enableNom = false;
    this.enableCountry = false;
    this.enableTown = false;
    this.enableTelephone = false;
  }


  modifier(Inputnom,Inputprenom,InputCountry,InputProvince,InputTown,Inputemail,InputTel): void {

    this.reinitialiseError();
    if (Inputnom.value.length == 0 || Inputprenom.value.length == 0 ||
        InputCountry.value.length == 0 || InputTown.value.length == 0 ||  
        Inputemail.value.length == 0 || InputTel.value.length == 0 ||  this.indicatifPays === '0') {


        if (Inputnom.value.length == 0) this.enableNom = true;
        if (Inputprenom.value.length == 0) this.enablePrenom = true;
        if (InputCountry.value.length == 0) this.enableCountry = true;
        if (InputTown.value.length == 0) this.enableTown = true;
        if (InputTel.value.length == 0) this.enableTelephone = true;
        if (this.indicatifPays === '0') this.enableTelephone = true;
        if (Inputemail.value.length == 0) this.enableEmail = true;
        this.toastr.error('Erreur de validation','Ajout',{progressBar: true, 
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
          
          
          
          this.toastr.success('Change made successfully','Early Transfer', {progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 4000});
          this.modalRef.hide(); // pour fermer le popup

          setTimeout(() => {
            /** spinner ends after 4 seconds */ 
            this.updateBeneficiary(this.beneficiaryObj);
          }, 4500);
    }

  }

  selectElement(event:any): void {
    this.indicatifPays = event.target.value;
  }

  updateBeneficiary(beneficiaryObj: Beneficiary) {
    this.data.deleteBeneficiary(this.prevBeneficiaryObj); 
    this.data.addBeneficiary(beneficiaryObj);
  }

}
