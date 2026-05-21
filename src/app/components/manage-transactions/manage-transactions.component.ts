import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Beneficiary } from 'src/app/models/beneficiary';
import { AdminMessage } from 'src/app/models/admin-message';
import { WalletAccount } from 'src/app/models/wallet-account';
import { InteracEmail } from 'src/app/models/interac-email';
import { IssueReport } from 'src/app/models/issue-report';
import { DepositIssueReport } from 'src/app/models/deposit-issue-report';
import { KycVerification } from 'src/app/models/kyc-verification';
import { ForeignBillPaymentRequest } from 'src/app/models/foreign-bill-payment-request';
import { DataService } from 'src/app/services/data.service';
import { CustomizedCellComponentComponent } from '../customized-cell-component/customized-cell-component.component';
import { DeleteRendererComponent } from '../delete-renderer/delete-renderer.component';
import { EditRendererComponent } from '../edit-renderer/edit-renderer.component';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { CheckboxCellComponent } from '../checkbox-cell/checkbox-cell.component';
import { Transaction } from 'src/app/models/transaction';
import { PushNotification } from 'src/app/models/push-notification';
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
  activeTab: 'transactions' | 'kyc' | 'messages' | 'wallets' | 'interac' | 'issues' | 'deposit_issues' | 'notifications' | 'foreign_bills' = 'transactions';
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

  // ── WALLETS TAB ──
  walletColumnDefs: any;
  walletRowData: WalletAccount[] = [];
  walletGridParams: any;
  selectedWallet: WalletAccount = null;
  private walletSubscription: Subscription;
  walletNewAmount: number = 0;
  @ViewChild('templateEditWallet', { read: TemplateRef }) templateEditWallet: TemplateRef<any>;

  // ── INTERAC EMAILS TAB ──
  interacColumnDefs: any;
  interacRowData: InteracEmail[] = [];
  interacGridParams: any;
  selectedInteracEmail: InteracEmail = null;
  private interacSubscription: Subscription;
  newInteracCount = 0;
  interacChecking = false;
  // State for the "Mark Processed" → credit-wallet confirmation flow.
  pendingInteracCredit: { wallet: WalletAccount; amount: number; amountStr: string; newBalance: number } | null = null;
  // State for the symmetric reversal flow when an email leaves the 'processed'
  // state (Back to New / Mark Ignored): debits the previously credited amount
  // from the wallet.
  pendingInteracReversal: { wallet: WalletAccount; amount: number; amountStr: string; newBalance: number; targetStatus: 'new' | 'ignored' } | null = null;
  @ViewChild('templateInteracCreditConfirm', { read: TemplateRef }) templateInteracCreditConfirm: TemplateRef<any>;
  @ViewChild('templateInteracReversalConfirm', { read: TemplateRef }) templateInteracReversalConfirm: TemplateRef<any>;

  // ── ISSUES TAB ──
  issuesColumnDefs: any;
  issuesRowData: IssueReport[] = [];
  issuesGridParams: any;
  selectedIssue: IssueReport = null;
  private issuesSubscription: Subscription;
  newIssuesCount = 0;
  issuesChecking = false;
  @ViewChild('templateIssueBody', { read: TemplateRef }) templateIssueBody: TemplateRef<any>;

  // ── DEPOSIT ISSUES TAB (Interac / Mobile Money) ──
  depositIssuesColumnDefs: any;
  depositIssuesRowData: DepositIssueReport[] = [];
  depositIssuesGridParams: any;
  selectedDepositIssue: DepositIssueReport = null;
  private depositIssuesSubscription: Subscription;
  newDepositIssuesCount = 0;
  depositTypeFilter: 'all' | 'interac' | 'mobile_money' = 'all';
  @ViewChild('templateDepositIssueBody', { read: TemplateRef }) templateDepositIssueBody: TemplateRef<any>;

  // ── NOTIFICATIONS TAB ──
  notificationColumnDefs: any;
  notificationRowData: PushNotification[] = [];
  notificationGridParams: any;
  private notificationSubscription: Subscription;
  notificationForm: PushNotification = { title: '', body: '', targetEmail: '' };
  notificationTargetType: 'all' | 'specific' = 'all';
  notificationSending = false;
  userEmails: string[] = [];
  selectedTargetEmails: string[] = [];
  emailTypeaheadInput = '';
  private usersSubscription: Subscription;

  // ── FOREIGN BILL PAYMENT REQUESTS TAB ──
  // Requests from users abroad asking a Canada-based agent to pay a local bill.
  foreignBillsColumnDefs: any;
  foreignBillsRowData: ForeignBillPaymentRequest[] = [];
  foreignBillsGridParams: any;
  selectedForeignBill: ForeignBillPaymentRequest = null;
  pendingForeignBillsCount = 0;
  foreignBillRejectionReason = '';
  foreignBillPaidForm = { reference: '', proofUrl: '', note: '' };
  foreignBillUserMessageEnDraft = '';
  foreignBillUserMessageFrDraft = '';
  foreignBillUserMessageSaving = false;
  private foreignBillsSubscription: Subscription;
  @ViewChild('templateForeignBillDetail', { read: TemplateRef }) templateForeignBillDetail: TemplateRef<any>;
  @ViewChild('templateForeignBillReject', { read: TemplateRef }) templateForeignBillReject: TemplateRef<any>;
  @ViewChild('templateForeignBillPaid', { read: TemplateRef }) templateForeignBillPaid: TemplateRef<any>;

  // ── FILTERS ──
  emailFilter = '';
  dateFrom = '';
  dateTo = '';
  @ViewChild('templateInteracBody', { read: TemplateRef }) templateInteracBody: TemplateRef<any>;

  // ── MARKETPLACE POST DETAIL MODAL ──
  // Populated when the admin clicks "View" on a marketplace transaction row
  // so the modal can show the Post, the accepted Proposition, and both linked
  // transactions.
  selectedMarketplacePost: any = null;
  selectedMarketplaceProposition: any = null;
  selectedMarketplaceTransactions: { postSide: any; propositionSide: any } = { postSide: null, propositionSide: null };
  loadingMarketplacePost = false;
  @ViewChild('templatePostDetail', { read: TemplateRef }) templatePostDetail: TemplateRef<any>;

  // ── GROUP-BY-POST (Transactions tab) ──
  // ag-grid Community doesn't support true row grouping, so we emulate it by
  // re-sorting marketplace rows into post-bucketed clusters and painting each
  // cluster with an alternating pastel band via getRowStyle.
  groupByPost = false;
  private _postGroupColors = new Map<string, string>();
  private readonly _postGroupPalette = ['#EEF2FF', '#FFF7ED', '#ECFDF5', '#FDF2F8'];

  // Tells ag-grid which rows should render as a single full-width cell.
  isFullWidthCell = (rowNode: any) => !!(rowNode && rowNode.data && rowNode.data.__isGroupHeader);

  // Plain-JS cell renderer for the synthetic "Post XYZ — N transactions"
  // header rows injected at the top of each marketplace cluster.
  fullWidthCellRenderer = class {
    private eGui: HTMLElement;
    private btn: HTMLButtonElement | null = null;
    private onClick: (() => void) | null = null;
    init(params: any) {
      const data = params && params.data ? params.data : {};
      const color = data.__bgColor || '#EEF2FF';
      const postId = data.postId || '';
      const count = data.__count || 0;
      this.eGui = document.createElement('div');
      this.eGui.className = 'post-group-header-row';
      this.eGui.style.cssText =
        'display:flex;align-items:center;gap:10px;width:100%;height:100%;' +
        'padding:0 14px;background:' + color + ';' +
        'border-left:4px solid #4F46E5;font-weight:600;box-sizing:border-box;';
      this.eGui.innerHTML =
        '<i class="fa fa-layer-group" style="color:#4F46E5;"></i>' +
        '<span>Post <code style="background:rgba(79,70,229,0.12);padding:2px 6px;border-radius:4px;font-weight:600;">' +
          postId +
        '</code></span>' +
        '<span style="color:#6B7280;font-weight:500;">' + count + ' transaction' + (count === 1 ? '' : 's') + '</span>' +
        '<button type="button" class="btn btn-sm btn-outline-primary" style="padding:2px 10px;margin-left:auto;">View Post</button>';
      this.btn = this.eGui.querySelector('button');
      if (this.btn && typeof data.__openPostDetail === 'function' && data.__refTransaction) {
        this.onClick = () => data.__openPostDetail(data.__refTransaction);
        this.btn.addEventListener('click', this.onClick);
      }
    }
    getGui() { return this.eGui; }
    destroy() {
      if (this.btn && this.onClick) {
        this.btn.removeEventListener('click', this.onClick);
      }
    }
  };

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
                  },
                  {
                    headerName: "Post",
                    field: "postId",
                    width: 110,
                    filter: false,
                    sortable: false,
                    cellRenderer: (params: any) => {
                      if (!params.data?.isMarketPlace || !params.data?.postId) return '';
                      return '<button class="btn btn-sm btn-outline-primary" style="padding: 2px 10px;">View Post</button>';
                    },
                    onCellClicked: (params: any) => {
                      if (params.data?.isMarketPlace && params.data?.postId) {
                        this.openPostDetailModal(params.data);
                      }
                    }
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
                  },
                  {
                    headerName: "Post",
                    field: "postId",
                    width: 110,
                    filter: false,
                    sortable: false,
                    cellRenderer: (params: any) => {
                      if (!params.data?.isMarketPlace || !params.data?.postId) return '';
                      return '<button class="btn btn-sm btn-outline-primary" style="padding: 2px 10px;">View</button>';
                    },
                    onCellClicked: (params: any) => {
                      if (params.data?.isMarketPlace && params.data?.postId) {
                        this.openPostDetailModal(params.data);
                      }
                    }
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

                // ── WALLETS COLUMN DEFS ──
                this.walletColumnDefs = [
                  {
                    headerName: "User Email",
                    field: "usersEmail",
                    width: 240,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc", "desc"]
                  },
                  {
                    headerName: "Currency",
                    field: "currency",
                    width: 100,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Country",
                    field: "countryCode",
                    width: 100,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Balance",
                    field: "amount",
                    width: 130,
                    filter: "agNumberColumnFilter",
                    sortingOrder: ["desc", "asc"],
                    valueFormatter: (params) => {
                      const val = params.value ?? 0;
                      return Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
                    }
                  },
                  {
                    headerName: "Interac / Mobile Money",
                    field: "interacEmail",
                    width: 220,
                    filter: "agTextColumnFilter",
                    valueFormatter: (params) => {
                      return params.value || params.data?.mobileMoney || '—';
                    }
                  },
                  {
                    headerName: "Label",
                    field: "label",
                    width: 120,
                    filter: "agTextColumnFilter"
                  }
                ];

                // ── INTERAC EMAILS COLUMN DEFS ──
                const interacStatusCellClassRules = {
                  "cell-pass": params => params.value === 'processed',
                  "cell-fail": params => params.value === 'ignored',
                  "cell-pending": params => params.value === 'new'
                };

                this.interacColumnDefs = [
                  {
                    headerName: "From",
                    field: "from",
                    width: 220,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc", "desc"]
                  },
                  {
                    headerName: "User Email",
                    field: "userEmail",
                    width: 220,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Sender Name",
                    field: "senderName",
                    width: 160,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Subject",
                    field: "subject",
                    width: 300,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Amount",
                    field: "amount",
                    width: 120,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Date",
                    field: "date",
                    width: 180,
                    filter: "agTextColumnFilter",
                    sort: 'desc',
                    valueFormatter: (params) => {
                      if (!params.value) return '';
                      return new Date(params.value).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: interacStatusCellClassRules,
                    filter: "agTextColumnFilter",
                    width: 120,
                    valueFormatter: params => (params.value || '').toUpperCase()
                  },
                  {
                    headerName: "Snippet",
                    field: "snippet",
                    width: 300,
                    filter: "agTextColumnFilter"
                  }
                ];

                // ── ISSUES COLUMN DEFS ──
                const issueStatusCellClassRules = {
                  "cell-pass": params => params.value === 'resolved',
                  "cell-fail": params => params.value === 'ignored',
                  "cell-pending": params => params.value === 'new'
                };

                this.issuesColumnDefs = [
                  {
                    headerName: "From",
                    field: "from",
                    width: 220,
                    filter: "agTextColumnFilter",
                    sortingOrder: ["asc", "desc"]
                  },
                  {
                    headerName: "Sender Name",
                    field: "senderName",
                    width: 160,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Subject",
                    field: "subject",
                    width: 300,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Date",
                    field: "date",
                    width: 180,
                    filter: "agTextColumnFilter",
                    sort: 'desc',
                    valueFormatter: (params) => {
                      if (!params.value) return '';
                      return new Date(params.value).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: issueStatusCellClassRules,
                    filter: "agTextColumnFilter",
                    width: 120,
                    valueFormatter: params => (params.value || '').toUpperCase()
                  },
                  {
                    headerName: "Snippet",
                    field: "snippet",
                    width: 300,
                    filter: "agTextColumnFilter"
                  }
                ];

                // ── DEPOSIT ISSUES COLUMN DEFS ──
                const depositIssueStatusCellClassRules = {
                  "cell-pass": params => params.value === 'resolved',
                  "cell-fail": params => params.value === 'ignored',
                  "cell-pending": params => params.value === 'new'
                };

                this.depositIssuesColumnDefs = [
                  {
                    headerName: "User",
                    field: "userEmail",
                    width: 220,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Type",
                    field: "depositType",
                    width: 140,
                    filter: "agTextColumnFilter",
                    valueFormatter: params =>
                      params.value === 'interac' ? 'INTERAC' :
                      params.value === 'mobile_money' ? 'Mobile Money' : (params.value || '')
                  },
                  {
                    headerName: "Country",
                    field: "countryCode",
                    width: 100,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Sender Contact",
                    field: "senderContact",
                    width: 220,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Message",
                    field: "message",
                    width: 300,
                    filter: "agTextColumnFilter",
                    valueFormatter: params => {
                      const v = params.value || '';
                      return v.length > 80 ? v.slice(0, 80) + '…' : v;
                    }
                  },
                  {
                    headerName: "Attachments",
                    field: "attachmentCount",
                    width: 110
                  },
                  {
                    headerName: "Date",
                    field: "date",
                    width: 180,
                    filter: "agTextColumnFilter",
                    sort: 'desc',
                    valueFormatter: (params) => {
                      if (!params.value) return '';
                      return new Date(params.value).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: depositIssueStatusCellClassRules,
                    filter: "agTextColumnFilter",
                    width: 120,
                    valueFormatter: params => (params.value || '').toUpperCase()
                  }
                ];

                // ── FOREIGN BILL PAYMENT REQUESTS COLUMN DEFS ──
                const foreignBillCellClassRules = {
                  "cell-pending": params => params.value === 'pending',
                  "cell-verified": params => params.value === 'paid' || params.value === 'reimbursed',
                  "cell-rejected": params => params.value === 'rejected',
                };

                this.foreignBillsColumnDefs = [
                  {
                    headerName: "User Email",
                    field: "userEmail",
                    width: 220,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Bill Type",
                    field: "billType",
                    width: 130,
                    valueFormatter: params => {
                      switch ((params.value || '').toString()) {
                        case 'tuition': return 'Tuition';
                        case 'subscription': return 'Subscription';
                        case 'service': return 'Service';
                        case 'other': return 'Other';
                        default: return params.value;
                      }
                    }
                  },
                  {
                    headerName: "Provider",
                    field: "providerName",
                    width: 200,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Reference",
                    field: "accountReference",
                    width: 160
                  },
                  {
                    headerName: "Amount",
                    field: "amount",
                    width: 120,
                    valueFormatter: params => params.value != null ? `${Number(params.value).toFixed(2)} CAD` : ''
                  },
                  {
                    headerName: "Commission",
                    field: "commission",
                    width: 130,
                    valueFormatter: params => params.value != null ? `${Number(params.value).toFixed(2)} CAD` : ''
                  },
                  {
                    headerName: "Total",
                    field: "estimatedTotal",
                    width: 120,
                    valueFormatter: params => params.value != null ? `${Number(params.value).toFixed(2)} CAD` : ''
                  },
                  {
                    headerName: "Reimburse via",
                    field: "reimbursementMethod",
                    width: 140,
                    valueFormatter: params => {
                      switch ((params.value || '').toString()) {
                        case 'mobile_money': return 'Mobile Money';
                        case 'interac': return 'Interac';
                        case 'cash': return 'Cash';
                        default: return params.value;
                      }
                    }
                  },
                  {
                    headerName: "Due",
                    field: "dueDate",
                    width: 120
                  },
                  {
                    headerName: "Status",
                    field: "status",
                    cellClassRules: foreignBillCellClassRules,
                    width: 130
                  },
                  {
                    headerName: "Created",
                    field: "createdAt",
                    width: 170,
                    sort: 'desc',
                    valueFormatter: (params) => {
                      const v = params.value;
                      if (!v) return '';
                      // Firestore Timestamp or ISO string
                      const d = v && typeof v.toDate === 'function' ? v.toDate() : new Date(v);
                      if (isNaN(d.getTime())) return '';
                      return d.toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  }
                ];

                // ── NOTIFICATIONS COLUMN DEFS ──
                this.notificationColumnDefs = [
                  {
                    headerName: "Title",
                    field: "title",
                    width: 220,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Message",
                    field: "body",
                    width: 300,
                    filter: "agTextColumnFilter"
                  },
                  {
                    headerName: "Target",
                    field: "targetEmail",
                    width: 220,
                    filter: "agTextColumnFilter",
                    valueFormatter: params => params.value === 'all' ? 'All Users' : params.value
                  },
                  {
                    headerName: "Sent At",
                    field: "sentAt",
                    width: 180,
                    filter: "agTextColumnFilter",
                    sort: 'desc',
                    valueFormatter: (params) => {
                      if (!params.value) return '';
                      return new Date(params.value).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    }
                  },
                  {
                    headerName: "Success",
                    field: "successCount",
                    width: 100
                  },
                  {
                    headerName: "Failed",
                    field: "failureCount",
                    width: 100
                  },
                  {
                    headerName: "Total",
                    field: "totalTokens",
                    width: 100
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
    if(this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
    if(this.interacSubscription) {
      this.interacSubscription.unsubscribe();
    }
    if(this.issuesSubscription) {
      this.issuesSubscription.unsubscribe();
    }
    if(this.depositIssuesSubscription) {
      this.depositIssuesSubscription.unsubscribe();
    }
    if(this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if(this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    if(this.foreignBillsSubscription) {
      this.foreignBillsSubscription.unsubscribe();
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
      this._applyTransactionRowData(transactionsList);
    }, err => {
      console.log('Error while fetching Transactions data');
    })
  }

  // ── GROUP-BY-POST helpers ─────────────────────────────────────────────

  // Toggles the group-by-post view. Keeps the original rowData shape —
  // only the order of rows changes, plus a getRowStyle that bands groups
  // with alternating background colors.
  toggleGroupByPost() {
    this.groupByPost = !this.groupByPost;
    this._applyTransactionRowData(this.allTransactionsList || []);
  }

  // Sort rows so marketplace transactions sharing a postId are adjacent and
  // prepend a synthetic full-width header row to each cluster. The header
  // carries enough context (__refTransaction, __openPostDetail) for its
  // "View Post" button to reuse the existing modal flow.
  private _sortRowsGroupedByPost(rows: any[]): any[] {
    const marketplace = rows.filter(r => r && r.isMarketPlace && r.postId);
    const others = rows.filter(r => !(r && r.isMarketPlace && r.postId));

    const buckets = new Map<string, any[]>();
    const order: string[] = [];
    for (const r of marketplace) {
      if (!buckets.has(r.postId)) {
        buckets.set(r.postId, []);
        order.push(r.postId);
      }
      buckets.get(r.postId).push(r);
    }
    for (const pid of order) {
      buckets.get(pid).sort((a, b) => {
        if (a.isPostWoner === b.isPostWoner) return 0;
        return a.isPostWoner ? -1 : 1;
      });
    }
    const openPostDetail = (t: any) => this.openPostDetailModal(t);
    const grouped: any[] = [];
    for (const pid of order) {
      const bucket = buckets.get(pid);
      const refTxn = bucket.find(t => t.isPostWoner) || bucket[0];
      grouped.push({
        __isGroupHeader: true,
        postId: pid,
        __count: bucket.length,
        __refTransaction: refTxn,
        __openPostDetail: openPostDetail,
      });
      grouped.push(...bucket);
    }
    return [...grouped, ...others];
  }

  // Assign a deterministic band color to each postId in display order so
  // adjacent groups are visually distinct. Also stamp the resolved color onto
  // the synthetic header rows so the full-width renderer can paint itself
  // without reading the component state.
  private _refreshPostGroupColors(rows: any[]) {
    this._postGroupColors.clear();
    let idx = 0;
    for (const r of rows) {
      const pid = r && r.postId;
      const isGroupRow = r && (r.__isGroupHeader || (r.isMarketPlace && pid));
      if (isGroupRow && pid && !this._postGroupColors.has(pid)) {
        this._postGroupColors.set(pid, this._postGroupPalette[idx % this._postGroupPalette.length]);
        idx++;
      }
    }
    for (const r of rows) {
      if (r && r.__isGroupHeader && r.postId) {
        r.__bgColor = this._postGroupColors.get(r.postId);
      }
    }
  }

  // Pipe all rowData updates for the transactions grid through here so the
  // grouping state is honored even when the Firestore snapshot re-emits.
  private _applyTransactionRowData(rows: any[]) {
    const list = this.groupByPost ? this._sortRowsGroupedByPost(rows) : rows;
    if (this.groupByPost) {
      this._refreshPostGroupColors(list);
    } else {
      this._postGroupColors.clear();
    }
    this.rowData = list;
    if (this.params && this.params.api) {
      this.params.api.setRowData(list);
    }
  }

  // Bound to [getRowStyle] on the transactions ag-grid. Returns a background
  // color per marketplace-post cluster while grouping is active.
  getTransactionRowStyle = (params: any) => {
    if (!this.groupByPost) return null;
    const d = params && params.data;
    if (!d) return null;
    // Header rows paint themselves via the full-width renderer.
    if (d.__isGroupHeader) return null;
    if (!d.isMarketPlace || !d.postId) return null;
    const color = this._postGroupColors.get(d.postId);
    return color ? { background: color } : null;
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
        const row = this.rowData[i];
        if (row && !row.__isGroupHeader && row.last_name && row.last_name.includes(item.target.value)) rowData_temp.push(row);
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

    const exportRows = (this.rowData || []).filter((r: any) => !(r && r.__isGroupHeader));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportRows);
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

  switchTab(tab: 'transactions' | 'kyc' | 'messages' | 'wallets' | 'interac' | 'issues' | 'deposit_issues' | 'notifications' | 'foreign_bills') {
    this.activeTab = tab;
    this.selectedKyc = null;
    this.selectedMessage = null;
    this.selectedWallet = null;
    this.selectedInteracEmail = null;
    this.selectedIssue = null;
    this.selectedDepositIssue = null;
    this.selectedForeignBill = null;
    this.emailFilter = '';
    this.clearEmailFilter();
    this.clearDateFilter();
  }

  filterByEmail() {
    const gridApi = this.getActiveGridApi();
    const emailField = this.getActiveEmailField();
    if (!gridApi || !emailField) return;

    const filterInstance = gridApi.getFilterInstance(emailField);
    if (filterInstance) {
      if (this.emailFilter.trim()) {
        filterInstance.setModel({
          type: 'contains',
          filter: this.emailFilter.trim()
        });
      } else {
        filterInstance.setModel(null);
      }
      gridApi.onFilterChanged();
    }
  }

  private clearEmailFilter() {
    // Clear filter on all grids
    [this.gridApi, this.kycGridParams?.api, this.messagesGridParams?.api, this.walletGridParams?.api, this.interacGridParams?.api, this.issuesGridParams?.api, this.depositIssuesGridParams?.api, this.notificationGridParams?.api, this.foreignBillsGridParams?.api]
      .filter(api => !!api)
      .forEach(api => {
        const fields = ['userEmail', 'targetUserEmail', 'usersEmail', 'from', 'targetEmail'];
        fields.forEach(f => {
          const fi = api.getFilterInstance(f);
          if (fi) {
            fi.setModel(null);
          }
        });
        api.onFilterChanged();
      });
  }

  private getActiveGridApi() {
    switch (this.activeTab) {
      case 'transactions': return this.gridApi;
      case 'kyc': return this.kycGridParams?.api;
      case 'messages': return this.messagesGridParams?.api;
      case 'wallets': return this.walletGridParams?.api;
      case 'interac': return this.interacGridParams?.api;
      case 'issues': return this.issuesGridParams?.api;
      case 'deposit_issues': return this.depositIssuesGridParams?.api;
      case 'notifications': return this.notificationGridParams?.api;
      case 'foreign_bills': return this.foreignBillsGridParams?.api;
    }
  }

  private getActiveEmailField(): string {
    switch (this.activeTab) {
      case 'transactions': return 'userEmail';
      case 'kyc': return 'userEmail';
      case 'messages': return 'targetUserEmail';
      case 'wallets': return 'usersEmail';
      case 'interac': return 'from';
      case 'issues': return 'from';
      case 'deposit_issues': return 'userEmail';
      case 'notifications': return 'targetEmail';
      case 'foreign_bills': return 'userEmail';
    }
  }

  private getActiveDateField(): string {
    switch (this.activeTab) {
      case 'transactions': return 'date';
      case 'kyc': return 'submittedAt';
      case 'messages': return 'createdAt';
      case 'wallets': return null;
      case 'interac': return 'date';
      case 'issues': return 'date';
      case 'deposit_issues': return 'date';
      case 'notifications': return 'sentAt';
      case 'foreign_bills': return 'createdAt';
    }
  }

  // Bound callbacks for ag-grid external filtering (date range)
  isExternalFilterPresent = (): boolean => {
    return !!(this.dateFrom || this.dateTo);
  }

  doesExternalFilterPass = (node): boolean => {
    if (!this.dateFrom && !this.dateTo) return true;

    // Try all known date fields on the row
    const dateFields = ['date', 'submittedAt', 'createdAt'];
    let val = null;
    for (const f of dateFields) {
      if (node.data[f]) { val = node.data[f]; break; }
    }
    if (!val) return true;

    const rowDate = new Date(val).getTime();
    if (isNaN(rowDate)) return true;

    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      if (rowDate < from) return false;
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo + 'T23:59:59').getTime();
      if (rowDate > to) return false;
    }
    return true;
  }

  filterByDate() {
    // Notify all initialized grids that external filter changed
    [this.gridApi, this.kycGridParams?.api, this.messagesGridParams?.api, this.walletGridParams?.api, this.interacGridParams?.api, this.issuesGridParams?.api, this.depositIssuesGridParams?.api, this.notificationGridParams?.api, this.foreignBillsGridParams?.api]
      .filter(api => !!api)
      .forEach(api => api.onFilterChanged());
  }

  clearDateFilter() {
    this.dateFrom = '';
    this.dateTo = '';
    this.filterByDate();
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

  // ── WALLETS MANAGEMENT ──

  onWalletGridReady(params) {
    this.walletGridParams = params;
    if (!this.walletSubscription) {
      this.getWalletAccounts();
    } else if (this.walletRowData) {
      // Subscription already active (e.g., started by the Interac tab);
      // just push the current data into the grid.
      params.api.setRowData(this.walletRowData);
    }
  }

  onWalletRowClicked(event) {
    this.selectedWallet = event.data as WalletAccount;
  }

  getWalletAccounts() {
    this.walletSubscription = this.data.getAllWalletAccounts().subscribe(res => {
      const list: WalletAccount[] = res.map((e: any) => {
        const d = e.payload.doc.data();
        d.id = e.payload.doc.id;
        return d as WalletAccount;
      });
      this.walletRowData = list;
      if (this.walletGridParams) {
        this.walletGridParams.api.setRowData(list);
      }
      // Wallets feed the "User Email" column on the Interac grid; re-enrich
      // and refresh whenever wallets update.
      this.enrichInteracRowsWithUserEmail();
      if (this.interacGridParams && this.interacRowData) {
        this.interacGridParams.api.setRowData(this.interacRowData);
      }
    }, err => {
      console.log('Error fetching wallet accounts', err);
    });
  }

  openEditWalletModal(template: TemplateRef<any>, wallet: WalletAccount) {
    this.selectedWallet = wallet;
    this.walletNewAmount = wallet.amount;
    this.modalRef = this.modalService.show(template);
  }

  saveWalletAmount() {
    if (this.walletNewAmount == null || isNaN(this.walletNewAmount) || this.walletNewAmount < 0) {
      this.toastr.error('Please enter a valid amount', 'Validation', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      return;
    }
    this.spinner.show();
    this.data.updateWalletAmount(this.selectedWallet.id, Number(this.walletNewAmount)).then(() => {
      this.spinner.hide();
      this.modalRef.hide();
      this.selectedWallet = null;
      this.toastr.success('Wallet balance updated', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update balance', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Update wallet error:', err);
    });
  }

  // ── INTERAC EMAILS MANAGEMENT ──

  onInteracGridReady(params) {
    this.interacGridParams = params;
    this.getInteracEmails();
    // Wallets are needed to resolve userEmail per row. Load them if the
    // wallets tab hasn't been opened yet (otherwise the subscription is
    // already live and will keep enrichment in sync).
    if (!this.walletSubscription) {
      this.getWalletAccounts();
    }
  }

  onInteracRowClicked(event) {
    this.selectedInteracEmail = event.data as InteracEmail;
  }

  onInteracRowDoubleClicked(event) {
    this.selectedInteracEmail = event.data as InteracEmail;
    this.openInteracBodyModal(this.templateInteracBody);
  }

  openInteracBodyModal(template: TemplateRef<any>) {
    if (!this.selectedInteracEmail) return;
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  getInteracEmails() {
    this.interacSubscription = this.data.getAllInteracEmails().subscribe(res => {
      const list: InteracEmail[] = res.map((e: any) => {
        const d = e.payload.doc.data();
        d.id = e.payload.doc.id;
        return d as InteracEmail;
      });
      this.interacRowData = list;
      this.newInteracCount = list.filter(e => e.status === 'new').length;
      this.enrichInteracRowsWithUserEmail();
      if (this.interacGridParams) {
        this.interacGridParams.api.setRowData(this.interacRowData);
      }
    }, err => {
      console.log('Error fetching interac emails', err);
    });
  }

  // Builds two case-normalized indexes over the loaded wallets so we can
  // look up a wallet by interacEmail or usersEmail in O(1).
  private buildWalletIndexes(): { byInterac: Map<string, WalletAccount>; byUserEmail: Map<string, WalletAccount> } {
    const byInterac = new Map<string, WalletAccount>();
    const byUserEmail = new Map<string, WalletAccount>();
    for (const w of (this.walletRowData || [])) {
      if (w.interacEmail) byInterac.set(w.interacEmail.toLowerCase().trim(), w);
      if (w.usersEmail) byUserEmail.set(w.usersEmail.toLowerCase().trim(), w);
    }
    return { byInterac, byUserEmail };
  }

  // Bank notifications often have a `from` that's the bank itself (or a
  // forwarder), not the actual sender — so we first try matching `from`
  // against walletAccount.interacEmail/usersEmail, then fall back to scanning
  // the subject + snippet + body for any email address that matches a wallet.
  private lookupInteracWallet(
    e: InteracEmail,
    byInterac: Map<string, WalletAccount>,
    byUserEmail: Map<string, WalletAccount>
  ): WalletAccount | null {
    const from = (e.from || '').toLowerCase().trim();
    const direct = byInterac.get(from) || byUserEmail.get(from);
    if (direct) return direct;

    const haystack = `${e.subject || ''}\n${e.snippet || ''}\n${e.body || ''}`.toLowerCase();
    const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
    const candidates = haystack.match(emailRegex) || [];
    for (const candidate of candidates) {
      const w = byInterac.get(candidate.trim()) || byUserEmail.get(candidate.trim());
      if (w) return w;
    }
    return null;
  }

  // Called both when interac rows arrive and when wallets reload, so the
  // "User Email" column stays in sync regardless of which finishes first.
  private enrichInteracRowsWithUserEmail() {
    if (!this.interacRowData || !this.walletRowData) return;
    const { byInterac, byUserEmail } = this.buildWalletIndexes();
    for (const e of this.interacRowData) {
      const wallet = this.lookupInteracWallet(e, byInterac, byUserEmail);
      (e as any).userEmail = wallet ? wallet.usersEmail : '';
    }
  }

  // Resolves the wallet for the currently selected Interac email using the
  // same matching rules as the column. Used by the Mark Processed / Back to
  // New flows so they stay consistent with what the admin sees.
  private resolveWalletForSelectedInterac(): WalletAccount | null {
    if (!this.selectedInteracEmail) return null;
    const { byInterac, byUserEmail } = this.buildWalletIndexes();
    return this.lookupInteracWallet(this.selectedInteracEmail, byInterac, byUserEmail);
  }

  markInteracProcessed() {
    if (!this.selectedInteracEmail) return;

    // Re-extract the dollar amount from the email subject (with body fallback,
    // then the value the cloud function pre-extracted at ingest time).
    const amountStr = this.extractInteracAmountString(
      this.selectedInteracEmail.subject,
      this.selectedInteracEmail.body
    ) || (this.selectedInteracEmail.amount || '');
    const amount = this.parseInteracAmount(amountStr);

    if (!amount || amount <= 0) {
      this.toastr.error('Could not extract a dollar amount from the email subject', 'Validation', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      return;
    }

    const wallet = this.resolveWalletForSelectedInterac();
    if (!wallet) {
      this.toastr.error(
        `No wallet found for ${this.selectedInteracEmail.from}`,
        'Validation',
        { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true }
      );
      return;
    }

    const currentBalance = Number(wallet.amount) || 0;
    const newBalance = +(currentBalance + amount).toFixed(2);
    this.pendingInteracCredit = { wallet, amount, amountStr, newBalance };
    this.modalRef = this.modalService.show(this.templateInteracCreditConfirm);
  }

  confirmInteracCredit() {
    if (!this.selectedInteracEmail || !this.pendingInteracCredit) return;
    const { wallet, amount, newBalance } = this.pendingInteracCredit;
    const emailId = this.selectedInteracEmail.id;
    const senderEmail = wallet.usersEmail || this.selectedInteracEmail.from;

    this.spinner.show();
    this.data.updateWalletAmount(wallet.id, newBalance)
      .then(() => this.data.updateInteracEmailStatus(emailId, 'processed'))
      .then(() => {
        this.spinner.hide();
        if (this.modalRef) this.modalRef.hide();
        this.selectedInteracEmail = null;
        this.pendingInteracCredit = null;
        this.toastr.success(
          `$${amount.toFixed(2)} credited to ${senderEmail} (new balance: $${newBalance.toFixed(2)})`,
          'Early Transfer',
          { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 4000 }
        );
      })
      .catch(err => {
        this.spinner.hide();
        this.toastr.error('Failed to process Interac email', 'Error', {
          progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true
        });
        console.log('Confirm interac credit error:', err);
      });
  }

  cancelInteracCredit() {
    this.pendingInteracCredit = null;
    if (this.modalRef) this.modalRef.hide();
  }

  // Matches both English ("$70.00", "$1,000.00") and French-Canadian
  // ("70,00 $", "1 250,00 $") amount formats. Scans the subject first, falls
  // back to the body. Mirrors the regex used by checkInteracEmails Cloud
  // Function so admin re-extraction stays consistent with ingest.
  private extractInteracAmountString(subject: string, body?: string): string {
    const regex = /\$\s*\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{1,2})?|\d{1,3}(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?\s*\$/;
    const subjectMatch = (subject || '').match(regex);
    if (subjectMatch) return subjectMatch[0].trim();
    const bodyMatch = (body || '').match(regex);
    return bodyMatch ? bodyMatch[0].trim() : '';
  }

  // Normalizes an amount string to a Number, handling both decimal conventions:
  //   "$1,000.50" → 1000.5   "1 000,50 $" → 1000.5   "70,00 $" → 70
  // When both "," and "." appear, the rightmost is the decimal separator.
  // When only one appears with 1-2 trailing digits, it's the decimal separator.
  private parseInteracAmount(amountStr: string): number {
    if (!amountStr) return 0;
    let cleaned = amountStr.replace(/\$/g, '').trim();
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (hasComma) {
      const lastIdx = cleaned.lastIndexOf(',');
      const trailing = cleaned.length - lastIdx - 1;
      if (trailing === 1 || trailing === 2) {
        cleaned = cleaned.replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    cleaned = cleaned.replace(/\s/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  markInteracIgnored() {
    if (!this.selectedInteracEmail) return;
    if (this.selectedInteracEmail.status === 'processed') {
      this.openInteracReversalFlow('ignored');
    } else {
      this.justUpdateInteracStatus('ignored', 'Email marked as ignored');
    }
  }

  markInteracNew() {
    if (!this.selectedInteracEmail) return;
    if (this.selectedInteracEmail.status === 'processed') {
      this.openInteracReversalFlow('new');
    } else {
      this.justUpdateInteracStatus('new', 'Email set back to new');
    }
  }

  // Used when no wallet reversal is needed (transitions between non-processed
  // states). Same shape as the original updateStatus flow before the debit
  // logic was added.
  private justUpdateInteracStatus(status: 'new' | 'ignored', successMessage: string) {
    this.spinner.show();
    this.data.updateInteracEmailStatus(this.selectedInteracEmail.id, status).then(() => {
      this.spinner.hide();
      this.selectedInteracEmail = null;
      this.toastr.success(successMessage, 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update email status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Update interac status error:', err);
    });
  }

  // Leaving 'processed' must reverse the previous debit. Re-extracts the
  // amount from the subject and looks up the original wallet, then opens the
  // reversal confirmation modal. If the amount or wallet can't be resolved
  // (e.g. wallet was deleted) the admin is offered a status change without
  // the credit and warned that no reversal happened.
  private openInteracReversalFlow(targetStatus: 'new' | 'ignored') {
    const amountStr = this.extractInteracAmountString(
      this.selectedInteracEmail.subject,
      this.selectedInteracEmail.body
    ) || (this.selectedInteracEmail.amount || '');
    const amount = this.parseInteracAmount(amountStr);

    if (!amount || amount <= 0) {
      this.toastr.warning(
        'No amount could be extracted; status will change but no wallet credit will occur',
        'Validation',
        { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 4000 }
      );
      this.justUpdateInteracStatus(targetStatus, targetStatus === 'new' ? 'Email set back to new' : 'Email marked as ignored');
      return;
    }

    const wallet = this.resolveWalletForSelectedInterac();
    if (!wallet) {
      this.toastr.warning(
        `No wallet found for ${this.selectedInteracEmail.from}; status will change but no debit will occur`,
        'Validation',
        { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 4000 }
      );
      this.justUpdateInteracStatus(targetStatus, targetStatus === 'new' ? 'Email set back to new' : 'Email marked as ignored');
      return;
    }

    const currentBalance = Number(wallet.amount) || 0;
    const newBalance = +(currentBalance - amount).toFixed(2);
    this.pendingInteracReversal = { wallet, amount, amountStr, newBalance, targetStatus };
    this.modalRef = this.modalService.show(this.templateInteracReversalConfirm);
  }

  confirmInteracReversal() {
    if (!this.selectedInteracEmail || !this.pendingInteracReversal) return;
    const { wallet, amount, newBalance, targetStatus } = this.pendingInteracReversal;
    const emailId = this.selectedInteracEmail.id;
    const senderEmail = wallet.usersEmail || this.selectedInteracEmail.from;

    this.spinner.show();
    this.data.updateWalletAmount(wallet.id, newBalance)
      .then(() => this.data.updateInteracEmailStatus(emailId, targetStatus))
      .then(() => {
        this.spinner.hide();
        if (this.modalRef) this.modalRef.hide();
        this.selectedInteracEmail = null;
        this.pendingInteracReversal = null;
        this.toastr.success(
          `$${amount.toFixed(2)} debited from ${senderEmail} (new balance: $${newBalance.toFixed(2)})`,
          'Early Transfer',
          { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 4000 }
        );
      })
      .catch(err => {
        this.spinner.hide();
        this.toastr.error('Failed to reverse Interac email', 'Error', {
          progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true
        });
        console.log('Confirm interac reversal error:', err);
      });
  }

  cancelInteracReversal() {
    this.pendingInteracReversal = null;
    if (this.modalRef) this.modalRef.hide();
  }

  checkInteracEmails() {
    this.interacChecking = true;
    this.http.get(`https://us-central1-dashboard-33d8e.cloudfunctions.net/checkInteracEmails`).subscribe(
      (res: any) => {
        this.interacChecking = false;
        const count = res?.newCount || 0;
        this.toastr.success(`Check complete. ${count} new email(s) found.`, 'Interac Emails', {
          progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true, timeOut: 5000
        });
      },
      err => {
        this.interacChecking = false;
        this.toastr.error('Failed to check emails. Make sure the Cloud Function is deployed.', 'Error', {
          progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true
        });
        console.log('Check interac emails error:', err);
      }
    );
  }

  // ── ISSUES MANAGEMENT ──

  onIssuesGridReady(params) {
    this.issuesGridParams = params;
    this.getIssueReports();
  }

  onIssueRowClicked(event) {
    this.selectedIssue = event.data as IssueReport;
  }

  onIssueRowDoubleClicked(event) {
    this.selectedIssue = event.data as IssueReport;
    this.openIssueBodyModal(this.templateIssueBody);
  }

  openIssueBodyModal(template: TemplateRef<any>) {
    if (!this.selectedIssue) return;
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  // ── MARKETPLACE POST DETAIL ─────────────────────────────────────────────

  // Opens a modal showing the Post, the accepted Proposition, and both
  // linked transactions for a marketplace transaction row.
  openPostDetailModal(transaction: any) {
    if (!transaction?.postId) return;

    this.selectedMarketplacePost = null;
    this.selectedMarketplaceProposition = null;
    this.selectedMarketplaceTransactions = { postSide: null, propositionSide: null };
    this.loadingMarketplacePost = true;

    // Open the modal immediately so the admin sees a loading state.
    this.modalRef = this.modalService.show(this.templatePostDetail, { class: 'modal-lg' });

    this.data.getPostById(transaction.postId).then(post => {
      this.loadingMarketplacePost = false;
      if (!post) {
        this.toastr.warning('The linked post no longer exists.', 'Post not found', {
          progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true
        });
        return;
      }
      this.selectedMarketplacePost = post;

      const propositions: any[] = Array.isArray(post.propositions) ? post.propositions : [];
      // Match the proposition that spawned this transaction. Older records
      // may have been written without `propositionId` — fall back to matching
      // by the accepted proposition's transaction ids.
      this.selectedMarketplaceProposition = propositions.find(p =>
        (transaction.propositionId && p.docId === transaction.propositionId) ||
        (p.idPostTransaction && p.idPostTransaction === transaction.id) ||
        (p.idPropositionTransaction && p.idPropositionTransaction === transaction.id)
      ) || null;

      // Locate both sides of the pair in the already-loaded transaction list
      // so the admin can see the postOwner's and the proposition owner's
      // transactions side by side without another round-trip.
      const all = this.allTransactionsList || [];
      const prop = this.selectedMarketplaceProposition;
      const postTxnId = prop?.idPostTransaction || (transaction.isPostWoner ? transaction.id : '');
      const propTxnId = prop?.idPropositionTransaction || (!transaction.isPostWoner ? transaction.id : '');

      this.selectedMarketplaceTransactions = {
        postSide: all.find(t => t.id === postTxnId) || null,
        propositionSide: all.find(t => t.id === propTxnId) || null,
      };
    }).catch(err => {
      this.loadingMarketplacePost = false;
      console.log('Failed to load linked post:', err);
      this.toastr.error('Could not load linked post.', 'Error', {
        progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true
      });
    });
  }

  getIssueReports() {
    this.issuesSubscription = this.data.getAllIssueReportEmails().subscribe(res => {
      const list: IssueReport[] = res.map((e: any) => {
        const d = e.payload.doc.data();
        d.id = e.payload.doc.id;
        return d as IssueReport;
      });
      this.issuesRowData = list;
      this.newIssuesCount = list.filter(e => e.status === 'new').length;
      if (this.issuesGridParams) {
        this.issuesGridParams.api.setRowData(list);
      }
    }, err => {
      console.log('Error fetching issue reports', err);
    });
  }

  markIssueResolved() {
    if (!this.selectedIssue) return;
    this.spinner.show();
    this.data.updateIssueReportStatus(this.selectedIssue.id, 'resolved').then(() => {
      this.spinner.hide();
      this.selectedIssue = null;
      this.toastr.success('Issue marked as resolved', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update issue status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark issue resolved error:', err);
    });
  }

  markIssueIgnored() {
    if (!this.selectedIssue) return;
    this.spinner.show();
    this.data.updateIssueReportStatus(this.selectedIssue.id, 'ignored').then(() => {
      this.spinner.hide();
      this.selectedIssue = null;
      this.toastr.success('Issue marked as ignored', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update issue status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark issue ignored error:', err);
    });
  }

  markIssueNew() {
    if (!this.selectedIssue) return;
    this.spinner.show();
    this.data.updateIssueReportStatus(this.selectedIssue.id, 'new').then(() => {
      this.spinner.hide();
      this.selectedIssue = null;
      this.toastr.success('Issue set back to new', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update issue status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark issue new error:', err);
    });
  }

  checkIssueReportEmails() {
    this.issuesChecking = true;
    this.http.get(`https://us-central1-dashboard-33d8e.cloudfunctions.net/checkIssueReportEmails`).subscribe(
      (res: any) => {
        this.issuesChecking = false;
        const count = res?.newCount || 0;
        this.toastr.success(`Check complete. ${count} new issue(s) found.`, 'Issue Reports', {
          progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true, timeOut: 5000
        });
      },
      err => {
        this.issuesChecking = false;
        this.toastr.error('Failed to check issue report emails. Make sure the Cloud Function is deployed.', 'Error', {
          progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true
        });
        console.log('Check issue report emails error:', err);
      }
    );
  }

  // ── NOTIFICATIONS MANAGEMENT ──

  onNotificationGridReady(params) {
    this.notificationGridParams = params;
    this.getNotifications();
    this.loadUserEmails();
  }

  getNotifications() {
    this.notificationSubscription = this.data.getAllNotifications().subscribe(res => {
      const list: PushNotification[] = res.map((e: any) => {
        const d = e.payload.doc.data();
        d.id = e.payload.doc.id;
        return d as PushNotification;
      });
      this.notificationRowData = list;
      if (this.notificationGridParams) {
        this.notificationGridParams.api.setRowData(list);
      }
    }, err => {
      console.log('Error fetching notifications', err);
    });
  }

  loadUserEmails() {
    this.usersSubscription = this.data.getAllUsers().subscribe(res => {
      this.userEmails = res.map((e: any) => {
        const data = e.payload.doc.data();
        return data.email;
      }).filter(email => !!email).sort();
    }, err => {
      console.log('Error fetching user emails', err);
    });
  }

  sendNotification() {
    if (!this.notificationForm.title.trim() || !this.notificationForm.body.trim()) {
      this.toastr.error('Title and message are required', 'Validation', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      return;
    }

    if (this.notificationTargetType === 'specific' && this.selectedTargetEmails.length === 0) {
      this.toastr.error('Please select at least one target user', 'Validation', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      return;
    }

    this.notificationSending = true;
    const targetEmails = this.notificationTargetType === 'all' ? ['all'] : [...this.selectedTargetEmails];

    // Send to each selected email (or 'all' once). Use allSettled so a single
    // recipient without an FCM token (common for iOS users who haven't
    // provisioned APNS yet) doesn't abort the whole batch.
    const requests = targetEmails.map(email => {
      const payload = {
        title: this.notificationForm.title.trim(),
        body: this.notificationForm.body.trim(),
        targetEmail: email
      };
      return this.http.post('https://us-central1-dashboard-33d8e.cloudfunctions.net/sendNotification', payload)
        .toPromise()
        .then(res => ({ email, res }));
    });

    Promise.allSettled(requests).then(outcomes => {
      this.notificationSending = false;

      let totalSuccess = 0;
      let totalFail = 0;
      const noTokenEmails: string[] = [];
      const errorMessages: string[] = [];

      outcomes.forEach((outcome, idx) => {
        if (outcome.status === 'fulfilled') {
          const r: any = outcome.value.res;
          totalSuccess += r?.successCount || 0;
          totalFail += r?.failureCount || 0;
        } else {
          const email = targetEmails[idx];
          const reason: any = outcome.reason;
          const errMsg: string = reason?.error?.error || reason?.message || 'Unknown error';
          if (/no FCM token/i.test(errMsg)) {
            noTokenEmails.push(email);
          } else {
            errorMessages.push(`${email}: ${errMsg}`);
          }
          totalFail += 1;
        }
      });

      this.notificationForm = { title: '', body: '', targetEmail: '' };
      this.selectedTargetEmails = [];
      this.emailTypeaheadInput = '';
      this.notificationTargetType = 'all';

      const toastOpts = { progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 6000 };

      if (totalSuccess > 0) {
        let msg = `${totalSuccess} delivered, ${totalFail} failed.`;
        if (noTokenEmails.length) {
          msg += ` ${noTokenEmails.length} user(s) not reachable (no device token yet).`;
        }
        this.toastr.success(msg, 'Notification sent', toastOpts);
      } else if (noTokenEmails.length && errorMessages.length === 0) {
        this.toastr.warning(
          `Recipient(s) not reachable: ${noTokenEmails.join(', ')}. They need to open the mobile app and allow notifications.`,
          'No device token',
          toastOpts
        );
      } else {
        const msg = errorMessages.length
          ? errorMessages.join(' | ')
          : 'Failed to send notification. Make sure the Cloud Function is deployed.';
        this.toastr.error(msg, 'Error', toastOpts);
      }

      if (errorMessages.length || noTokenEmails.length) {
        console.log('Send notification issues:', { errorMessages, noTokenEmails });
      }
    });
  }

  onEmailTypeaheadSelect(match) {
    const email = match.item;
    if (email && !this.selectedTargetEmails.includes(email)) {
      this.selectedTargetEmails.push(email);
    }
    // Clear input after selection (setTimeout to let typeahead finish its cycle)
    setTimeout(() => { this.emailTypeaheadInput = ''; }, 0);
  }

  removeTargetEmail(email: string) {
    this.selectedTargetEmails = this.selectedTargetEmails.filter(e => e !== email);
  }

  // ── DEPOSIT ISSUES MANAGEMENT (Interac / Mobile Money) ──

  onDepositIssuesGridReady(params) {
    this.depositIssuesGridParams = params;
    this.getDepositIssueReports();
  }

  onDepositIssueRowClicked(event) {
    this.selectedDepositIssue = event.data as DepositIssueReport;
  }

  onDepositIssueRowDoubleClicked(event) {
    this.selectedDepositIssue = event.data as DepositIssueReport;
    this.openDepositIssueBodyModal(this.templateDepositIssueBody);
  }

  openDepositIssueBodyModal(template: TemplateRef<any>) {
    if (!this.selectedDepositIssue) return;
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  getDepositIssueReports() {
    this.depositIssuesSubscription = this.data.getAllDepositIssueReports().subscribe(res => {
      const list: DepositIssueReport[] = res.map((e: any) => {
        const d = e.payload.doc.data();
        d.id = e.payload.doc.id;
        return d as DepositIssueReport;
      });
      this.depositIssuesRowData = list;
      this.newDepositIssuesCount = list.filter(e => e.status === 'new').length;
      this.applyDepositIssuesGrid();
    }, err => {
      console.log('Error fetching deposit issue reports', err);
    });
  }

  private applyDepositIssuesGrid() {
    if (!this.depositIssuesGridParams) return;
    const rows = this.depositTypeFilter === 'all'
      ? this.depositIssuesRowData
      : this.depositIssuesRowData.filter(r => r.depositType === this.depositTypeFilter);
    this.depositIssuesGridParams.api.setRowData(rows);
  }

  setDepositTypeFilter(value: 'all' | 'interac' | 'mobile_money') {
    this.depositTypeFilter = value;
    this.applyDepositIssuesGrid();
  }

  markDepositIssueResolved() {
    if (!this.selectedDepositIssue) return;
    this.spinner.show();
    this.data.updateDepositIssueReportStatus(this.selectedDepositIssue.id, 'resolved').then(() => {
      this.spinner.hide();
      this.selectedDepositIssue = null;
      this.toastr.success('Issue marked as resolved', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update issue status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark deposit issue resolved error:', err);
    });
  }

  markDepositIssueIgnored() {
    if (!this.selectedDepositIssue) return;
    this.spinner.show();
    this.data.updateDepositIssueReportStatus(this.selectedDepositIssue.id, 'ignored').then(() => {
      this.spinner.hide();
      this.selectedDepositIssue = null;
      this.toastr.success('Issue marked as ignored', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update issue status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark deposit issue ignored error:', err);
    });
  }

  markDepositIssueNew() {
    if (!this.selectedDepositIssue) return;
    this.spinner.show();
    this.data.updateDepositIssueReportStatus(this.selectedDepositIssue.id, 'new').then(() => {
      this.spinner.hide();
      this.selectedDepositIssue = null;
      this.toastr.success('Issue set back to new', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update issue status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark deposit issue new error:', err);
    });
  }

  // ── FOREIGN BILL PAYMENT REQUESTS MANAGEMENT ─────────────────────────────

  onForeignBillsGridReady(params) {
    this.foreignBillsGridParams = params;
    this.getForeignBillPaymentRequests();
  }

  onForeignBillRowClicked(event) {
    this.selectedForeignBill = event.data as ForeignBillPaymentRequest;
  }

  onForeignBillRowDoubleClicked(event) {
    this.selectedForeignBill = event.data as ForeignBillPaymentRequest;
    this.openForeignBillDetailModal(this.templateForeignBillDetail);
  }

  getForeignBillPaymentRequests() {
    this.foreignBillsSubscription = this.data.getAllForeignBillPaymentRequests().subscribe(res => {
      const list: ForeignBillPaymentRequest[] = res.map((e: any) => {
        const d = e.payload.doc.data();
        d.id = e.payload.doc.id;
        return d as ForeignBillPaymentRequest;
      });
      // Order: pending first, then in_progress, then paid, reimbursed, rejected.
      const statusRank: { [key: string]: number } = {
        pending: 0, in_progress: 1, paid: 2, reimbursed: 3, rejected: 4,
      };
      list.sort((a, b) => (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99));
      this.foreignBillsRowData = list;
      this.pendingForeignBillsCount = list.filter(r => r.status === 'pending').length;
      if (this.foreignBillsGridParams) {
        this.foreignBillsGridParams.api.setRowData(list);
      }
    }, err => {
      console.log('Error fetching foreign bill payment requests', err);
    });
  }

  openForeignBillDetailModal(template: TemplateRef<any>) {
    if (!this.selectedForeignBill) return;
    // Preload the bilingual fields, falling back to the deprecated single-
    // language field so legacy records remain editable in either textarea.
    const legacy = this.selectedForeignBill.userMessage || '';
    this.foreignBillUserMessageEnDraft =
      this.selectedForeignBill.userMessageEn || legacy || '';
    this.foreignBillUserMessageFrDraft =
      this.selectedForeignBill.userMessageFr || legacy || '';
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  saveForeignBillUserMessage() {
    if (!this.selectedForeignBill) return;
    const messageEn = (this.foreignBillUserMessageEnDraft || '').trim();
    const messageFr = (this.foreignBillUserMessageFrDraft || '').trim();
    if ((messageEn === '') !== (messageFr === '')) {
      this.toastr.error(
        'Please provide the message in both English and French (or clear both)',
        'Validation',
        { progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true }
      );
      return;
    }
    this.foreignBillUserMessageSaving = true;
    this.spinner.show();
    this.data.setForeignBillUserMessage(this.selectedForeignBill.id, messageEn, messageFr).then(() => {
      this.spinner.hide();
      this.foreignBillUserMessageSaving = false;
      this.selectedForeignBill.userMessageEn = messageEn;
      this.selectedForeignBill.userMessageFr = messageFr;
      this.selectedForeignBill.userMessage = '';
      this.toastr.success(
        messageEn ? 'Message sent to user' : 'Message cleared',
        'Early Transfer',
        { progressBar: true, toastClass: 'toast-custom',
          positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000 }
      );
    }).catch(err => {
      this.spinner.hide();
      this.foreignBillUserMessageSaving = false;
      this.toastr.error('Failed to send message to user', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Save foreign bill user message error:', err);
    });
  }

  clearForeignBillUserMessageDraft() {
    this.foreignBillUserMessageEnDraft = '';
    this.foreignBillUserMessageFrDraft = '';
  }

  hasForeignBillUserMessageChanges(): boolean {
    if (!this.selectedForeignBill) return false;
    const enNow = (this.foreignBillUserMessageEnDraft || '').trim();
    const frNow = (this.foreignBillUserMessageFrDraft || '').trim();
    const enSaved = (this.selectedForeignBill.userMessageEn || '').trim();
    const frSaved = (this.selectedForeignBill.userMessageFr || '').trim();
    return enNow !== enSaved || frNow !== frSaved;
  }

  pickUpForeignBill() {
    if (!this.selectedForeignBill) return;
    this.spinner.show();
    this.data.markForeignBillPaymentInProgress(this.selectedForeignBill.id).then(() => {
      this.spinner.hide();
      this.toastr.success('Request picked up', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
      if (this.modalRef) this.modalRef.hide();
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Could not pick up the request', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Pickup foreign bill error:', err);
    });
  }

  openMarkPaidModal(template: TemplateRef<any>) {
    if (!this.selectedForeignBill) return;
    this.foreignBillPaidForm = { reference: '', proofUrl: '', note: '' };
    if (this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
  }

  confirmMarkPaid() {
    if (!this.selectedForeignBill) return;
    this.spinner.show();
    this.data.markForeignBillPaymentPaid(this.selectedForeignBill.id, {
      reference: this.foreignBillPaidForm.reference.trim(),
      proofUrl: this.foreignBillPaidForm.proofUrl.trim(),
      note: this.foreignBillPaidForm.note.trim(),
    }).then(() => {
      this.spinner.hide();
      this.modalRef.hide();
      this.toastr.success('Bill marked as paid', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to mark as paid', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark foreign bill paid error:', err);
    });
  }

  markForeignBillReimbursed() {
    if (!this.selectedForeignBill) return;
    this.spinner.show();
    this.data.markForeignBillPaymentReimbursed(this.selectedForeignBill.id).then(() => {
      this.spinner.hide();
      this.toastr.success('Request closed as reimbursed', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
      if (this.modalRef) this.modalRef.hide();
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to update status', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Mark foreign bill reimbursed error:', err);
    });
  }

  openRejectForeignBillModal(template: TemplateRef<any>) {
    if (!this.selectedForeignBill) return;
    this.foreignBillRejectionReason = '';
    if (this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
  }

  confirmRejectForeignBill() {
    if (!this.selectedForeignBill) return;
    if (!this.foreignBillRejectionReason.trim()) {
      this.toastr.error('Please provide a rejection reason', 'Validation', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      return;
    }
    this.spinner.show();
    this.data.rejectForeignBillPayment(this.selectedForeignBill.id, this.foreignBillRejectionReason.trim()).then(() => {
      this.spinner.hide();
      this.modalRef.hide();
      this.toastr.success('Request rejected', 'Early Transfer', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000
      });
    }).catch(err => {
      this.spinner.hide();
      this.toastr.error('Failed to reject request', 'Error', {
        progressBar: true, toastClass: 'toast-custom',
        positionClass: 'toast-bottom-left', closeButton: true
      });
      console.log('Reject foreign bill error:', err);
    });
  }

  formatForeignBillType(value: string): string {
    switch (value) {
      case 'tuition': return 'Tuition fees';
      case 'subscription': return 'Subscription';
      case 'service': return 'Service fees';
      case 'other': return 'Other';
      default: return value || '-';
    }
  }

  formatReimbursementMethod(value: string): string {
    switch (value) {
      case 'mobile_money': return 'Mobile Money';
      case 'interac': return 'Interac (Canada)';
      case 'cash': return 'Cash / In person';
      default: return value || '-';
    }
  }

}
