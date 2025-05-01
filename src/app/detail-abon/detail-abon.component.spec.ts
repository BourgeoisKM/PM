import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailAbonComponent } from './detail-abon.component';

describe('DetailAbonComponent', () => {
  let component: DetailAbonComponent;
  let fixture: ComponentFixture<DetailAbonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailAbonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailAbonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
