import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  nom: any = "";
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    "this.nom = localStorage.getItem('NOM_USER');"
   
    if (this.nom == null) {
      window.location.href = "/";
      return false;
    } else {
      console.log('*************');
      return true;

    }

  }

}
