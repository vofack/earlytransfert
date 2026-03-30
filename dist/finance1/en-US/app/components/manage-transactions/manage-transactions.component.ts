import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Beneficiary } from 'src/app/models/beneficiary';
import { AdminMessage } from 'src/app/models/admin-message';
import { KycVerification } from 'src/app/models/kyc-verification';
import { DataService } from 'src/app/services/data.service';
import { CustomizedCellComponentComponent } from '../customized-cell-component/customized-cell-component.component';
import { DeleteRendererComponent } from '../delete-renderer/delete-renderer.component';
import { EditRendererComponent } from '../edit-renderer/edit-renderer.component';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { CheckboxCellComponent } from '../checkbox-cell/checkbox-cell.component';
import { Transaction } from 'src/app/models/transaction';
import { DeleteTransactionComponent } from '../delete-transaction/delete-transaction.component';
import { Subscription } from 'rxjs';
import { SelectionChangedEvent } from 'ag-grid-community';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-manage-transactions',
  templateUrl: './manage-transactions.component.html',
  styleUrls: ['./manage-transactions.component.scss'],
  encapsulation: ViewEncapsulation.None // take the style of the modal popup in considaration
})
export class ManageTransactionsComponent implements OnInit {

  private getavailablePaySuscribtions: Subscription;
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
  frameworkComponents: { editRenderer: typeof EditRendererComponent; deleteRenderer: typeof DeleteTransactionComponent; customizedCell: typeof CustomizedCellComponentComponent;};
  enableEmail: boolean;
  enableNom: boolean;
  enablePrenom: boolean;
  enableCountry: boolean;
  enableTown: boolean;
  enableTelephone: boolean;
  enableAmount: boolean;
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
  amount = '';

  // ── KYC TAB ──
  activeTab: 'transactions' | 'kyc' | 'messages' = 'transactions';
  kycColumnDefs: any;
  kycColumnDefsXs: any;
  kycRowData: KycVerification[] = [];
  kycGridParams: any;
  selectedKyc: KycVerification = null;
  rejectionReason = '';
  pendingKycCount = 0;
  private kycSubscription: Subscription;
  @ViewChild('templateKycDetail', { read: TemplateRef }) templateKycDetail: TemplateRef<any>;
  @ViewChild('templateReject', { read: TemplateRef }) templateReject: TemplateRef<any>;

