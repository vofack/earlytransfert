import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRendererComponent } from './edit-renderer.component';

describe('EditRendererComponent', () => {
  let component: EditRendererComponent;
  let fixture: ComponentFixture<EditRendererComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
