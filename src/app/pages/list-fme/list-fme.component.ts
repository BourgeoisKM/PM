import { Component, OnInit } from '@angular/core';
import { FmeService } from 'src/app/services/fme.service';
import { DataService } from 'src/app/services/data.service';  
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list-fme',
  templateUrl: './list-fme.component.html',
  styleUrls: ['./list-fme.component.css']
})
export class ListFmeComponent implements OnInit {
  fmeUsers: any[] = [];
  vendors: any[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(
    private fmeService: FmeService,
    private dataService: DataService,      
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadVendors();  
    this.loadFmeUsers();
  }

  loadFmeUsers(): void {
    this.fmeService.getUsers().subscribe({
      next: (users: any[]) => {
        this.fmeUsers = users.filter(user => user.role === 'fme');
        this.totalPages = Math.ceil(this.fmeUsers.length / this.itemsPerPage);
        this.currentPage = 1; // reset page
      },
      error: () => {
        this.toastr.error('Erreur lors du chargement des utilisateurs');
      }
    });
  }

  loadVendors(): void {
    this.dataService.getVendors().subscribe({
      next: (data) => {
        this.vendors = data;
      },
      error: () => {
        this.toastr.error('Erreur lors du chargement des vendors');
      }
    });
  }

  getVendorName(id: string): string {
    const vendor = this.vendors.find(v => v.id === id);
    return vendor ? vendor.name : 'Non spécifié';
  }

  deleteUser(id: string): void {
    if (confirm('Confirmez-vous la suppression de cet utilisateur ?')) {
      this.fmeService.deleteUser(id).subscribe({
        next: () => {
          this.toastr.success('Utilisateur supprimé avec succès');
          this.fmeUsers = this.fmeUsers.filter(user => user.id !== id);
          this.totalPages = Math.ceil(this.fmeUsers.length / this.itemsPerPage);
          if(this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
          }
        },
        error: () => {
          this.toastr.error('Échec de la suppression');
        }
      });
    }
  }

  // Utilisateurs à afficher sur la page courante
  get paginatedFmeUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.fmeUsers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Navigation pages
  goToPage(page: number): void {
    if(page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
}
