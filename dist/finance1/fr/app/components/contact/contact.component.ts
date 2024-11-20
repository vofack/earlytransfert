import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
declare function initMap(): void;
declare let swal: any;

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  messageError: boolean;
  emailError: boolean;
  nameError: boolean;
  subjectError: boolean;
  emailError_: boolean;
  subjectError_: boolean;

  constructor(private  spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.goToTop();
    initMap();
  }

  reinitialiseError(){
       this.messageError = false;
       this.nameError = false;
       this.emailError = false;
       this.emailError_ = false;
       this.subjectError = false;
       this.subjectError_ = false;
  } 

  onKeyUpForMessage(event: KeyboardEvent){
    this.messageError = false;
    let message = document.getElementById("message") as HTMLFormElement;
    if (message.value.length === 0) this.messageError = true;
  }
  onKeyUpForName(event: KeyboardEvent){
    this.nameError = false;
    let name = document.getElementById("name") as HTMLFormElement;
    if (name.value.length === 0) this.nameError = true;
  }
  onKeyUpForEmail(event: KeyboardEvent){
    this.emailError = false;
    this.emailError_ = false;
    let email = document.getElementById("email") as HTMLFormElement;
    if (email.value.length === 0) {
      this.emailError = true;
    } else {
      if (!this.validateEmail(email)) this.emailError_ = true;
    }
  }
  onKeyUpForSubject(event: KeyboardEvent){
    this.subjectError = false;
    this.subjectError_ = false;
    let subject = document.getElementById("subject") as HTMLFormElement;
    if (subject.value.length === 0) {
      this.subjectError = true;
    } else {
      if (subject.value.length < 4) this.subjectError_ = true;
    }
  }

  validateEmail(email) {
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return email.value.match(mailformat)  
  }
  
  sendMessage(InputMessage,InputName,InputEmail,InputSubject){
    this.reinitialiseError();
    
    if(InputMessage.value.length===0 || InputName.value.length===0 
       || InputEmail.value.length===0 || InputSubject.value.length===0
       || !this.validateEmail(InputEmail) || InputSubject.value.length < 4){
        if (InputMessage.value.length === 0) this.messageError = true;
        if (InputName.value.length === 0) this.nameError = true;
        if (InputEmail.value.length === 0) {
          this.emailError = true;
        } else {
          if (!this.validateEmail(InputEmail)) this.emailError_ = true;
        }  
        if (InputSubject.value.length === 0) {
          this.subjectError = true;
        } else {
          if (InputSubject.value.length < 4) this.subjectError_ = true;
        }
    
    }else{
        
        let message_ = InputMessage.value.toString().trim();
        let name_ = InputName.value.toString().trim();
        let email_ = InputEmail.value.toString().trim();
        let subject_ = InputSubject.value.toString().trim();

        this.spinner.show();
    
        setTimeout(() => {
          /** spinner ends after 2 seconds */
          this.spinner.hide();
          swal.fire({title: 'Feedback', text: 'Send successfuly . We will contact you soon', 
        confirmButtonColor: '#FFD700', customClass: 'swal-wide', icon: 'success', position: 'top-middle'});
        }, 1000);      
        
    }    
  }
  
  
  goToTop(): void {
    document.getElementById("goToTop").scrollIntoView({behavior: 'smooth'});
  }

}
