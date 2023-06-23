import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
declare let swal: any;

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  modalRef: any;
  load = '';
  
  constructor(private router: Router, private  spinner: NgxSpinnerService) { }

  ngOnInit(): void {
  }

  Home(): void {

     console.log('Vous avez selectionné Home');
     let link = ['/'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
   }

  about(): void {

     console.log('Vous avez selectionné contact');
     let link = ['/about'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
  }

  contact(): void {

     console.log('Vous avez selectionné contact');
     let link = ['/contact'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
   }

   faq(): void {

     console.log('Vous avez selectionné currency');
     let link = ['/faq'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 1000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup   
  }
 
  apply(): void {
    swal.fire({title: 'Services', text: 'Comming soon', 
    confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'info', position: 'top-middle'});
  }

  suscribtion(email){
    /** spinner starts on init */
    this.spinner.show();
    if(email.value.length!==0) {
      
    }
  
    setTimeout(() => {
      /** spinner ends after 2 seconds */
      this.spinner.hide();
      swal.fire({title: 'Suscribtion', text: 'Thank You !', 
            confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'success', position: 'top-middle'});
    }, 1000);
  }

  houseLoan(): void {
     console.log('Vous avez selectionné homeLoan');
     let link = ['/houseLoan'];
     this.spinner.show();
 
     setTimeout(() => {
       /** spinner ends after 2 seconds */
       this.spinner.hide();
       this.router.navigate(link);
     }, 2000);
     if(this.modalRef) this.modalRef.hide(); // pour fermer le popup  
   }

}
