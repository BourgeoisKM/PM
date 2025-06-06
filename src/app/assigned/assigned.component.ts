import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-assigned',
  templateUrl: './assigned.component.html',
  styleUrls: ['./assigned.component.css']
})
export class AssignedComponent implements OnInit {
  pmForm!: FormGroup;
  fme: any[] = [];
  allSites: any[] = [];
  sites: any[] = [];
  assignedItems: any[] = [];
  filteredItems: any[] = [];

  currentUserRole: string = '';
  currentUserVendorId: string = '';

  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAllSites();

    forkJoin({
      user: this.dataService.getCurrentUser(),
      assigned: this.dataService.getAssignedPMs()
    }).subscribe({
      next: ({ user, assigned }) => {
        this.currentUserVendorId = (user.vendorId || '').trim().toLowerCase();
        this.currentUserRole = (user.role || '').trim().toLowerCase();
        console.log(`Utilisateur : role=${this.currentUserRole}, vendorId=${this.currentUserVendorId}`);

        this.assignedItems = assigned || [];
        this.filteredItems = this.filterByVendor(this.assignedItems, this.currentUserVendorId);

        this.loadFMEs();
      },
      error: err => console.error('Erreur forkJoin :', err)
    });
  }

  private initForm(): void {
    this.pmForm = this.fb.group({
      fmeId: ['', Validators.required],
      siteId: ['', Validators.required],
      plannedDate: ['', Validators.required],
      pmType: ['', Validators.required]
    });
  }

  private loadFMEs(): void {
    this.dataService.getUsers().subscribe({
      next: (users: any[]) => {
        let fmUsers = users.filter(u => (u.role || '').toLowerCase() === 'fme');

        if (this.currentUserRole === 'vendor_admin') {
          fmUsers = fmUsers.filter(fme =>
            (fme.vendorId || '').trim().toLowerCase() === this.currentUserVendorId
          );
        }

        this.fme = fmUsers;
        console.log('FMEs filtrés:', this.fme);
      },
      error: err => console.error('Erreur chargement FMEs :', err)
    });
  }

  private loadAllSites(): void {
    this.dataService.getSites().subscribe({
      next: (sites: any[]) => {
        if (this.currentUserRole === 'vendor_admin') {
          this.allSites = sites.filter(site =>
            (site.vendorId || '').trim().toLowerCase() === this.currentUserVendorId
          );
        } else {
          this.allSites = sites;
        }
        console.log('Sites chargés:', this.allSites);
      },
      error: err => console.error('Erreur chargement sites :', err)
    });
  }

  private filterByVendor(items: any[], vendorId: string): any[] {
    return items.filter(item =>
      (item.vendorId || '').trim().toLowerCase() === vendorId
    );
  }

  filterSitesByFME(fmeId: string): void {
    const selectedFME = this.fme.find(f => String(f.id) === String(fmeId));

    if (!selectedFME || !selectedFME.vendorId) {
      this.sites = [];
      this.pmForm.get('siteId')?.setValue('');
      return;
    }

    const fmeVendorId = selectedFME.vendorId.trim().toLowerCase();

    this.sites = this.allSites.filter(site =>
      (site.vendorId || '').trim().toLowerCase() === fmeVendorId
    );

    this.pmForm.get('siteId')?.setValue(this.sites.length === 1 ? this.sites[0].id : '');
  }

  onFMEChange(event: Event): void {
    const selectedId = (event.target as HTMLSelectElement).value;
    this.filterSitesByFME(selectedId);
  }

  assignPM(): void {
    if (this.pmForm.invalid) {
      this.pmForm.markAllAsTouched();
      console.warn('Formulaire invalide');
      return;
    }

    const formData = this.pmForm.value;
    console.log('Soumission PM:', formData);

    this.dataService.assignPreventiveMaintenance(formData).subscribe({
      next: res => {
        console.log('Assignation réussie :', res);
        this.pmForm.reset();
        this.sites = [];
      },
      error: err => console.error('Erreur assignation :', err)
    });
  }
}
