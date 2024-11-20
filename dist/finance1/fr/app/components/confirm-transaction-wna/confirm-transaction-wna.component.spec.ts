import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmTransactionWnaComponent } from './confirm-transaction-wna.component';

describe('ConfirmTransactionWnaComponent', () => {
  let component: ConfirmTransactionWnaComponent;
  let fixture: ComponentFixture<ConfirmTransactionWnaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmTransactionWnaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmTransactionWnaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
