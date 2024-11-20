import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseLoanComponent } from './house-loan.component';

describe('HouseLoanComponent', () => {
  let component: HouseLoanComponent;
  let fixture: ComponentFixture<HouseLoanComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HouseLoanComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HouseLoanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
