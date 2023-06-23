import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.goToTop();
  }

  goToTop(): void {
    document.getElementById("goToTop").scrollIntoView({behavior: 'smooth'});
  }

}
