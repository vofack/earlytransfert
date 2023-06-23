import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
// import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
declare var firebase:any;
import { ToastrService } from 'ngx-toastr';



@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
isLoggedIn = false;
emailSend = false;

  constructor(private firebaseAuth: AngularFireAuth, private router: Router,
              private toastr: ToastrService, private  spinner: NgxSpinnerService) { }

  async signIn(email: string, password: string) {
      await this.firebaseAuth.signInWithEmailAndPassword(email,password).then( res => {
        this.isLoggedIn = true;
        localStorage.setItem('user', email);
        this.toastr.success('Welcome','Early Transfer', {progressBar: true, toastClass: 'toast-custom',
        closeButton: true, positionClass: 'toast-bottom-left'});
        //const user = firebase.auth().currentUser()
      }, err => {
          this.spinner.hide();
          this.toastr.error(err.message,'Sign In', {progressBar: true, 
            toastClass: 'toast-custom', closeButton: true,
            positionClass: 'toast-bottom-left'});
      })
  }


  async signInWithNoAccount(email: string, password: string) {
    await this.firebaseAuth.signInWithEmailAndPassword(email,password).then( res => {
      this.isLoggedIn = true;
     
    }, err => {   
        console.log(err.message);
    })
}

   async signUp(email: string, password: string) {
    await this.firebaseAuth.createUserWithEmailAndPassword(email,password).then( res => {
      this.isLoggedIn = true;
      localStorage.setItem('user',JSON.stringify(res.user));
      this.toastr.success('Creé avec succès','Compte', {progressBar: true, toastClass: 'toast-custom', closeButton: true,
      positionClass: 'toast-bottom-left'});
    }, err => {
        this.spinner.hide();
        this.toastr.error(err.message,'Sign Up', {progressBar: true, 
          toastClass: 'toast-custom', closeButton: true,
          positionClass: 'toast-bottom-left'});
    })
  }

  logOut() {
    this.firebaseAuth.signOut().then( () => {
      localStorage.removeItem('user');
      localStorage.removeItem('last_name');
      localStorage.removeItem('first_name');
      localStorage.removeItem('mobile');
      this.isLoggedIn = false;
    }, err => {
      this.spinner.hide();
      this.toastr.error(err.message,'logOut', {progressBar: true, 
        toastClass: 'toast-custom', closeButton: true,
        positionClass: 'toast-bottom-left'});
    })
  }

   // forgot password
   async forgotPassword(email : string) {
    await this.firebaseAuth.sendPasswordResetEmail(email).then(() => {
      this.emailSend = true;
    }, err => {
      //lert('Something went wrong');
      this.spinner.hide();
      this.toastr.error(err.message,'forgotPassword', {progressBar: true, 
        toastClass: 'toast-custom', closeButton: true,
        positionClass: 'toast-bottom-left'});
    })
  }

}
