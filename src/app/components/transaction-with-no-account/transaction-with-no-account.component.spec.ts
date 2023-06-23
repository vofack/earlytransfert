import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionWithNoAccountComponent } from './transaction-with-no-account.component';

describe('TransactionWithNoAccountComponent', () => {
  let component: TransactionWithNoAccountComponent;
  let fixture: ComponentFixture<TransactionWithNoAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransactionWithNoAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionWithNoAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
