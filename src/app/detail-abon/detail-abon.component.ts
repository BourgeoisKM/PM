import { Component } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { AbonnementService } from '../services/abonnement.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detail-abon',
  templateUrl: './detail-abon.component.html',
  styleUrls: ['./detail-abon.component.css']
})
export class DetailAbonComponent {
  abons: [] = [] ;
  abon :any;
  isLoading:Boolean = true;
  id : any ="";
  constructor(private data: AbonnementService, private router: Router, private route: ActivatedRoute) {

  }
  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.loadData(this.id);
  }

  loadData(id: any): void{
    Swal.fire({
      title: 'Chargement !',
      width: 300,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading()
      }
    });
    this.data.LesAbonnements().subscribe((res: any) => {
      let ver;
      this.abons = res['data'];
      this.abons.forEach((el) => {
        if(el['_id']==id){
          this.abon=el;
        }
      });  
     
      
      
      console.log(res.abon);
      
      Swal.close();
      this.isLoading = false;


    })
  
  }
  go(id:any) {

    console.log("-----------");
    
    this.router.navigate(['abon','detail-abon',id])

  }
  
}
