import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

export default pdfMake;

@Component({
  selector: 'app-rapport-detail',
  templateUrl: './detail-report.component.html',
  styleUrls: ['./detail-report.component.css']
})
export class DetailReportComponent implements OnInit {
  rapport: any = {};      // Données complètes du rapport
  photos: any[] = [];     // Liste des photos jointes
  sections: any[] = [];   // Sections du rapport
  isLoading: boolean = true; // Indicateur de chargement

  constructor(
    private route: ActivatedRoute,
    private data: DataService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('ID du rapport reçu :', id);

    if (id) {
      this.data.getFullReport(id).subscribe(
        (res) => {
          this.rapport = res || {};
          this.photos = res?.photos || [];
          this.sections = res?.sections || [];
          console.log('Rapport chargé avec succès :', this.rapport);
          this.isLoading = false;
        },
        (err) => {
          console.error('Erreur lors du chargement du rapport :', err);
          this.isLoading = false;
        }
      );
    } else {
      console.warn("Aucun ID fourni dans l'URL.");
      this.isLoading = false;
    }
  }

  printPage(): void {
    window.print();
  }

  exportToPDF(): void {
    const report = this.rapport?.report;
    const values = this.rapport?.values || [];
    const allPhotos = this.rapport?.photos || [];

    if (!report) {
      console.warn('Aucun rapport disponible pour export.');
      return;
    }

    const docDefinition: any = {
      content: [

        { text: 'Preventive Maintenance Report', style: 'header' },
        { text: `Site: ${report.site?.name}`, style: 'subheader' },
        { text: `Region: ${report.site?.region} / Province: ${report.site?.province}` },
        { text: `Coordinates: ${report.site?.latitude}, ${report.site?.longitude}` },
        { text: `Tenants: ${report.site?.tenantsNames}` },
        { text: `Portfolio: ${report.site?.portfolio}` },
        { text: `Power Configuration: ${report.site?.powerConfiguration}` },
        { text: `Site Type: ${report.site?.siteType}`, margin: [0, 0, 0, 10] },

        { text: 'Report Summary', style: 'subheader' },
        {
          ul: [
            `FME: ${report.fmeName}`,
            `PM Planned Date: ${new Date(report.pmPlannedDate).toLocaleDateString()}`,
            `PM Actual Date: ${new Date(report.pmActualDate).toLocaleDateString()}`,
            `PM Type: ${report.pmType}`,
            `Status: ${report.status}`
          ]
        },

        { text: 'Sections', style: 'subheader', margin: [0, 20, 0, 8] },

        ...report.sections.map((section: any) => {
          return {
            stack: [
              { text: section.title, style: 'sectionTitle' },
              { text: `Issue detected: ${section.hasIssue ? 'Yes' : 'No'}`, italics: true },
              ...section.items.map((item: any) => {
               const value = values.find((v: any) => v.reportItemId === item.id);
               const photos = allPhotos.filter((p: any) => p.itemId === item.id);

                return {
                  stack: [
                    { text: item.label, bold: true },
                    value ? { text: `Value: ${value.value}` } : '',
                    value?.comment ? { text: `Comment: ${value.comment}` } : '',
                    ...photos.map((p: any) => ({
  text: `Photo: ${p.comment || 'No comment'}`
}))
                  ],
                  margin: [0, 5, 0, 5]
                };
              })
            ],
            margin: [0, 10, 0, 10]
          };
        })
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        sectionTitle: {
          fontSize: 13,
          bold: true,
          color: '#2c3e50',
          margin: [0, 10, 0, 4]
        }
      }
    };

    pdfMake.createPdf(docDefinition).open();
  }
}
