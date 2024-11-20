import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizedCellComponentComponent } from './customized-cell-component.component';

describe('CustomizedCellComponentComponent', () => {
  let component: CustomizedCellComponentComponent;
  let fixture: ComponentFixture<CustomizedCellComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomizedCellComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizedCellComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
