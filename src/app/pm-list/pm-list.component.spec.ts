import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PmListComponent } from './pm-list.component';

describe('PmListComponent', () => {
  let component: PmListComponent;
  let fixture: ComponentFixture<PmListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PmListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PmListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
