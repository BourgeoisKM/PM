import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import { DataService } from 'src/app/services/data.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface Report {
  report?: {
    id?: string;
    vendorId?: string;
    site?: {
      name?: string;
      siteId?: string;
      province?: string;
      region?: string;
      siteType?: string;
      powerConfiguration?: string;
      portfolio?: string;
      tenantsNames?: string;
    };
    fme?: {
      fullName?: string;
      vendorId?: string;  
    };
    fmeName?: string;
    pmType?: string;
    pmPlannedDate?: string;
    pmActualDate?: string;
    status?: string;
    isSubmitted?: boolean;
    submittedAt?: string;
    validationComment?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  [key: string]: any;
}

@Component({
  selector: 'app-all-reports',
  templateUrl: './all-reports.component.html',
  styleUrls: ['./all-reports.component.css']
})
export class AllReportsComponent implements OnInit {
  reports: Report[] = [];
  allReportsBackup: Report[] = [];
  pagedReports: Report[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  loading = true;
  error: string | null = null;
  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  searchTerm = '';

  currentUser: { role?: string; vendorId?: string; [key: string]: any } | null = null;

  constructor(private data: DataService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.data.getCurrentUser();
    if (!this.currentUser) {
      console.error("Utilisateur non connecté !");
      this.router.navigate(['/login']);
      return;
    }
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.error = null;

    this.data.getReports().subscribe(
      (res: Report[]) => {
        if (res && Array.isArray(res) && res.length > 0) {
          let filteredReports = res;
          if (this.currentUser?.role === 'vendor_admin') {
            filteredReports = res.filter(r =>
              r?.report?.fme?.vendorId === this.currentUser?.vendorId
            );
          }
          this.allReportsBackup = filteredReports;
          this.reports = [...this.allReportsBackup];
          this.currentPage = 1;
          this.calculateTotalPages();
          this.setPagedReports();
        } else {
          this.error = 'Aucun rapport valide trouvé.';
          this.reports = [];
          this.pagedReports = [];
          this.totalPages = 0;
        }
        this.loading = false;
      },
      (err: any) => {
        console.error('Erreur lors du chargement des rapports :', err);
        this.error = 'Erreur de chargement des rapports.';
        this.loading = false;
      }
    );
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.reports.length / this.itemsPerPage);
  }

  setPagedReports(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedReports = this.reports.slice(startIndex, startIndex + this.itemsPerPage);
  }

  applyDateFilter(): void {
    if (!this.filterStartDate && !this.filterEndDate) {
      this.reports = [...this.allReportsBackup];
      this.currentPage = 1;
      this.calculateTotalPages();
      this.setPagedReports();
      return;
    }

    const start = this.filterStartDate ? new Date(this.filterStartDate) : null;
    const end = this.filterEndDate ? new Date(this.filterEndDate) : null;

    this.reports = this.allReportsBackup.filter(r => {
      if (!r.report?.pmPlannedDate) return false;
      const reportDate = new Date(r.report.pmPlannedDate);
      if (start && end) return reportDate >= start && reportDate <= end;
      if (start) return reportDate >= start;
      if (end) return reportDate <= end;
      return true;
    });

    this.currentPage = 1;
    this.calculateTotalPages();
    this.setPagedReports();
  }

  resetFilter(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.searchTerm = '';
    this.reports = [...this.allReportsBackup];
    this.currentPage = 1;
    this.calculateTotalPages();
    this.setPagedReports();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.setPagedReports();
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


  private flattenObject(obj: any, prefix = ''): any {
    let result: any = {};
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }

  exportExcel(): void {
  if (!this.reports.length) {
    console.warn("Aucun rapport à exporter.");
    return;
  }

  const flattenObject = (obj: any, prefix = ''): any => {
    let result: any = {};
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, newKey));
      } else if (!Array.isArray(value)) {
        result[newKey] = value;
      }
    }
    return result;
  };

  const dataToExport: any[] = [];

  this.reports.forEach(report => {
    const baseReportData = flattenObject(report.report || {});


    if (!report['sections'] || !Array.isArray(report['sections']) || report['sections'].length === 0) {
      dataToExport.push(baseReportData);
      return;
    }

    report['sections'].forEach((section: any) => {
      const flatSection = flattenObject(section, 'section');

      if (!section.items || !Array.isArray(section.items) || section.items.length === 0) {
        dataToExport.push({ ...baseReportData, ...flatSection });
        return;
      }

     
      section.items.forEach((item: any) => {
        const flatItem = flattenObject(item, 'item');
        dataToExport.push({ ...baseReportData, ...flatSection, ...flatItem });
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapports');
  XLSX.writeFile(workbook, 'rapports_complets.xlsx');
}


  voirRapport(report: Report): void {
    const reportId = report?.report?.id || report?.['id'];
    if (reportId) {
      this.router.navigate(['/rapport', reportId]);
    } else {
      console.warn("L'ID du rapport est introuvable.");
    }
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.reports = this.allReportsBackup.filter(report => {
      const siteName = report.report?.site?.name?.toLowerCase() || '';
      return siteName.includes(term);
    });

    this.currentPage = 1;
    this.calculateTotalPages();
    this.setPagedReports();
  }
}
