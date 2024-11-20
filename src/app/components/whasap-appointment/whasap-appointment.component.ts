import { CommonModule } from '@angular/common';
import { Component, HostListener, TemplateRef, ViewEncapsulation } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';


@Component({
  selector: 'app-whasap-appointment',
  templateUrl: './whasap-appointment.component.html',
  styleUrls: ['./whasap-appointment.component.scss']
})
export class WhasapAppointmentComponent  {
  showAppointment = false;
  pointOfScreen = 0;
  modalRef: any;

  constructor(private modalService:BsModalService) { }

  @HostListener("window:scroll", []) onWindowScroll() {
    // do some stuff here when the window is scrolled
    const verticalOffset = window.pageYOffset 
          || document.documentElement.scrollTop 
          || document.body.scrollTop || 0;
          if (window.pageYOffset > 500) {
             this.showAppointment = true;
          }else{
            this.showAppointment = false;
          }
  }

   topFun() {
    window.scrollTo(0, 0);
   }


  public openModal(template:TemplateRef<any>){
    // if(this.modalRef) this.modalRef.hide();
    this.modalRef = this.modalService.show(template);
  
  }

  openWhasap(){
    window.open("https://wa.me/+14384042421", "_blank");
  }

}
