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

  role = '';
  vendorId = '';
  pmPlanifiees = 0;
  pmExecutees = 0;
  pmEnRetard = 0;

  pieChartData: any;
  pieChartLabels = ['Planifiées', 'Exécutées', 'En retard'];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getCurrentUser().pipe(take(1)).subscribe({
      next: (user) => {
        if (!user) {
          console.error('Utilisateur non authentifié.');
          return;
        }
        this.role = user.role;
        this.vendorId = user.vendorId || '';
        this.loadStats();
        this.setupThemeToggle();
      },
      error: (err) => console.error('Erreur récupération utilisateur :', err)
    });
  }

 loadStats(): void {
  console.log('Chargement des stats, role:', this.role, 'vendorId:', this.vendorId);

  this.dataService.getAssignedPMs().pipe(take(1)).subscribe({
    next: (assignedPMs) => {
      console.log('PM assignées récupérées:', assignedPMs);

      // Filtrer selon rôle
      const pmsFiltres = this.role === 'vendor_admin'
        ? assignedPMs.filter(pm => pm.vendorId === this.vendorId)
        : assignedPMs;

      this.pmPlanifiees = pmsFiltres.length;
      this.pmPlanifiees =assignedPMs.length;
      console.log('PM planifiées filtrées:', this.pmPlanifiees);

      this.dataService.getReports().pipe(take(1)).subscribe({
        next: (reports) => {
          this.pmExecutees=reports.length;
          console.log('Rapports récupérés:', reports);

          const rapportsFiltres = this.role === 'vendor_admin'
            ? reports.filter(r => r.vendorId === this.vendorId)
            : reports;

          let executees = 0;
          let enRetard = 0;
          const now = new Date();

          for (const pm of pmsFiltres) {
            const rapportExiste = rapportsFiltres.some(
              r => r.siteId === pm.siteId && r.pmType === pm.pmType
            );
            const datePlanifiee = new Date(pm.plannedDate);
            if (isNaN(datePlanifiee.getTime())) {
              console.warn('Date planifiée invalide pour PM:', pm);
              continue;
            }

            if (rapportExiste) {
              executees++;
            } else if (datePlanifiee < now) {
              enRetard++;
            }
          }
          executees=reports.length
          this.pmExecutees = executees;
          this.pmEnRetard = enRetard;
         
          console.log('PM exécutées:', executees, 'PM en retard:', enRetard);

          this.updatePieChart();
        },
        error: (err) => {
          console.error('Erreur récupération rapports :', err);
        }
      });
    },
    error: (err) => {
      console.error('Erreur récupération PM assignées :', err);
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

    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }
}
