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

interface StatRegion {
  region: string;
  count: number;
}

interface StatPowerConfig {
  powerConfiguration: string;
  count: number;
}

interface StatProvince {
  province: string;
  count: number;
}

interface StatSiteType {
  siteType: string;
  count: number;
}

interface StatVendor {
  vendorId: string;
  vendorName: string;
  count: number;
}

interface PowerTypes {
  solar: number;
  grid: number;
  hybrid: number;
  dg: number;
  battery: number;
}

interface StatsResponse {
  total: number;
  byRegion: StatRegion[];
  byPowerConfig: StatPowerConfig[];
  byProvince: StatProvince[];
  bySiteType: StatSiteType[];
  byVendor: StatVendor[];
  powerTypes: PowerTypes;
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

  totalSites = 0;
  byRegion: StatRegion[] = [];
  byVendor: StatVendor[] = [];
  powerTypes: PowerTypes = { solar: 0, grid: 0, hybrid: 0, dg: 0, battery: 0 };

  // Charts data
  regionChartLabels: string[] = [];
  regionChartData: any[] = [];

  powerTypeChartLabels: string[] = ['Solar', 'Grid', 'Hybrid', 'DG', 'Battery'];
  powerTypeChartData: any[] = [];

  vendorChartLabels: string[] = [];
  vendorChartData: any[] = [];

  pieChartLabels: string[] = ['Planifiées', 'Exécutées', 'En retard'];
  pieChartData: number[] = [];

  // Chart options
  barChartOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  };

  pieChartOptions = {
    responsive: true,
    cutout: '50%'
  };

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
    this.dataService.getAssignedPMs().pipe(take(1)).subscribe({
      next: (assignedPMs) => {
        const pmsFiltres = this.role === 'vendor_admin'
          ? assignedPMs.filter(pm => pm.vendorId === this.vendorId)
          : assignedPMs;

        this.pmPlanifiees = pmsFiltres.length;

        this.dataService.getReports().pipe(take(1)).subscribe({
          next: (reports) => {
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
              if (isNaN(datePlanifiee.getTime())) continue;

              if (rapportExiste) {
                executees++;
              } else if (datePlanifiee < now) {
                enRetard++;
              }
            }
            this.pmExecutees = executees;
            this.pmEnRetard = enRetard;

            this.updatePieChart();

            this.dataService.getStats().pipe(take(1)).subscribe({
              next: (stats: StatsResponse) => {
                this.totalSites = stats.total;
                this.byRegion = stats.byRegion;
                this.byVendor = stats.byVendor;
                this.powerTypes = stats.powerTypes;
                this.updateCharts();
              },
              error: (err) => console.error('Erreur récupération stats:', err)
            });
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
    this.pieChartData = [
      this.pmPlanifiees,
      this.pmExecutees,
      this.pmEnRetard
    ];
  }

  updateCharts(): void {
    this.regionChartLabels = this.byRegion.map(r => r.region);
    this.regionChartData = [
      {
        data: this.byRegion.map(r => r.count),
        label: 'Sites par Région',
        backgroundColor: '#42A5F5'
      }
    ];

    this.powerTypeChartData = [
      {
        data: [
          this.powerTypes.solar,
          this.powerTypes.grid,
          this.powerTypes.hybrid,
          this.powerTypes.dg,
          this.powerTypes.battery
        ],
        backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF6384']
      }
    ];

    this.vendorChartLabels = this.byVendor.map(v => v.vendorName);
    this.vendorChartData = [
      {
        data: this.byVendor.map(v => v.count),
        label: 'Sites par Vendor',
        backgroundColor: '#FFA726'
      }
    ];
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
