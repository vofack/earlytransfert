import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ContactComponent } from './components/contact/contact.component';
import { HttpClientModule } from '@angular/common/http';
// for HttpClient import:
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
// for Core import:
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { ChatboxComponent } from './components/chatbox/chatbox.component';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';
import {NgxSpinnerModule} from "ngx-spinner";
import {ToastrModule} from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Hamburger1Component } from './components/hamburger1/hamburger1.component';
import { AboutComponent } from './components/about/about.component';
import { BeneficiaireComponent } from './components/beneficiaire/beneficiaire.component';
//import { AgGridModule } from '@ag-grid-community/angular';
import { CustomizedCellComponentComponent } from './components/customized-cell-component/customized-cell-component.component';
import { DeleteRendererComponent } from './components/delete-renderer/delete-renderer.component';
import { EditRendererComponent } from './components/edit-renderer/edit-renderer.component';
import { TransactionComponent } from './components/transaction/transaction.component';
import { NgMultiSelect9DropDownModule } from 'ng-multiselect-dropdown9';
import { ConfirmTransactionComponent } from './components/confirm-transaction/confirm-transaction.component';
import { TrackingComponent } from './components/tracking/tracking.component';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'src/environments/environment';
import { FirebaseService } from './services/firebase.service';
//import { AngularFireModule } from '@angular/fire/compat'
//import { AngularFirestore } from '@angular/fire/firestore';
//import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FaqComponent } from './components/faq/faq.component';
//import { JwtInterceptor } from './jwt.interceptor';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { CheckboxCellComponent } from './components/checkbox-cell/checkbox-cell.component';
import { ManageTransactionsComponent } from './components/manage-transactions/manage-transactions.component';
import { DeleteTransactionComponent } from './components/delete-transaction/delete-transaction.component';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { MessagingService } from './services/messaging.service';
import { AsyncPipe } from '@angular/common';
import { HouseLoanComponent } from './components/house-loan/house-loan.component';
import { HouseDetailsComponent } from './components/house-details/house-details.component';
import { TrackingWithIdComponent } from './components/tracking-with-id/tracking-with-id.component';
import { AgGridModule } from 'ag-grid-angular';
import { TransactionWithNoAccountComponent } from './components/transaction-with-no-account/transaction-with-no-account.component';
import { ConfirmTransactionWnaComponent } from './components/confirm-transaction-wna/confirm-transaction-wna.component';





@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    ContactComponent,
    AppointmentComponent,
    ChatboxComponent,
    Hamburger1Component,
    AboutComponent,
    BeneficiaireComponent,
    CustomizedCellComponentComponent,
    DeleteRendererComponent,
    EditRendererComponent,
    TransactionComponent,
    ConfirmTransactionComponent,
    TrackingComponent,
    FaqComponent,
    TransactionsComponent,
    CheckboxCellComponent,
    ManageTransactionsComponent,
    DeleteTransactionComponent,
    HouseLoanComponent,
    HouseDetailsComponent,
    TrackingWithIdComponent,
    TransactionWithNoAccountComponent,
    ConfirmTransactionWnaComponent 
  ],
  imports: [
    BrowserModule,
		FormsModule,
		ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    LoadingBarHttpClientModule,
    LoadingBarModule,
    NgxSpinnerModule,
    AgGridModule.withComponents([CustomizedCellComponentComponent, 
    CheckboxCellComponent, EditRendererComponent, DeleteRendererComponent,
    DeleteTransactionComponent]),
    BrowserAnimationsModule,
    NgMultiSelect9DropDownModule.forRoot(),
    ModalModule.forRoot(),
    ToastrModule.forRoot(),
    AngularFireDatabaseModule,
      AngularFireAuthModule,
      AngularFireMessagingModule,
    AngularFireModule.initializeApp(environment.firebase)  
  ],
  providers: [BsModalService, FirebaseService, MessagingService, AsyncPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
