import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
declare let swal: any;

@Component({
  selector: 'app-house-details',
  templateUrl: './house-details.component.html',
  styleUrls: ['./house-details.component.scss']
})
export class HouseDetailsComponent implements OnInit {
  hideButton = false;
  constructor(private  spinner: NgxSpinnerService) { }

  ngOnInit(): void {
  }

  Order(){
    /** spinner starts on init */
    this.spinner.show();
   
    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
      swal.fire({title: 'Order', text: 'We will contact you soon. Thank You !', 
            confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'success', position: 'top-middle'});
    }, 1000);
  }

}
