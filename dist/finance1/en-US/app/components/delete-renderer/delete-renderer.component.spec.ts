import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRendererComponent } from './delete-renderer.component';

describe('DeleteRendererComponent', () => {
  let component: DeleteRendererComponent;
  let fixture: ComponentFixture<DeleteRendererComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
