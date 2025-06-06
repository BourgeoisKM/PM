import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-rapport-detail',
  templateUrl: './detail-report.component.html',
  styleUrls: ['./detail-report.component.css']
})
export class DetailReportComponent implements OnInit {
  rapport: any = {};
  photos: any[] = [];
  sections: any[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReport(id);
    } else {
      console.warn("Aucun ID fourni dans l'URL.");
      this.isLoading = false;
    }
  }

  private loadReport(id: string): void {
    this.dataService.getFullReport(id).subscribe({
      next: (res) => {
        this.rapport = res || {};
        this.photos = res?.photos || [];
        this.sections = res?.sections || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du rapport :', err);
        this.isLoading = false;
      }
    });
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
      ...report.sections.map((section: any) => ({
  stack: [
    { text: section.title, style: 'sectionTitle' },
    { text: `Issue detected: ${section.hasIssue ? 'Yes' : 'No'}`, italics: true },
    ...section.items.map((item: any) => {
      const value = values.find((v: any) => v.reportItemId === item.id);
      const itemPhotos = allPhotos.filter((p: any) => p.itemId === item.id);

      const itemStack: any[] = [
        { text: item.label, bold: true }
      ];

      if (value) {
        itemStack.push({ text: `Value: ${value.value}` });
        if (value.comment) {
          itemStack.push({ text: `Comment: ${value.comment}` });
        }
      }

      itemPhotos.forEach((p: any) => {
  if (p.base64Image && p.base64Image.startsWith('data:image')) {
    itemStack.push(
      { text: p.comment || 'No comment', italics: true, margin: [0, 0, 0, 5] },
      {
        image: p.base64Image,
        width: 150,
        margin: [0, 0, 0, 10]
      }
    );
  } else {
    console.warn('Image ignorée (format invalide ou manquant) pour l\'item :', item.label);
  }
});


      return {
        stack: itemStack,
        margin: [0, 5, 0, 5]
      };
    })
  ],
  margin: [0, 10, 0, 10]
}))

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
