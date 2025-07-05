import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  nom: string = '';
  path: string = '';
  roleLabel: string = 'Utilisateur';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
  const token = localStorage.getItem('token');

  if (token) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>('https://pmapi.cd-ecinfras.com/auth/me', { headers }).subscribe({
      next: (data) => {
        this.nom = data?.fullName || 'Utilisateur';
        this.path = data?.photo || 'assets/img/default-profile.png';
        this.roleLabel = this.getRoleLabel(data?.role);
      },
      error: (err) => {
        console.warn('Profil non récupéré, mais session maintenue. Erreur :', err);
        // On garde des valeurs par défaut, pas de déconnexion automatique
        this.nom = 'Utilisateur';
        this.path = 'assets/img/default-profile.png';
        this.roleLabel = 'Utilisateur';
      }
    });
  } else {
    // Aucun token => nom par défaut
    this.nom = 'Utilisateur';
    this.path = 'assets/img/default-profile.png';
    this.roleLabel = 'Utilisateur';
  }
}


  getRoleLabel(role: string): string {
    switch (role) {
      case 'ops_admin': return 'OPS Admin';
      case 'vendor_admin': return 'Vendor Admin';
      default: return 'Utilisateur';
    }
  }

  logout() {
    localStorage.clear();
    window.location.href = '/';
  }
}
