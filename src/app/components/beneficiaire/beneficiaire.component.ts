
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CellClickedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Beneficiary } from 'src/app/models/beneficiary';
import { DataService } from 'src/app/services/data.service';
import { MessageService } from 'src/app/services/message.service';
import { Service } from 'src/app/services/service';
import { CheckboxCellComponent } from '../checkbox-cell/checkbox-cell.component';
import { CustomizedCellComponentComponent } from '../customized-cell-component/customized-cell-component.component';
import { DeleteRendererComponent } from '../delete-renderer/delete-renderer.component';
import { EditRendererComponent } from '../edit-renderer/edit-renderer.component';
declare let swal: any;

@Component({
  selector: 'app-beneficiaire',
  templateUrl: './beneficiaire.component.html',
  styleUrls: ['./beneficiaire.component.scss']
})
export class BeneficiaireComponent implements OnInit {
  private gridApi;
  private gridColumnApi;
  public columnDefs;
  public columnDefsXs;
  private sortingOrder;
  load = '';
  rowData: any;
  params: any;
  showXl = false;
  showXs = false;
  modalRef: any; 
  mobileValue = '';
  width = 370;
  frameworkComponents: { editRenderer: typeof EditRendererComponent; deleteRenderer: typeof DeleteRendererComponent; checkboxRender: typeof CheckboxCellComponent;};
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
  userBeneficiariesList: Beneficiary[] = [];
  allBeneficiariesList: Beneficiary[] = [];
  showCanadaCmr = true;
  showCmrCanada = false;
  amountToSendError = false;
  showRate = true;
  showRateSpinner = false;
  available = true;
  rate = '';
  receiver = '';
  dropdownList = '';
  recipient = '';
  recipientMobile = '';
  currencyToSend = 'CAD';
  currencyToReceive = 'XAF';
  currentValueTosend = 0;
  currentValueToReceive = 0;
  private getCurrencySuscribtions: Subscription;
  private getBeneficiarySuscribtions: Subscription;
  private getavailablePaySuscribtions: Subscription;
  @ViewChild('templateSendTransaction', {read: TemplateRef}) modalTemplateTransaction: TemplateRef<any>;
  loadingTemplate: string;
  noRowsTemplate: string;
  amountAvailable: any;
  indicatifPays = '0';

