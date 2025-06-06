import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  allowedRoles: string[] = ['vendor_admin', 'pm_analyst', 'ops_admin', 'noc_supervisor'];

  constructor(private dataService: DataService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        icon: 'error',
        title: 'Champs requis',
        text: 'Veuillez remplir tous les champs.'
      });
      return;
    }

    Swal.fire({
      title: 'Connexion en cours...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    const payload = {
      email: this.email,
      password: this.password
    };

    this.dataService.login(payload).subscribe({
      next: (res: any) => {
        Swal.close();

        if (res.user && res.token) {
          const userRole = res.user.role?.toLowerCase();

          if (!this.allowedRoles.includes(userRole)) {
            Swal.fire({
              icon: 'error',
              title: 'Accès refusé',
              text: 'Rôle non autorisé.'
            });
            return;
          }

          //  Stockage sécurisé
          localStorage.setItem('token', res.token);
          localStorage.setItem('currentUser', JSON.stringify(res.user)); 
          Swal.fire({
            icon: 'success',
            title: 'Connexion réussie !',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/home']);
          });

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Réponse invalide du serveur.'
          });
        }
      },
      error: (err) => {
        Swal.close();
        console.error('Erreur login:', err);

        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.error?.message || 'Email ou mot de passe incorrect.'
        });
      }
    });
  }
}
