
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { IAfterGuiAttachedParams, ICellRendererParams } from 'ag-grid-community';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Beneficiary } from 'src/app/models/beneficiary';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-delete-renderer',
  templateUrl: './delete-renderer.component.html',
  styleUrls: ['./delete-renderer.component.scss']
})

export class DeleteRendererComponent implements OnInit, ICellRendererAngularComp {
  private params: any;
  allBeneficiariesList: Beneficiary[] = [];
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
    this.itemToDelete = this.params.data.last_name;
    this.modalRef = this.modalService.show(this.modalTemplate);
  }

  deleteBeneficiary() {
    if(this.modalRef) this.modalRef.hide();
    this.data.getAllBeneficiary().subscribe(res => {
      let beneficiariesList = [];
      let beneficiary: any = null;
      let find = false;
      this.allBeneficiariesList = res.map((e: any) => {
        const data = e.payload.doc.data();
        data.id = e.payload.doc.id;

        if (data.userEmail === this.params.data.userEmail) {
            beneficiariesList.push(data);
        }
        if (data.userEmail === this.params.data.userEmail && data.first_name === this.params.data.first_name && 
            data.last_name === this.params.data.last_name && data.email === this.params.data.email && 
            data.mobile === this.params.data.mobile && !find) {
              beneficiary = data;
              find = true; 
              this.toastr.success('Supression effectue avec succes','Early Transfer', {progressBar: true, toastClass: 'toast-custom',  positionClass: 'toast-bottom-left', closeButton: true, timeOut: 3000});
        }
        return data;
      });
      if (beneficiary) {
        this.data.deleteBeneficiary(beneficiary);
      } 
      this.params.api.setRowData( beneficiariesList);
      
    }, err => {
      console.log('Error while fetching beneficiary data');
    })
  
  }

}
