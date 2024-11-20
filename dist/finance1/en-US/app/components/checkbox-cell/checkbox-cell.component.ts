
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { IAfterGuiAttachedParams, ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-checkbox-cell',
  templateUrl: './checkbox-cell.component.html',
  styleUrls: ['./checkbox-cell.component.scss'],
  encapsulation: ViewEncapsulation.None // take the style of the modal popup in considaration
})

export class CheckboxCellComponent implements OnInit, ICellRendererAngularComp {
  @ViewChild('.checkbox') checkbox: ElementRef;
  select = false;
  public params: ICellRendererParams;
  
  constructor() { }
  refresh(params: ICellRendererParams): boolean {
    throw new Error('Method not implemented.');
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {
    throw new Error('Method not implemented.');
  }

  onChange(event) {
    
    //this.params.data[this.params.colDef.field] = event.currentTarget.checked; 
  }

  handleClickEvent(event:any) {
    
    if(this.select) this.select = false;
    else this.select = true;
    //console.log(event)
  }

  ngOnInit(): void {
  }

}
