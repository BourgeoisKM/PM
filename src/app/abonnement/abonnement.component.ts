import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AbonnementService } from 'src/app/services/abonnement.service';


@Component({
  selector: 'app-abonnement',
  templateUrl: './abonnement.component.html',
  styleUrls: ['./abonnement.component.css']
})
export class AbonnementComponent {
  pages: number = 1;
  dataset: any[] = ['1','2','3','4','5','6','7','8','9','10'];
  list_abonnement: any [] = [];
  constructor(private data: AbonnementService,private router: Router) {

  }
  ngOnInit(): void {
    this.getAbonnement();
  
  }
  getAbonnement(): void {
    this.data.LesAbonnements().subscribe((res : any ) => {
    console.log(res.data);
    this.list_abonnement = res['data'];
    })
  } 
  go(id:any) {

    console.log("-----------");
    
    this.router.navigate(['detail-abon',id])

  } 
}
