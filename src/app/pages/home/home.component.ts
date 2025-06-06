import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { take } from 'rxjs/operators';

interface PM {
  siteId: string;
  pmType: string;
  plannedDate: string;
  vendorId: string;
}

interface Report {
  siteId: string;
  pmType: string;
  vendorId: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  role: string = '';
  vendorId: string = '';
  nombreRapports = 0;
  pmPlanifiees = 0;
  pmExecutees = 0;
  pmEnRetard = 0;

  pieChartData: any;
  pieChartLabels = ['Planifiées', 'Exécutées', 'En retard'];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
  const currentUser = this.dataService.getCurrentUser();
  if (!currentUser) {
    console.error('Utilisateur non authentifié.');
    return;
  }

  this.role = currentUser.role;
  this.vendorId = currentUser.vendorId || '';
  this.loadStats();
  this.setupThemeToggle();
}


  loadStats(): void {
    this.dataService.getAssignedPMs().pipe(take(1)).subscribe({
      next: (assignedPMs: PM[]) => {
        console.log('PM assignées récupérées :', assignedPMs); 
        const pmsFiltres = this.role === 'vendor_admin'
          ? assignedPMs.filter(pm => pm.vendorId === this.vendorId)
          : assignedPMs;

        this.pmPlanifiees = pmsFiltres.length;

        this.dataService.getReports().pipe(take(1)).subscribe({
          next: (reports: Report[]) => {
            const rapportsFiltres = this.role === 'vendor_admin'
              ? reports.filter(r => r.vendorId === this.vendorId)
              : reports;

            this.nombreRapports = rapportsFiltres.length;

            const now = new Date();
            let enRetard = 0;
            let executees = 0;

            for (const pm of pmsFiltres) {
              const rapportExiste = rapportsFiltres.some(
                r => r.siteId === pm.siteId && r.pmType === pm.pmType
              );

              const datePlanifiee = new Date(pm.plannedDate);
              if (isNaN(datePlanifiee.getTime())) continue; // Ignore dates invalides

              if (rapportExiste) {
                executees++;
              } else if (datePlanifiee < now) {
                enRetard++;
              }
            }

            this.pmExecutees = executees;
            this.pmEnRetard = enRetard;

            this.updatePieChart();
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des rapports :', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des PM assignées :', err);
      }
    });
  }

  updatePieChart(): void {
    this.pieChartData = {
      labels: this.pieChartLabels,
      datasets: [{
        data: [this.pmPlanifiees, this.pmExecutees, this.pmEnRetard],
        backgroundColor: ['#36A2EB', '#4BC0C0', '#FF6384']
      }]
    };
  }

  setupThemeToggle(): void {
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn?.addEventListener('click', () => {
      const darkMode = document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }
}
