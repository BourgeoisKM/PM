import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllReportsComponent } from './all-reports.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DataService } from 'src/app/services/data.service';

describe('AllReportsComponent', () => {
  let component: AllReportsComponent;
  let fixture: ComponentFixture<AllReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AllReportsComponent],
      imports: [HttpClientTestingModule],
      providers: [DataService]
    }).compileComponents();

    fixture = TestBed.createComponent(AllReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
function beforeEach(arg0: () => Promise<void>) {
  throw new Error('Function not implemented.');
}

function expect(component: AllReportsComponent) {
  throw new Error('Function not implemented.');
}

