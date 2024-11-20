import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss']
})
export class AppointmentComponent implements OnInit {
  showAppointment = false;
  pointOfScreen = 0;

  constructor() { }

  ngOnInit() {
  }

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

}