  constructor(private http: HttpClient, private modalService:BsModalService, 
              private toastr: ToastrService, private  spinner: NgxSpinnerService,
              private data: DataService, private router: Router, 
              private service: Service,  private sendMessage: MessageService) { 


                
    this.columnDefs = [

      {  
          field: 'Make transaction', cellRenderer: 'checkboxRender',
          cellClass: 'grid-cell-centered',
          width: 120,
          resizable: true,
          cellRendererParams: {
            onClick: this.onClickSelected.bind(this),
            checkbox: true,
            width: 20,
          }
      },

      {
        field: 'Edit', cellRenderer: 'editRenderer',
        headerClass: 'my-header-class',
        width: 120,
        resizable: true,
        cellRendererParams: {
          onClick: this.onClickEdit.bind(this),
          checkbox: true,
          width: 20,
        }
      },
      {
        field: 'delete',cellRenderer: 'deleteRenderer',
        headerClass: 'my-header-class',
        onClick: this.onClickDelete.bind(this),
        width: 120,
        resizable: true
        // cellRendererParams: {
        //   onClick: this.onClickDelete.bind(this),
        //   width: 20,
        // }
      }, 
      {
        headerName: "Name",
        field: "last_name",
        width: 150,
        filter: "agTextColumnFilter",
        sortingOrder: ["asc","desc"]
      },
      {
        headerName: "First name",
        field: "first_name",
        filter: "agTextColumnFilter",
        width: 150
      },
      {
        headerName: "Country",
        field: "country",
        filter: "agTextColumnFilter",
        width: 150,
        sortingOrder: ["asc",null]
      },
      {
        headerName: "Town",
        field: "town",
        filter: "agTextColumnFilter",
        width: 150,
        sortingOrder: ["asc"]
      },
      {
        headerName: "Telephone",
        field: "mobile",
        width: 150
      },
      {
        headerName: "Email",
        field: "email",
        filter: "agTextColumnFilter",
        width: 150
      }
    ];

    this.columnDefsXs = [

      { 
        field: 'Make transaction', cellRenderer: 'checkboxRender',
        headerClass: 'grid-cell-centered',
        width: 100,
        resizable: true,
        cellRendererParams: {
          onClick: this.onClickSelected.bind(this),
          checkbox: true,
          width: 20,
        }
      },

      {
        field: 'Edit', cellRenderer: 'editRenderer',
        headerClass: 'my-header-class',
        width: 50,
        resizable: true,
        cellRendererParams: {
          onClick: this.onClickEdit.bind(this),
          checkbox: true,
          width: 20,
        }
      },
      {
        field: 'Delete',cellRenderer: 'deleteRenderer',
        headerClass: 'my-header-class',
        onClick: this.onClickDelete.bind(this),
        width: 50,
        resizable: true
      },    
      {
        headerName: "Name",
        field: "last_name",
        width: 150,
        filter: "agTextColumnFilter",
        sortingOrder: ["asc","desc"]
      },
      {
        headerName: "First name",
        field: "first_name",
        filter: 'agTextColumnFilter',
        width: 150
      },
      {
        headerName: "Country",
        field: "country",
        filter: "agTextColumnFilter",
        width: 150,
        sortingOrder: ["asc",null]
      },
      {
        headerName: "Town",
        field: "town",
        filter: "agTextColumnFilter",
        width: 150,
        sortingOrder: ["asc"]
      },
      {
        headerName: "Telephone",
        field: "mobile",
        width: 150
      },
      {
        headerName: "Email",
        field: "email",
        filter: "agTextColumnFilter",
        width: 150
      }
    ];
    this.sortingOrder = ["desc", "asc", null];

    this.frameworkComponents = {
      editRenderer: EditRendererComponent,
      deleteRenderer: DeleteRendererComponent,
      checkboxRender: CheckboxCellComponent
    }

    this.loadingTemplate =
    `<span class="ag-overlay-loading-center">loading...</span>`;
  this.noRowsTemplate =
    `<strong>Please add beneficiary</strong>`;
  }

  onClickEdit(params) {
    //code
  }
    
  onClickDelete(params) {
     
  }

  onClickSelected(params) {

  }

  onSelectionChanged(event: SelectionChangedEvent) {
    const selectedData = this.gridApi.getSelectedRows();
    
  }

  onCellClicked(event: CellClickedEvent): void {
  
   this.recipient = event.data.last_name + ' ' + event.data.first_name;
   this.recipientMobile = event.data.mobile;
   this.getCurrency();
   if (event.colDef.field === 'Make transaction') this.modalRef = this.modalService.show(this.modalTemplateTransaction)

  }

  onGridReady(params) {
    this.params = params;
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;   
   this.getBeneficiaries(localStorage.getItem('user'));
  }

