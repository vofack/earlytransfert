//import { ICellRendererAngularComp } from '@ag-grid-community/angular';
//import { IAfterGuiAttachedParams, ICellRendererParams } from '@ag-grid-community/core';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
    receiver: '',
    amountSend: '',
    amountReceive : '',
    date : '',
    status : '',
    receiverNumber: '',
    receivingCountry: '',
    receivingMethod: '',
    sendingCountry: ''

  };

  constructor(private toastr: ToastrService, private  spinner: NgxSpinnerService,
    private data: DataService, private modalService:BsModalService, private sendMessage: MessageService) { }
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

    this.transactionObj.id = this.params.data.id;
    this.transactionObj.userEmail = this.params.data.userEmail; // current email connected
    this.transactionObj.transactionCode = this.params.data.transactionCode;
    this.transactionObj.receiver = this.params.data.receiver;
    this.transactionObj.amountSend = this.params.data.amountSend;
    this.transactionObj.amountReceive = this.params.data.amountReceive;
    this.transactionObj.date = this.params.data.date;
    this.transactionObj.receiverNumber = this.params.data.receiverNumber;
    this.transactionObj.receivingCountry = this.params.data.receivingCountry;
    this.transactionObj.receivingMethod = this.params.data.receivingMethod;
    this.transactionObj.sendingCountry = this.params.data.sendingCountry;
    this.transactionObj.status = this.status;
            
    this.toastr.success('Modification effectue avec succes','Early Transfer', {progressBar: true, toastClass: 'toast-custom', positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000});
          this.modalRef.hide(); // pour fermer le popup

    setTimeout(() => {
            /** spinner ends after 2 seconds */        
            this.data._updateTransaction(this.transactionObj);
    }, 3500);

  }

  updateTransaction(transactionObj: allTransaction): void {
    this.data._updateTransaction(transactionObj);
  }

}
