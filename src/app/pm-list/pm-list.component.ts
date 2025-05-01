import {
  Component,
  OnInit
} from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-pm-list',
  templateUrl: './pm-list.component.html',
  styleUrls: ['./pm-list.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PmListComponent implements OnInit {
  pmSchedules: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadPMSchedules();
  }

  loadPMSchedules(): void {
    this.dataService.getAssignedPMs().subscribe(
      (res) => {
        this.pmSchedules = res;
      },
      (error) => {
        console.error('Erreur lors du chargement des PM assignées', error);
      }
    );
  }

  get paginatedSchedules() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.pmSchedules.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.pmSchedules.length / this.itemsPerPage);
  }

  changePage(page: number) {
    this.currentPage = page;
  }
}