  getBeneficiaries(email: string) {
  
    this.data.getAllBeneficiary().subscribe(res => {
      let beneficiariesList = [];
      this.allBeneficiariesList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        if (data.userEmail === email) beneficiariesList.push(data);
        return data;
      });
      this.params.api.setRowData( beneficiariesList);
      this.rowData =  beneficiariesList;
    }, err => {
      console.log('Error while fetching beneficiary data');
    })
  
  }

  ngOnDestroy() {
    this.unsuscribe();
  }

  ngOnInit(): void {

    if(localStorage.getItem('user')) {

    
      if(window.innerWidth > 500) { 
        this.showXl = true;
        this.showXs = false;
      }else{
        this.showXl = false;
        this.showXs = true;
      }
          
    }else{
      let link = ['/'];
      this.router.navigate(link);
    }
  }

  getVal(item){

    var rowData_temp = [];
    for (let i = 0; i < this.rowData.length; i++) {
        if ((this.rowData[i].last_name).includes(item.target.value)) rowData_temp.push(this.rowData[i]);
    }
    this.params.api.setRowData(rowData_temp);
    console.log(item.target.value);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if(event.target.innerWidth > 500) {
        this.showXl = true;
        this.showXs = false;
      }else{
        this.showXl = false;
        this.showXs = true;
      }
  }

  public openModal(template:TemplateRef<any>){
    this.modalRef = this.modalService.show(template);
    this.mobileValue = '';
  }

  reinitialiseError(){
    this.enableEmail = false;
    this.enablePrenom = false;
    this.enableNom = false;
    this.enableCountry = false;
    this.enableTown = false;
    this.enableTelephone = false;
  }


  ajouter(Inputnom,Inputprenom,InputCountry,InputProvince,InputTown,Inputemail,InputTel): void {

    this.reinitialiseError();
    if (Inputnom.value.length == 0 || Inputprenom.value.length == 0 ||
        InputCountry.value.length == 0 || InputTown.value.length == 0 ||  
        Inputemail.value.length == 0  || InputTel.value.length == 0 || this.indicatifPays === '0') {


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

          setTimeout(() => {
            /** spinner ends after 2 seconds */   
            this.addBeneficiary(this.beneficiaryObj);
          }, 3500);
    }


  }

  onChange(event){
    console.log(event);
    this.mobileValue = event.internationalNumber;
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

 
 addBeneficiary(beneficiaryObj: Beneficiary) { 
  this.data.addBeneficiary(beneficiaryObj);
 }

  onGridSizeChanged = (params) => {
    let columnCount = params.columnApi.columnModel.gridColumns.length
    this.width = params.clientWidth / columnCount
    params.api.sizeColumnsToFit();
  }

  async asynTransition() {
   
    this.getavailablePaySuscribtions = await this.data.getPay().subscribe(res => {
      this.amountAvailable = res[0]['amount'];   
      
      this.transaction();
      }, err => {
        console.log('Error while fetching pay');
        console.log(err);
        this.unsuscribe();
    });
 }

  transaction(): void {

         const payAvailable = Number(this.amountAvailable) - Number(this.currentValueToReceive) > 5000;
        if(!this.available || !payAvailable) {
          swal.fire({title: 'Early Transfert', text: 'Service unavailable now, please try again later', 
          confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'info', position: 'top-middle'});
          return;
        }
   
        this.loadTransaction(localStorage.getItem('user'));
    
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

  getValForTransaction(item){
    
    this.currentValueTosend = Number(item.target.value);
    let currency = 'CAD';
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
        this.currencyToReceive = 'CAD';
      }else{
        this.showCanadaCmr = true;
        this.showCmrCanada = false;
        this.currencyToSend = 'CAD';
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

  getCurrency(): void {
    
    let currency = 'CAD';
    if(this.showCmrCanada){
      currency = 'XAF';
    }
    
    this.getCurrencySuscribtions = this .service.getCurrency(currency).subscribe(currency => {

        this.available = true;
        this.rate = currency.rates['XAF'].toFixed(2);
        if(this.showCmrCanada){
          this.rate = currency.rates['CAD'].toFixed(3);
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

  reinitialiazeAll(): void {
    localStorage.removeItem('recipient');
    localStorage.removeItem('recipientMobile');
    localStorage.removeItem('recipientEmail');
    localStorage.removeItem("dropdownList"); 
    localStorage.removeItem('messageForTracking'); 
    localStorage.removeItem('messageForTransaction');
    this.sendMessage.changeMessage('default message');
    this.dropdownList = '';
  }

  loadTransaction(email: string): boolean {
    
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
      
 
            respomse = true;
            localStorage.setItem("dropdownList", this.dropdownList);

            this.sendMessage.changeMessage( 'Message for transaction:' + this.currentValueTosend + '-'
            + this.currentValueToReceive + '-' + this.rate + '-' 
                    + this.currencyToSend + '-' + this.currencyToReceive) + '_separeItems_' + this.dropdownList;
            if ( this.currentValueTosend  < 5 || this.currentValueTosend  > 999 ) {
                this.amountToSendError = true;
            }else{

                this.amountToSendError = false;
                localStorage.setItem("recipient", this.recipient);
                localStorage.setItem("recipientMobile", this.recipientMobile);        
                let link = ['/confirmTransaction'];
                this.spinner.show();
                setTimeout(() => {
                  /** spinner ends after 2 seconds */
                  localStorage.removeItem('messageForTransaction');
                  this.spinner.hide();
                  this.router.navigate(link);
                  //this.unsuscribe();
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

  
  selectElement(event:any): void {
    this.indicatifPays = event.target.value;
  }

}
