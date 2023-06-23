import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaireComponent } from './beneficiaire.component';

describe('BeneficiaireComponent', () => {
  let component: BeneficiaireComponent;
  let fixture: ComponentFixture<BeneficiaireComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BeneficiaireComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BeneficiaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
