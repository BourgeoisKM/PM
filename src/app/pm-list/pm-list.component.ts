import { Component, OnInit } from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-pm-list',
  templateUrl: './pm-list.component.html',
  styleUrls: ['./pm-list.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PmListComponent implements OnInit {
  pmSchedules: any[] = [];
  currentPage = 1;
  itemsPerPage = 6;

  userRole: string = '';
  vendorId: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadUserContext();
    this.loadPMSchedules();
  }

  private loadUserContext(): void {
    this.userRole = (localStorage.getItem('userRole') || '').toLowerCase();
    this.vendorId = localStorage.getItem('vendorId') || '';
  }

  private loadPMSchedules(): void {
    this.dataService.getAssignedPMs().subscribe({
      next: (res: any[]) => {
        if (this.userRole === 'vendor_admin') {
          // On filtre via le FME => fme.vendorId
          this.pmSchedules = res.filter(pm => pm.fme?.vendorId === this.vendorId);
        } else if (this.userRole === 'ops_admin') {
          this.pmSchedules = res;
        } else {
          this.pmSchedules = [];
        }
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des PM assignées :', err);
        alert('Impossible de charger les données de PM.');
      }
    });
  }

  get paginatedSchedules(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.pmSchedules.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.pmSchedules.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