  // ── MESSAGES TAB ──
  messagesColumnDefs: any;
  messagesRowData: AdminMessage[] = [];
  messagesGridParams: any;
  selectedMessage: AdminMessage = null;
  private messagesSubscription: Subscription;
  messageForm: AdminMessage = { messageEn: '', messageFr: '', isActive: true, type: 'info', targetUserEmail: '' };
  isEditingMessage = false;
  @ViewChild('templateAddMessage', { read: TemplateRef }) templateAddMessage: TemplateRef<any>;

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
                    field: 'Enable', cellRenderer: 'customizedCell',
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
                    field: 'delete',cellRenderer: 'deleteRenderer',
                    headerClass: 'my-header-class',
                    onClick: this.onClickDelete.bind(this),
                    width: 120,
                    resizable: true
                  },
                  {
                    headerName: "User Email",
                    field: "userEmail",
                    width: 186,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc","desc"]
                  },
                  {
                    headerName: "Transaction code",
                    field: "id",
                    width: 186,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc","desc"]
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: cellClassRules,
                    filter: "agTextColumnFilter",
                    width: 186
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
                  },
                  {
                    headerName: "Sending Country",
                    field: "sendingCountry",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Receiving Country",
                    field: "receivingCountry",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Receiver Number",
                    field: "receiverNumber",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "receivingMethod",
                    field: "receivingMethod",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Sender Number",
                    field: "senderNumber",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Post Owner",
                    field: "isPostWoner",
                    filter: "agTextColumnFilter",
                    width: 120
                  },
                  {
                    headerName: "MarketPlace",
                    field: "isMarketPlace",
                    filter: "agTextColumnFilter",
                    width: 120
                  },
                  {
                    headerName: "Expires At",
                    field: "expires_at",
                    filter: "agTextColumnFilter",
                    width: 150
                  }
                ];
            
                this.columnDefsXs = [
            
                  {
                    headerName: "Transaction code",
                    field: "id",
                    width: 150,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc","desc"]
                  },
                  {
                    headerName: "Receiver",
                    field: "receiver",
                    filter: 'agTextColumnFilter',
                    width: 150
                  },
                  {
                    headerName: "Amout Send",
                    field: "amountSend",
                    filter: "agTextColumnFilter",
                    width: 150,
                    sortingOrder: ["asc",null]
                  },
                  {
                    headerName: "Amout Receive",
                    field: "amountReceive",
                    filter: "agTextColumnFilter",
                    width: 150,
                    sortingOrder: ["asc"]
                  },
                  {
                    headerName: "Date",
                    field: "date",
                    width: 150
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: cellClassRules,
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Sending Country",
                    field: "sendingCountry",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Receiving Country",
                    field: "receivingCountry",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Receiver Number",
                    field: "receiverNumber",
                    filter: "agTextColumnFilter",
                    width: 150
                  },
                  {
                    headerName: "Sender Number",
                    field: "senderNumber",
                    filter: "agTextColumnFilter",
                    width: 150
                  }
                ];
                this.sortingOrder = ["desc", "asc", null];
            
                this.frameworkComponents = {
                  editRenderer: EditRendererComponent,
                  deleteRenderer: DeleteTransactionComponent,
                  customizedCell: CustomizedCellComponentComponent
                }

                // ── KYC COLUMN DEFS ──
                const kycCellClassRules = {
                  "cell-verified": params => params.value === 'verified',
                  "cell-rejected": params => params.value === 'rejected',
                  "cell-pending": params => params.value === 'pending'
                };

                this.kycColumnDefs = [
                  {
                    headerName: "User Email",
                    field: "userEmail",
                    width: 220,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc","desc"]
                  },
                  {
                    headerName: "Name",
                    field: "extractedName",
                    width: 160,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Document #",
                    field: "extractedDocumentNumber",
                    width: 160,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: kycCellClassRules,
                    filter: "agTextColumnFilter",
                    width: 130
                  },
                  {
                    headerName: "Submitted",
                    field: "submittedAt",
                    width: 180,
                    filter: "agTextColumnFilter",
                    valueFormatter: (params) => {
                      if (!params.value) return '';
                      return new Date(params.value).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  },
                  {
                    headerName: "Verified At",
                    field: "verifiedAt",
                    width: 180,
                    filter: "agTextColumnFilter",
                    valueFormatter: (params) => {
                      if (!params.value) return '';
                      return new Date(params.value).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  },
                  {
                    headerName: "Rejection Reason",
                    field: "rejectionReason",
                    width: 200,
                    filter: "agTextColumnFilter"
                  }
                ];

                this.kycColumnDefsXs = [
                  {
                    headerName: "Email",
                    field: "userEmail",
                    width: 150,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: kycCellClassRules,
                    filter: "agTextColumnFilter",
                    width: 100
                  },
                  {
                    headerName: "Name",
                    field: "extractedName",
                    width: 120,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Submitted",
                    field: "submittedAt",
                    width: 130,
                    filter: "agTextColumnFilter"
                  }
                ];

                // ── MESSAGES COLUMN DEFS ──
                const msgActiveCellClassRules = {
                  "cell-verified": params => params.value === true,
                  "cell-rejected": params => params.value === false
                };

                this.messagesColumnDefs = [
                  {
                    headerName: "Message (EN)",
                    field: "messageEn",
                    width: 280,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Message (FR)",
                    field: "messageFr",
                    width: 280,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Type",
                    field: "type",
                    width: 100,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Target User",
                    field: "targetUserEmail",
                    width: 220,
                    filter: "agTextColumnFilter",
                    valueFormatter: params => params.value || 'All Users'
                  },
                  {
                    headerName: "Active",
                    field: "isActive",
                    width: 100,
                    cellClassRules: msgActiveCellClassRules,
                    valueFormatter: params => params.value ? 'Yes' : 'No'
                  },
                  {
                    headerName: "Created",
                    field: "createdAt",
                    width: 180,
                    filter: "agTextColumnFilter",
                    valueFormatter: (params) => {
                      if (!params.value) return '';
                      return new Date(params.value).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  }
                ];

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

  unsuscribe(): void {
    if(this.getavailablePaySuscribtions) {
      this.getavailablePaySuscribtions.unsubscribe();
    }
    if(this.kycSubscription) {
      this.kycSubscription.unsubscribe();
    }
    if(this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  onGridReady(params) {
    this.params = params;
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
   this.getTransactions(localStorage.getItem('user'));

  }

  getTransactions(email: string) {
  
    this.data._getAlltransactions().subscribe(res => {
      let transactionsList = [];
      this.allTransactionsList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        transactionsList.push(data);
        return data;
      });
      this.params.api.setRowData( transactionsList);
      this.rowData =  transactionsList;
    }, err => {
      console.log('Error while fetching Transactions data');
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
   
    this.getPay();
    
  }

  getPay(): void {
    this.getavailablePaySuscribtions = this.data.getPay().subscribe(res => { 
      this.amount = '';
      const reverse =  (res[0]['amount']).toString().split('').reverse().join(''); 
      const chars = [...reverse.toString()];
      for (var i = 0; i < chars.length; i++) {
        if ((i + 1) % 3 === 0 && i + 1 !== 0) {
           this.amount = chars[i] + this.amount;
           this.amount = ' ' + this.amount;
        }else{
          this.amount = chars[i] + this.amount;
        }
      }
      
      }, err => {
        console.log('Error while fetching pay');
        console.log(err);
        this.unsuscribe();
    });
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
    this.enableAmount = false;
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


  modifier(Inputsolde): void {
      this.reinitialiseError();

      if ( Inputsolde.value.length == 0 ) {

          if (Inputsolde.value.length == 0) this.enableAmount = true;
          this.toastr.error('Erreur de validation','Ajout', {progressBar: true,
            toastClass: 'toast-custom', closeButton: true,
            positionClass: 'toast-bottom-left'});

      }else{

            let Inputsolde_ = Inputsolde.value.toString().trim();
            this.toastr.success('Modification avec succes','Early Transfer', {progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000});
            this.modalRef.hide(); // pour fermer le popup

            setTimeout(() => {
              this.data.updatePay("mg6GHY8RPYCo7KzHobR2", Number(Inputsolde_));
            }, 3500);
      }
  }

  // ── KYC MANAGEMENT ──

  switchTab(tab: 'transactions' | 'kyc' | 'messages') {
    this.activeTab = tab;
    this.selectedKyc = null;
    this.selectedMessage = null;
  }

  onKycRowClicked(event) {
    this.selectedKyc = event.data as KycVerification;
  }

  onKycRowDoubleClicked(event) {
    this.selectedKyc = event.data as KycVerification;
    this.openKycDetailModal(this.templateKycDetail, this.selectedKyc);
  }

  onKycGridReady(params) {
    this.kycGridParams = params;
    this.getKycVerifications();
  }

  getKycVerifications() {
    this.kycSubscription = this.data.getAllKycVerifications().subscribe(res => {
      const kycList: KycVerification[] = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;
        return data as KycVerification;
      });
      this.kycRowData = kycList;
      this.pendingKycCount = kycList.filter(k => k.status === 'pending').length;
      if (this.kycGridParams) {
        this.kycGridParams.api.setRowData(kycList);
      }
    }, err => {
      console.log('Error while fetching KYC verifications');
    });
  }

  openKycDetailModal(template: TemplateRef<any>, kyc: KycVerification) {
    this.selectedKyc = kyc;
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  approveKyc(kyc: KycVerification) {
    this.spinner.show();
    this.data.approveKyc(kyc.id).then(() => {
      return this.data.updateUserKycStatus(kyc.userEmail, 'verified');
    }).then(() => {
      this.spinner.hide();
      this.toastr.success('KYC approved successfully', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
      if (this.modalRef) this.modalRef.hide();
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to approve KYC', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Approve KYC error:', err);
    });
  }

  setKycPending(kyc: KycVerification) {
    this.spinner.show();
    this.data.setKycPending(kyc.id).then(() => {
      return this.data.updateUserKycStatus(kyc.userEmail, 'pending');
    }).then(() => {
      this.spinner.hide();
      this.toastr.success('KYC set back to pending', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
      if (this.modalRef) this.modalRef.hide();
      this.selectedKyc = null;
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update KYC status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Set KYC pending error:', err);
    });
  }

  openRejectModal(template: TemplateRef<any>, kyc: KycVerification) {
    this.selectedKyc = kyc;
    this.rejectionReason = '';
    if (this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
  }

  rejectKyc() {
    if (!this.rejectionReason.trim()) {
      this.toastr.error('Please provide a rejection reason', 'Validation', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      return;
    }
    this.spinner.show();
    this.data.rejectKyc(this.selectedKyc.id, this.rejectionReason.trim()).then(() => {
      return this.data.updateUserKycStatus(this.selectedKyc.userEmail, 'rejected');
    }).then(() => {
      this.spinner.hide();
      this.modalRef.hide();
      this.toastr.success('KYC rejected', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to reject KYC', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Reject KYC error:', err);
    });
  }

  // ── MESSAGES MANAGEMENT ──

  onMessagesGridReady(params) {
    this.messagesGridParams = params;
    this.getAdminMessages();
  }

  onMessagesRowClicked(event) {
    this.selectedMessage = event.data as AdminMessage;
  }

  getAdminMessages() {
    this.messagesSubscription = this.data.getAllAdminMessages().subscribe(res => {
      const list: AdminMessage[] = res.map((e: any) => {
        const d = e.payload.doc.data();
        d.id = e.payload.doc.id;
        return d as AdminMessage;
      });
      this.messagesRowData = list;
      if (this.messagesGridParams) {
        this.messagesGridParams.api.setRowData(list);
      }
    }, err => {
      console.log('Error fetching admin messages', err);
    });
  }

  openAddMessageModal(template: TemplateRef<any>, msg?: AdminMessage) {
    if (msg) {
      this.isEditingMessage = true;
      this.messageForm = { ...msg, targetUserEmail: msg.targetUserEmail || '' };
    } else {
      this.isEditingMessage = false;
      this.messageForm = { messageEn: '', messageFr: '', isActive: true, type: 'info', targetUserEmail: '' };
    }
    this.modalRef = this.modalService.show(template);
  }

  saveMessage() {
    if (!this.messageForm.messageEn.trim() || !this.messageForm.messageFr.trim()) {
      this.toastr.error('Both English and French messages are required', 'Validation', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      return;
    }
    this.spinner.show();
    const action: Promise<any> = this.isEditingMessage
      ? this.data.updateAdminMessage(this.messageForm.id, {
          messageEn: this.messageForm.messageEn,
          messageFr: this.messageForm.messageFr,
          isActive: this.messageForm.isActive,
          type: this.messageForm.type,
          targetUserEmail: this.messageForm.targetUserEmail || ''
        })
      : this.data.addAdminMessage({ ...this.messageForm });

    action.then(() => {
      this.spinner.hide();
      this.modalRef.hide();
      this.selectedMessage = null;
      this.toastr.success(
        this.isEditingMessage ? 'Message updated successfully' : 'Message added successfully',
        'Early Transfer',
        { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000 }
      );
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to save message', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Save message error:', err);
    });
  }

  deleteMessage() {
    if (!this.selectedMessage) return;
    this.spinner.show();
    this.data.deleteAdminMessage(this.selectedMessage.id).then(() => {
      this.spinner.hide();
      this.selectedMessage = null;
      this.toastr.success('Message deleted', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to delete message', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Delete message error:', err);
    });
  }

  toggleMessageActive() {
    if (!this.selectedMessage) return;
    this.spinner.show();
    this.data.updateAdminMessage(this.selectedMessage.id, { isActive: !this.selectedMessage.isActive }).then(() => {
      this.spinner.hide();
      this.toastr.success(
        `Message ${this.selectedMessage.isActive ? 'deactivated' : 'activated'}`,
        'Early Transfer',
        { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000 }
      );
      this.selectedMessage = null;
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update message', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Toggle message error:', err);
    });
  }

}
