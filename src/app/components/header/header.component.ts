import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit{


   nom :any = '';
   path :any = '';

   ngOnInit():void{
      // this.nom = localStorage.getItem('NOM_USER');
      // this.path = localStorage.getItem('PROFIL_USER');
      // console.log(this.nom);
      
   }

   logout(){
      localStorage.clear();
      window.location.href = '/';
   }
}
