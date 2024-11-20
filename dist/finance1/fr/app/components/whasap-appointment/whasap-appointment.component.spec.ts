import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhasapAppointmentComponent } from './whasap-appointment.component';

describe('WhasapAppointmentComponent', () => {
  let component: WhasapAppointmentComponent;
  let fixture: ComponentFixture<WhasapAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WhasapAppointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WhasapAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
