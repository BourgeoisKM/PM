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
    const rawRole = localStorage.getItem('userRole') || '';
    this.userRole = rawRole.trim().toLowerCase();

    const rawVendorId = localStorage.getItem('vendorId') || '';
    this.vendorId = rawVendorId.trim().toLowerCase();

    console.log('UserRole:', this.userRole);
    console.log('VendorId:', this.vendorId);
  }

  private loadPMSchedules(): void {
    this.dataService.getAssignedPMs().subscribe({
      next: (res: any[]) => {
        console.log('PMs reçus:', res);

        if (this.userRole === 'ops_admin') {
          // OPS Admin voit tout
          this.pmSchedules = res;
        } 
        else if (this.userRole === 'vendor_admin') {
          if (!this.vendorId) {
            console.warn('vendorId manquant pour vendor_admin');
            this.pmSchedules = [];
          } else {
            // Filtrer les PMs dont le vendorId correspond à celui de l’utilisateur
            this.pmSchedules = res.filter(pm => {
              const pmVendorIdRaw = pm.fme?.vendorId || '';
              const pmVendorId = pmVendorIdRaw.trim().toLowerCase();

              const match = pmVendorId === this.vendorId;

              console.log(`PM site "${pm.siteName || 'unknown'}" vendorId: "${pmVendorIdRaw}" => match:`, match);
              return match;
            });
          }
        } 
        else {
          console.warn(`Rôle utilisateur non reconnu : "${this.userRole}" - aucune PM affichée`);
          this.pmSchedules = [];
        }

        console.log('PM schedules après filtre:', this.pmSchedules);
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
