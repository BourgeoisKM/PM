import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import { DataService } from 'src/app/services/data.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-all-reports',
  templateUrl: './all-reports.component.html',
  styleUrls: ['./all-reports.component.css']
})
export class AllReportsComponent implements OnInit {
  pages: number = 1;
  reports: any[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private data: DataService, private router: Router) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.data.getreport().subscribe(
      (res: any[]) => {
        console.log('Réponse de l\'API:', res);

        if (res && Array.isArray(res) && res.length > 0) {
          this.reports = res.map(report => ({
            ...report,
            siteName: report.site?.name || 'N/A',
            fmeFullName: report.fme?.fullName || 'Inconnu',
            status: report.status ? report.status.toUpperCase() : 'NON DEFINI'
          }));
        } else {
          this.error = 'Aucun rapport valide trouvé.';
        }

        this.loading = false;
      },
      (err) => {
        console.error('Erreur lors du chargement des rapports:', err);
        this.error = 'Erreur de chargement des rapports.';
        this.loading = false;
      }
    );
  }

  exportPDF(): void {
    const DATA = document.getElementById('rapportTable');
    if (DATA) {
      html2canvas(DATA).then(canvas => {
        const fileWidth = 210;
        const fileHeight = (canvas.height * fileWidth) / canvas.width;

        const FILEURI = canvas.toDataURL('image/png');
        const PDF = new jsPDF();
        PDF.addImage(FILEURI, 'PNG', 0, 10, fileWidth, fileHeight);
        PDF.save('rapports.pdf');
      });
    }
  }

  exportExcel(): void {
    const element = document.getElementById('rapportTable');
    if (element) {
      const worksheet = XLSX.utils.table_to_sheet(element);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapports');
      XLSX.writeFile(workbook, 'rapports.xlsx');
    } else {
      console.warn("Élément HTML non trouvé pour l'export Excel.");
    }
  }

  voirRapport(report: any): void {
    if (report?.id) {
      this.router.navigate(['/rapport', report.id]);
    } else {
      console.warn("L'ID du rapport est introuvable.");
    }
  }
}
