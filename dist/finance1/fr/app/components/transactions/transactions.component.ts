import { Component, HostListener, OnInit, TemplateRef, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Beneficiary } from 'src/app/models/beneficiary';
import { DataService } from 'src/app/services/data.service';
import { CustomizedCellComponentComponent } from '../customized-cell-component/customized-cell-component.component';
import { DeleteRendererComponent } from '../delete-renderer/delete-renderer.component';
import { EditRendererComponent } from '../edit-renderer/edit-renderer.component';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { CheckboxCellComponent } from '../checkbox-cell/checkbox-cell.component';
import { Subscription } from 'rxjs';
import { ICellRendererParams, SelectionChangedEvent } from 'ag-grid-community';
import { Transaction } from 'src/app/models/transaction';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  encapsulation: ViewEncapsulation.None // take the style of the modal popup in considaration
})
export class TransactionsComponent implements OnInit {

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
  frameworkComponents: { editRenderer: typeof EditRendererComponent; deleteRenderer: typeof DeleteRendererComponent; customizedCell: typeof CustomizedCellComponentComponent;};
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
  allTransactionsList: Transaction[] = [];
  loadingTemplate: string;
  noRowsTemplate: string;
  trackingId: string;
  private getTransactionsSuscribtions: Subscription;
  constructor(private http: HttpClient, private modalService:BsModalService, 
              private toastr: ToastrService, private  spinner: NgxSpinnerService,
              private data: DataService, private router: Router) { 

                const cellClassRules = {
                  "cell-pass": params => params.value === 'COMPLETE',
                  "cell-fail": params => params.value === 'INCOMPLETE',
                  "cell-pending": params => params.value === 'PENDING',
                  "cell-inProgress": params => params.value === 'INPROGRESS'
                };

                
                this.columnDefs = [
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: cellClassRules,
                    filter: "agTextColumnFilter",
                    width: 186
                  },
                  {
                    headerName: "Transaction code", 
                    field: "id",
                    width: 186,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc","desc"],
                    cellRenderer: (params) => 
                        `<a href="/trackingWithId?transaction=${params.data.id}" >${params.data.id}</a>` 
                  },
                  {
                    headerName: "Receiver",
                    field: "receiver",
                    filter: "agTextColumnFilter",
                    width: 186
                  },
                  {
                    headerName: "Amout Send",
                    field: "amountSend",
                    filter: "agTextColumnFilter",
                    width: 186,
                    sortingOrder: ["asc",null]
                  },
                  {
                    headerName: "Amout Receive",
                    field: "amountReceive",
                    filter: "agTextColumnFilter",
                    width: 186,
                    sortingOrder: ["asc"]
                  },
                  {
                    headerName: "Date",
                    field: "date",
                    filter: "agTextColumnFilter",
                    width: 186
                  }
                ];
            
