import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service'; 

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.css']
})
export class AsideComponent implements OnInit {
  role: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    const currentUser = this.dataService.getCurrentUser();
    this.role = currentUser?.role || '';
  }
}
