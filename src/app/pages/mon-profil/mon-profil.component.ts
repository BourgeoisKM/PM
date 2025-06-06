import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-mon-profil',
  templateUrl: './mon-profil.component.html',
  styleUrls: ['./mon-profil.component.css']
})
export class MonProfilComponent implements OnInit {

  nom: string = 'Utilisateur';
  email: string = '';
  role: string = 'Utilisateur';
  path: string = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; // lien icône profil par défaut
  errorMessage: string = '';
  
  hover: boolean = false; // Propriété pour gérer le hover de l’image
  vendorName: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.get<any>('https://pm-backend-3t2n.onrender.com/auth/me', { headers }).subscribe({
  next: (data) => {
    this.nom = data?.fullName || 'Utilisateur';
    this.email = data?.email || '';
    this.role = this.getRoleLabel(data?.role);
    this.path = data?.photo || this.path;
    this.vendorName = data?.vendor?.name || ''; 
  },
  error: (err) => {
    console.error('Erreur récupération profil :', err);
    this.errorMessage = 'Impossible de récupérer les informations du profil.';
  }
});

    } else {
      this.errorMessage = 'Token non trouvé, veuillez vous reconnecter.';
    }
  }

  getRoleLabel(role: string): string {
    switch(role) {
      case 'ops_admin': return 'OPS Admin';
      case 'vendor_admin': return 'Vendor Admin';
      default: return 'Utilisateur';
    }
  }
}
