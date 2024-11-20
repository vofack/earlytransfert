import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-house-loan',
  templateUrl: './house-loan.component.html',
  styleUrls: ['./house-loan.component.scss']
})
export class HouseLoanComponent implements OnInit {
 imgId: number;
  constructor(private  spinner: NgxSpinnerService, private router: Router) {}

  ngOnInit(): void {
    if(!localStorage.getItem('user')) { 
      let link = ['/'];
      this.router.navigate(link);
    }
  }

  closeImage(): void {
    const input = document.querySelector('.popup-image') as HTMLInputElement | null;

    if (input != null) {
      input.style.display = 'none';
    }
  }

  openImage(id:number): void {
    this.imgId = id;

    const input = document.querySelector('.popup-image') as HTMLInputElement | null;

    if (input != null) {
      input.style.display = 'block';
    }
  }

  houseLoan(): void {
  
   
     let link = ['/houseDetails'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 2000);
   }

}
