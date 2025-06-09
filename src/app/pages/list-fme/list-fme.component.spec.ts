import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFmeComponent } from './list-fme.component';

describe('ListFmeComponent', () => {
  let component: ListFmeComponent;
  let fixture: ComponentFixture<ListFmeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListFmeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListFmeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
