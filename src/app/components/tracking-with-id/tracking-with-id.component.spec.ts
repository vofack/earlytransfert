import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingWithIdComponent } from './tracking-with-id.component';

describe('TrackingWithIdComponent', () => {
  let component: TrackingWithIdComponent;
  let fixture: ComponentFixture<TrackingWithIdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingWithIdComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingWithIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
