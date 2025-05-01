import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import Swal from 'sweetalert2'


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  phone: string = "";
  pass: string = "";

  // Identifiants par défaut (TEMPORAIRES)
  private defaultUser = {
    phone: 'Bourgeois',
    pass: '1234'
  };

  constructor(private dataService: DataService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Veuillez remplir tous les champs correctement !',
      });
      return;
    }

    Swal.fire({
      title: 'Chargement...',
      width: 300,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Vérification des identifiants par défaut
    if (form.value.phone === this.defaultUser.phone && form.value.pass === this.defaultUser.pass) {
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Connexion réussie !',
        text: 'Bienvenue Admin !',
        timer: 2000
      }).then(() => {
        this.router.navigate(['home']); // Redirection
      });
      return;
    }

    // Sinon, on tente la connexion via l'API
    this.dataService.login(form.value.phone, form.value.pass).subscribe(
      (response: any) => {
        console.log('Login successful', response);
        Swal.close();
        Swal.fire({
          icon: 'success',
          title: 'Connexion réussie !',
          text: 'Bienvenue !',
          timer: 2000
        }).then(() => {
          this.router.navigate(['home']);
        });
      },
      (error) => {
        console.error('Login failed', error);
        Swal.fire({
          icon: 'error',
          title: 'Échec de connexion',
          text: 'Vérifiez vos identifiants et réessayez.',
        });
      }
    );
  }
}

     // if (res.user != null) {
        //this.dataService.saveData(res.user);
       // Swal.close();
        //Swal.fire({ position: 'center', icon: 'success', title: "Connexion reussi", showConfirmButton: false, timer: 1500 });
        // Swal.
     //   this.router.navigate(['home']);
     // }

   // });



 // }

//}
