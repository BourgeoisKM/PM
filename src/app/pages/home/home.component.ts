import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { AbonnementService } from 'src/app/services/abonnement.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  nbre_user: Number = 0;
  nbre_domaine: Number = 0;
  nbre_abon: number =0;
  nbre_sug:number =0;
  nombreRapports: number = 0;
  assignedPMCount: number = 0;
  constructor(private data: DataService, private router: Router, private abon:AbonnementService) {

  }
  ngOnInit(): void {
    this.loadReports();
    this.loadAssignedPMs();
    this.getReportCount();
  }
  loadReports(): void {
    this.data.getreport().pipe(take(1)).subscribe((res: any) => {
      this.nombreRapports = res.length;
      console.log('Nombre de rapports:', this.nombreRapports);
    }, error => {
      console.error('Erreur lors de la récupération des rapports', error);
    });
  }
  loadAssignedPMs() {
    this.data.getAssignedPMs().subscribe(
      (data) => {
        this.assignedPMCount = data.length;
      },
      (error) => {
        console.error('Erreur lors de la récupération des PM assignées', error);
      }
    );
  }
  reportCount: number = 0;

  getReportCount() {
    const reportId = 'cc0f64ea-ee25-4289-87bf-01256e1d4cd3';
  
    this.data.getFullReport(reportId).subscribe({
      next: (res: any) => {
        this.reportCount = res ? 1 : 0;
        console.log('Rapport reçu :', res);
        console.log('Nombre de rapports :', this.reportCount);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du rapport :', err);
        this.reportCount = 0;
      }
    });
  }
  


}
