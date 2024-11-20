import { Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Alert } from 'selenium-webdriver';
import { FirebaseService } from './services/firebase.service';
import { MessagingService } from './services/messaging.service';
declare let AOS: any;
declare let WOW: any;
declare function initChatBox(): void; 
declare function initMain(): void;
declare function initNotification(): void;
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Early Transfert';
  message;
  idleTimer = 0;
  reloadCounter = 0;
  activityInterval: any;
  reloadInterval: any;
  modalRef: any;
  cpuWorker:any;
  @ViewChild('templateLogout', {read: TemplateRef}) modalTemplate: TemplateRef<any>;

  constructor(private modalService:BsModalService, private firebaseService: FirebaseService,
              private messagingService: MessagingService, private titleService: Title) { 
                this.titleService.setTitle($localize`${this.title}`);
              }

  ngOnInit() {
    AOS.init();
    initChatBox();
    if(this.activityInterval) clearInterval(this.activityInterval);
    if(this.reloadCounter) clearInterval(this.reloadCounter);
    this.idleTimer = 0;
    this.reloadCounter = 0;
    this.init();  
    initNotification();
    localStorage.setItem('language', 'FR');
  }
  
  ngAfterViewInit() {  
  }

  ngOnDestroy() {
    //clearInterval(this.activityInterval);
    //clearInterval(this.reloadInterval);
  }

  goToTop(): void {
    document.getElementById("goToTop").scrollIntoView({behavior: 'smooth'});
  }

  private init() {
    var  _this = this;
    this.activityInterval = setInterval(function() {
      if(_this.firebaseService.isLoggedIn || localStorage.getItem('user')) {
          _this.idleTimer = _this.idleTimer + 1;
          if (_this.idleTimer === 59) { // 30 minutes
            

              _this.reloadCounter = 30;
              _this.reloadInterval =  setInterval(() => {
                  /** spinner ends after 2 seconds */
                  _this.reloadCounter -=  1 ;
                }, 1000);

              _this.modalRef = _this.modalService.show(_this.modalTemplate);
          } else if (_this.idleTimer === 89) {       
              _this.firebaseService.logOut();
              window.location.href = window.location.href;  
          }
        }
     }, 1000);

    this.mouseHandlers();
  }

  private mouseHandlers() {
    document.addEventListener('mousemove', this.onMouseMove)
  }

  private onMouseMove: EventListener = (event: MouseEvent) => {
    if (this.idleTimer < 59 ) {
      this.idleTimer = 0;
    }
    clearInterval(this.reloadInterval);
  }

  stillAround(): void {
    this.idleTimer = 0;
    this.reloadCounter = 30;
    clearInterval(this.reloadInterval);
    if(this.modalRef) this.modalRef.hide(); // pour fermer le popup
  }

  initializeWorker(): void {
    
    if(typeof Worker !== 'undefined') {
      if(!this.cpuWorker) {
        this.cpuWorker = new Worker('./app.worker', 
        { type: 'module'});
      }
    } else {
      throw new Error('not available');
    }
  }
  

}
