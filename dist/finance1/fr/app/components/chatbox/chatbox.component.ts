import { Component, HostListener, OnInit } from '@angular/core';
declare function initChatBox(): void;


@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss']
})
export class ChatboxComponent implements OnInit {
  showChatBox = true;
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    
  }

  
  @HostListener("window:scroll", []) onWindowScroll() {
    // do some stuff here when the window is scrolled
    const verticalOffset = window.pageYOffset 
          || document.documentElement.scrollTop 
          || document.body.scrollTop || 0;
          if (window.pageYOffset > 500) {
             
             this.showChatBox = true;
          }else{
            this.showChatBox = false;
          }
  }

}