                this.columnDefsXs = [
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: cellClassRules,
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Transaction code", 
                    field: "id",
                    width: 125,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc","desc"],
                    cellRenderer: (params: ICellRendererParams) => 
                        `<a href="/trackingWithId?transaction=${params.data.id}" >${params.data.id}</a>` 
                  },
                  {
                    headerName: "Receiver",
                    field: "receiver",
                    filter: 'agTextColumnFilter',
                    width: 125
                  },
                  {
                    headerName: "Amout Send",
                    field: "amountSend",
                    filter: "agTextColumnFilter",
                    width: 125,
                    sortingOrder: ["asc",null]
                  },
                  {
                    headerName: "Amout Receive",
                    field: "amountReceive",
                    filter: "agTextColumnFilter",
                    width: 125,
                    sortingOrder: ["asc"]
                  },
                  {
                    headerName: "Date",
                    field: "date",
                    filter: "agTextColumnFilter",
                    width: 125
                  }
                ];
                this.sortingOrder = ["desc", "asc", null];
                this.frameworkComponents = {
                  editRenderer: EditRendererComponent,
                  deleteRenderer: DeleteRendererComponent,
                  customizedCell: CustomizedCellComponentComponent
                }
            
                this.loadingTemplate =
                `<span class="ag-overlay-loading-center">loading...</span>`;
              this.noRowsTemplate =
                `<strong>No transactions</strong>`;

  }

  onClickEdit(params) {
    //code ne fonstionne pas encore, faudrait trouver comment le faire 
  }
    
  onClickDelete(params) {
      //code ne fonstionne pas encore, faudrait trouver comment le faire
  }

  onClickSelected(params) {
 //code ne fonstionne pas encore, faudrait trouver comment le faire
  }

 onSelectionChanged(event: SelectionChangedEvent) {
    const selectedData = this.gridApi.getSelectedRows();
  }

  onGridReady(params) {
    
    this.params = params;
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;   
   this.getTransactions(localStorage.getItem('user'));
  }

  getTransactions(email: string) {
  
    this.getTransactionsSuscribtions = this.data.getAlltransactions().subscribe(res => {
      let transactionsList = [];
      this.allTransactionsList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        if (data.userEmail === email) transactionsList.push(data);
        return data;
      });
      this.params.api.setRowData( transactionsList);
      this.rowData =  transactionsList;
    }, err => {
      console.log('Error while fetching Transactions data');
      this.unsuscribe();
    })
  
  }

  unsuscribe(): void {
    if (this.getTransactionsSuscribtions) { 
      this.getTransactionsSuscribtions.unsubscribe();
    }
  }

  ngOnInit(): void {
    
    if(localStorage.getItem('user')) {

      localStorage.removeItem('messageForTrackingWith'); // remove current tracking id save
      if(window.innerWidth > 500) { 
        this.showXl = true;
        this.showXs = false;
      }else{
        this.showXl = false;
        this.showXs = true;
      }
          
    }else{
      this.reinitialiazeAll();
      let link = ['/'];
      this.router.navigate(link);
    }
  }

  ngOnDestroy() {
    this.unsuscribe();
  }

  reinitialiazeAll(): void {
    localStorage.removeItem('recipient');
    localStorage.removeItem('recipientMobile');
    localStorage.removeItem('recipientEmail');
    localStorage.removeItem("dropdownList"); 
    localStorage.removeItem('messageForTracking');
    localStorage.removeItem('messageForTransaction');
    localStorage.removeItem('messageForTrackingWith');
  }

  getVal(item){

    var rowData_temp = [];
    for (let i = 0; i < this.rowData.length; i++) {
        if ((this.rowData[i].last_name).includes(item.target.value)) rowData_temp.push(this.rowData[i]);
    }
    this.params.api.setRowData(rowData_temp);
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


  ajouter(Inputnom,Inputprenom,InputCountry,InputProvince,InputTown,Inputemail): void {

    this.reinitialiseError();
    if (Inputnom.value.length == 0 || Inputprenom.value.length == 0 ||
        InputCountry.value.length == 0 || InputTown.value.length == 0 ||  
        Inputemail.value.length == 0 || this.mobileValue === '') {


        if (Inputnom.value.length == 0) this.enableNom = true;
        if (Inputprenom.value.length == 0) this.enablePrenom = true;
        if (InputCountry.value.length == 0) this.enableCountry = true;
        if (InputTown.value.length == 0) this.enableTown = true;
        if (this.mobileValue === '') this.enableTelephone = true;
        if (Inputemail.value.length == 0) this.enableEmail = true;
        this.toastr.error('Erreur de validation','Ajout', {progressBar: true, 
          toastClass: 'toast-custom', closeButton: true,
          positionClass: 'toast-bottom-left'});
        
    }else{

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
          this.beneficiaryObj.mobile = this.mobileValue;
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

  public exportAsExcelFile(): void {
    let excelFileName = 'TransactionsHistory';
    this.toastr.success('Telechargement en cours d\'execution','Early Transfer', {progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000});

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.rowData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }, 3000);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  goToTransaction() {
    this.router.navigate(
      ['/trackingWithId'],
      {queryParams: { transaction: this.trackingId } }
      );
  }

}
