import { Component, OnInit } from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';
import { DataService } from '../services/data.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

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
  startDate: string = '';
endDate: string = '';
filteredSchedules: any[] = [];
searchTerm: string = '';


  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadUserAndPMSchedules();
  }

  private loadUserAndPMSchedules(): void {
    this.dataService.getCurrentUser().subscribe({
      next: (user) => {
        this.userRole = (user.role || '').trim().toLowerCase();
        this.vendorId = (user.vendorId || '').trim().toLowerCase();

        console.log('✅ Utilisateur détecté :', this.userRole, 'VendorID:', this.vendorId);

        this.loadPMSchedules();
      },
      error: err => {
        console.error('❗ Erreur lors du chargement des infos utilisateur :', err);
        alert('Erreur : impossible de récupérer les informations utilisateur.');
      }
    });
  }

  private loadPMSchedules(): void {
    
    this.dataService.getAssignedPMs().subscribe({
      next: (res: any[]) => {
        console.log('PMs reçus:', res);
this.pmSchedules = res.filter(pm => {
  const pmVendorId = (pm.fme?.vendorId || '').trim().toLowerCase();
  const match = pmVendorId === this.vendorId;
  console.log(`Comparaison vendorId: pmVendorId="${pmVendorId}" vs this.vendorId="${this.vendorId}" => ${match}`);
  return match;
});
        if (this.userRole === 'ops_admin') {
          this.pmSchedules = res;
        } else if (this.userRole === 'vendor_admin') {
          if (!this.vendorId) {
            console.warn(' vendorId manquant pour vendor_admin');
            this.pmSchedules = [];
          } else {
            this.pmSchedules = res.filter(pm => {
              const pmVendorId = (pm.fme?.vendorId || '').trim().toLowerCase();
              return pmVendorId === this.vendorId;
            });
          }
        } else {
          console.warn(`Rôle utilisateur non reconnu : "${this.userRole}" - aucune PM affichée`);
          this.pmSchedules = [];
        }

        console.log('PM schedules après filtrage :', this.pmSchedules);
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des PM assignées :', err);
        alert('Impossible de charger les données de PM.');
      }
    });
  }

  get paginatedSchedules(): any[] {
    const data = this.filteredSchedules.length ? this.filteredSchedules : this.pmSchedules;
  const start = (this.currentPage - 1) * this.itemsPerPage;
  return data.slice(start, start + this.itemsPerPage);
}

get totalPages(): number {
  const data = this.filteredSchedules.length ? this.filteredSchedules : this.pmSchedules;
  return Math.ceil(data.length / this.itemsPerPage);
}

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  exportToExcel(): void {
  const source = this.filteredSchedules.length ? this.filteredSchedules : this.pmSchedules;

  const exportData = source.map(pm => ({
    Site: pm.siteName || 'Unknown site',
    'Planned Date': pm.plannedDate ? new Date(pm.plannedDate).toLocaleDateString() : 'N/A',
    'PM Type': pm.pmType,
    Ticket: pm.ticket || 'N/A',
    Status: pm.isUsed ? 'Used' : 'Pending',
    FME: pm.fmeName || 'Not assigned',
    'Vendor ID': pm.fme?.vendorId || 'N/A'
  }));

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const workbook: XLSX.WorkBook = { Sheets: { 'Assigned PMs': worksheet }, SheetNames: ['Assigned PMs'] };

  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

  FileSaver.saveAs(blob, `Assigned_PMs_${new Date().toISOString().split('T')[0]}.xlsx`);
}

applyDateFilter(): void {
  if (!this.startDate || !this.endDate) {
    alert('Veuillez sélectionner les deux dates.');
    return;
  }

  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  let data = this.pmSchedules.filter(pm => {
    const planned = new Date(pm.plannedDate);
    return planned >= start && planned <= end;
  });

  // Filtrage par recherche
  if (this.searchTerm.trim()) {
    const term = this.searchTerm.toLowerCase();
    data = data.filter(pm =>
      (pm.siteName || '').toLowerCase().includes(term) ||
      (pm.ticket || '').toLowerCase().includes(term) ||
      (pm.pmType || '').toLowerCase().includes(term) ||
      (pm.isUsed ? 'used' : 'pending').includes(term) ||
      (pm.fmeName || '').toLowerCase().includes(term)
    );
  }

  this.filteredSchedules = data;
  this.currentPage = 1;
}

resetDateFilter(): void {
  this.startDate = '';
  this.endDate = '';
  this.searchTerm = '';
  this.filteredSchedules = [...this.pmSchedules];
  this.currentPage = 1;
}


}
