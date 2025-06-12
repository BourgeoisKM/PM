import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');

    if (token!=null) {

      return true;
    }else {
 this.router.navigate(['auth/login']);
      localStorage.clear();
     return false;
    }

//     try {
//       const decoded: JwtPayload = jwtDecode(token);
//       const now = Math.floor(Date.now() / 1000);

//       if (decoded.exp < now) {
//         localStorage.clear();
//         this.router.navigate(['']);
//         return false;
//       }

//       return true;
//     } catch (e) {
//       localStorage.clear();
// this.router.navigate(['']);

//       return false;
//     }
}
}
