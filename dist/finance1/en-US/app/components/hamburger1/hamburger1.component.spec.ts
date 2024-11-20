import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Hamburger1Component } from './hamburger1.component';

describe('Hamburger1Component', () => {
  let component: Hamburger1Component;
  let fixture: ComponentFixture<Hamburger1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Hamburger1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Hamburger1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
