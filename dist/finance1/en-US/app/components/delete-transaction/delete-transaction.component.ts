
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { IAfterGuiAttachedParams, ICellRendererParams } from 'ag-grid-community';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Transaction } from 'src/app/models/transaction';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-delete-transaction',
  templateUrl: './delete-transaction.component.html',
  styleUrls: ['./delete-transaction.component.scss']
})

export class DeleteTransactionComponent implements OnInit, ICellRendererAngularComp {
  private params: any;
  alltransactionsList: Transaction[] = [];
  modalRef: any;
  itemToDelete = '';
  @ViewChild('templateDelete', {read: TemplateRef}) modalTemplate: TemplateRef<any>;
  constructor(private toastr: ToastrService, private  spinner: NgxSpinnerService,
              private data: DataService, private modalService:BsModalService) { }
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
    this.itemToDelete = this.params.data.id;
    this.modalRef = this.modalService.show(this.modalTemplate);
  }

  deleteTransaction() {
    if(this.modalRef) this.modalRef.hide();
    this.data.getAlltransactions().subscribe(res => {
      let transactionsList = [];
      let transaction: any = null;
      let find = false;
      this.alltransactionsList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;

        transactionsList.push(data);
  
        if (data.userEmail === this.params.data.userEmail && data.id === this.params.data.id && !find) {
              transaction = data;
              find = true; 
              this.toastr.success('Supression effectue avec succes','Early Transfer', {progressBar: true, toastClass: 'toast-custom',  positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000});
        }
        return data;
      });
      if (transaction) {
        setTimeout(() => {
          /** spinner ends after 2 seconds */
          this.data.deleteTransaction(transaction);
          }, 3000);    
      } 
      this.params.api.setRowData(transactionsList);
      
    }, err => {
      console.log('Error while fetching transaction data');
    })
  
  }

}
