import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';

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

  currentUserRole: string = '';
  currentUserVendorId: string = '';

  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.initForm();

    const user = this.dataService.getCurrentUser();
    this.currentUserRole = (user.role || '').toLowerCase();
    this.currentUserVendorId = user.vendorId || '';

    this.loadFMEs();
    this.loadAllSites();

    // Quand on change le FME, on filtre les sites
    this.pmForm.get('fmeId')?.valueChanges.subscribe(fmeId => {
      this.filterSitesByFME(fmeId);
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
          fmUsers = fmUsers.filter(fme => fme.vendorId === this.currentUserVendorId);
        }
        this.fme = fmUsers;
      },
      error: err => {
        console.error('Erreur lors du chargement des FME :', err);
      }
    });
  }

  private loadAllSites(): void {
    this.dataService.getSites().subscribe({
      next: (sites: any[]) => {
        this.allSites = sites;
      },
      error: err => {
        console.error('Erreur lors du chargement des sites :', err);
      }
    });
  }

  private filterSitesByFME(fmeId: string): void {
    if (!fmeId) {
      this.sites = [];
      this.pmForm.get('siteId')?.setValue('');
      return;
    }

    const selectedFME = this.fme.find(fme => String(fme.id) === String(fmeId));
    if (!selectedFME) {
      this.sites = [];
      this.pmForm.get('siteId')?.setValue('');
      return;
    }

    const vendorId = selectedFME.vendorId;

    // Filtrer les sites par vendorId du FME sélectionné
    this.sites = this.allSites.filter(site => site.vendorId === vendorId);

    // Réinitialiser la sélection du site
    this.pmForm.get('siteId')?.setValue('');
  }

  // <-- AJOUT de la méthode assignPM() ici -->
  assignPM(): void {
    if (this.pmForm.invalid) {
      console.warn('Formulaire invalide');
      this.pmForm.markAllAsTouched();
      return;
    }

    const formData = this.pmForm.value;
    console.log('Assign PM avec les données:', formData);

    // Ici tu peux appeler une méthode de ton service pour sauvegarder
    // Exemple : this.dataService.assignPreventiveMaintenance(formData).subscribe(...)
  }
}
