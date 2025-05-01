import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-rapport-detail',
  templateUrl: './detail-report.component.html',
  styleUrls: ['./detail-report.component.css']
})
export class DetailReportComponent implements OnInit {
  rapport: any;
  printPage(): void {
    window.print();
  }

  constructor(private route: ActivatedRoute, private data: DataService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('ID reçu :', id);
  
    if (id) {
      this.data.getFullReport(id).subscribe(res => {
        this.rapport = res;
        console.log('Rapport chargé :', res); 
      }, err => {
        console.error('Erreur lors du chargement du rapport :', err); 
      });
    }
  }
}
