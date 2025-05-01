import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {

  user:any;
  isLoading:Boolean = true;
  id: any = "";
  constructor(private data: DataService, private router: Router, private route: ActivatedRoute) {

  }
  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.loadData(this.id);
  }

  loadData(id: any): void {
    Swal.fire({
      title: 'Chargement !',
      width: 300,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading()
      }
    });
    this.data.getExpert(id).subscribe((res: any) => {
      this.user=res.user;
      console.log(this.user);
      
      Swal.close();
      this.isLoading = false;


    })
  }



}
