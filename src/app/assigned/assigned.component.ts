import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-assigned',
  templateUrl: './assigned.component.html',
  styleUrls: ['./assigned.component.css']
})
export class AssignedComponent implements OnInit {
  pmForm!: FormGroup;
  sites: any[] = [];
  fme: any[] = [];
  isLoadingFME: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.pmForm = this.fb.group({
      siteId: ['', Validators.required],
      plannedDate: ['', Validators.required],
      fmeId: ['', Validators.required],
      pmType: ['', Validators.required]
    });

    this.loadSites();
    this.assignPMSchedule();
  }

  loadSites() {
    this.dataService.getSites().subscribe({
      next: (res: any[]) => {
        this.sites = res;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sites :', err);
        alert('Impossible de charger les sites depuis la base de données.');
      }
    });
  }  

  assignPMSchedule() {
    this.isLoadingFME = true;
  this.dataService.getUsers().subscribe(
    (res: any[]) => {
      this.fme = res.filter(user => user.role.toLowerCase() === 'fme');
      this.isLoadingFME = false;
    },
    (err) => {
      console.error('Erreur lors du chargement des utilisateurs FME', err);
      this.isLoadingFME = false;
    }
  );
  }

  assignPM() {
    if (this.pmForm.valid) {
      const formData = this.pmForm.value;
      const payload = {
        siteId: formData.siteId,
        plannedDate: formData.plannedDate,
        fmeId: formData.fmeId,
        pmType: formData.pmType
      };

      this.dataService.assignPreventiveMaintenance(payload).subscribe({
        next: () => {
          alert('PM assignée avec succès !');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors de l’assignation : ' + (err.error?.message || 'Erreur serveur'));
        }
      });
    } else {
      alert('Veuillez remplir tous les champs requis.');
    }
  }
}
