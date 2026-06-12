//import { ICellRendererAngularComp } from '@ag-grid-community/angular';
//import { IAfterGuiAttachedParams, ICellRendererParams } from '@ag-grid-community/core';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { IAfterGuiAttachedParams, ICellRendererParams } from 'ag-grid-community';
//import { ICellRendererAngularComp } from 'ag-grid-angular';
//import { ICellRendererParams, IAfterGuiAttachedParams } from 'ag-grid-community';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { allTransaction, Transaction } from 'src/app/models/transaction';
import { DataService } from 'src/app/services/data.service';
import { MessageService } from 'src/app/services/message.service';

@Component({
  selector: 'app-customized-cell-component',
  templateUrl: './customized-cell-component.component.html',
  styleUrls: ['./customized-cell-component.component.scss']
})
//export class CustomizedCellComponentComponent implements OnInit {
export class CustomizedCellComponentComponent implements OnInit, ICellRendererAngularComp {
  private params: any;
  itemToModify = '';
  status = '';
  modalRef: any;
  @ViewChild('templateDelete', {read: TemplateRef}) modalTemplate: TemplateRef<any>;
  transactionObj: allTransaction = {
    id: '',
    userEmail: '',
    transactionCode: '',
    sendingCountry: '',
    receivingCountry: '',
    receivingMethod: '',
    receiverNumber: '',
    senderNumber: '',
    receiver: '',
    amountSend: '',
    amountReceive : '',
    date : '',
    status : '',
    isPostWoner: false,
    isMarketPlace: false,
    expires_at: ''
  };

  constructor(private toastr: ToastrService, private  spinner: NgxSpinnerService,
    private data: DataService, private modalService:BsModalService, private sendMessage: MessageService,
    private http: HttpClient) { }
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

  handleClickEvent(event:any) {
    console.log(this.params.data.id);
    this.itemToModify = this.params.data.id;
  }

  selectElement(event:any) {
    this.itemToModify = this.params.data.id;
    if(event.target.value === '1'){
        this.status = 'COMPLETE';
    }else if (event.target.value === '2'){
      this.status = 'INPROGRESS';
    }else if (event.target.value === '3'){
      this.status = 'INCOMPLETE';
    }else if (event.target.value === '4'){
      this.status = 'PENDING';
    }
    this.modalRef = this.modalService.show(this.modalTemplate);
  }

  modifyTransaction(): void{

    // Record the real clock time (HH:mm) at which this status step is reached,
    // accumulating onto any previously stamped steps. Spreading the whole row
    // preserves every field (rate, time, postId, propositionId,
    // counterpartyEmail, stageTimestamps, …) — the old field-by-field copy
    // dropped them when re-creating the doc.
    const now = new Date();
    const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const existingStages =
      (this.params.data.stageTimestamps && typeof this.params.data.stageTimestamps === 'object')
        ? this.params.data.stageTimestamps
        : {};

    this.transactionObj = {
      ...this.params.data,
      status: this.status,
      stageTimestamps: { ...existingStages, [this.status]: hhmm },
    } as allTransaction;

    this.toastr.success('Modification effectue avec succes','Early Transfer', {progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000});
          this.modalRef.hide(); // pour fermer le popup

    setTimeout(() => {
            /** spinner ends after 2 seconds */
            this.data._updateTransaction(this.transactionObj);
            this.notifyUserOfStatusChange(
              this.transactionObj.userEmail,
              this.transactionObj.transactionCode,
              this.status
            );
    }, 3500);

  }

  updateTransaction(transactionObj: allTransaction): void {
    this.data._updateTransaction(transactionObj);
  }

  private notifyUserOfStatusChange(userEmail: string, transactionCode: string, status: string): void {
    if (!userEmail) return;

    let msg = '';
    switch (status) {
      case 'PENDING':
        msg = 'Payment is pending on your transaction!';
        break;
      case 'INCOMPLETE':
        msg = 'Payment received, your transaction is incomplete!';
        break;
      case 'INPROGRESS':
        msg = 'Your transaction is in progress!';
        break;
      case 'COMPLETE':
        msg = 'Your transaction is complete!';
        break;
      default:
        return; // Don't notify for unknown/default status
    }

    const toastOpts = {
      progressBar: true,
      toastClass: 'toast-custom',
      positionClass: 'toast-bottom-left',
      closeButton: true,
      timeOut: 5000
    };

    // Only send when the user has a registered FCM token, so the Cloud
    // Function doesn't throw "no FCM token" for iOS users who never opened
    // the mobile app.
    this.data.getUserFcmToken(userEmail).then(token => {
      if (!token) {
        this.toastr.warning(
          `${userEmail} has no device token yet — push notification skipped.`,
          'No device token',
          toastOpts
        );
        return;
      }

      const title = transactionCode
        ? `Transaction ${transactionCode} update`
        : 'Transaction update';

      const payload = {
        title,
        body: msg,
        targetEmail: userEmail
      };

      this.http.post('https://us-central1-dashboard-33d8e.cloudfunctions.net/sendNotification', payload)
        .toPromise()
        .then(() => {
          this.toastr.success(`Notification sent to ${userEmail}`, 'Push notification', toastOpts);
        })
        .catch(err => {
          const errMsg = (err && err.error && err.error.error) || (err && err.message) || 'Unknown error';
          this.toastr.error(`Failed to notify ${userEmail}: ${errMsg}`, 'Push notification', toastOpts);
        });
    }).catch(err => {
      this.toastr.error(`Could not look up device token for ${userEmail}`, 'Push notification', toastOpts);
      console.log('Failed to resolve FCM token for', userEmail, err);
    });
  }

}
