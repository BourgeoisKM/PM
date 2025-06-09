import { TestBed } from '@angular/core/testing';

import { FmeService } from './fme.service';

describe('FmeService', () => {
  let service: FmeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FmeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
