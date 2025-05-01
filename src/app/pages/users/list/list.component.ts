import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  page: number = 1;
  allSites: any[] = [];
  filteredSites: any[] = [];
  searchTerm: string = '';
  hasData: boolean = false;
  isEmpty: boolean = false;

  constructor(private data: DataService, private router: Router) {}

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites(): void {
    this.data.getSites().subscribe((res: any[]) => {
      this.allSites = res;
      this.filteredSites = res;
      this.hasData = res.length > 0;
      this.isEmpty = res.length === 0;
    });
  }

  viewDetails(id: string) {
    this.router.navigate(['site', 'detail', id]);
  }

  search(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSites = this.allSites;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredSites = this.allSites.filter(site =>
        site.name.toLowerCase().includes(term) ||
        site.siteId.toLowerCase().includes(term) ||
        site.province.toLowerCase().includes(term)
      );
    }

    this.isEmpty = this.filteredSites.length === 0;
  }
  
}
