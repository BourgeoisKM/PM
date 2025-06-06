import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  vendors: any[] = [];
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadVendors();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', Validators.required],
      role: ['', Validators.required],
      vendorId: ['', Validators.required]
    });
  }

  loadVendors(): void {
    this.dataService.getVendors().subscribe({
      next: (res) => {
        this.vendors = res.map((v: any) => ({
          id: v.id,
          name: v.name
        }));
      },
      error: (err) => {
        console.error('Erreur chargement vendors :', err);
        alert('Erreur lors du chargement des vendors.');
      }
    });
  }

  onSubmit(): void {
  if (this.registerForm.valid) {
    const payload = this.registerForm.value;

    console.log('Payload complet :', JSON.stringify(payload, null, 2));
    
    this.dataService.registerUser(payload).subscribe({
      next: (res) => {
        alert('Compte créé avec succès !');
        this.router.navigate(['/login']);
      },
      error: (err) => {
  console.error('Erreur backend complète:', err);

  if (err.status === 500 && err.error?.includes('duplicate key')) {
    alert('Cette adresse email est déjà utilisée. Veuillez en choisir une autre.');
  } else {
    alert('Erreur lors de la création du compte : ' + (err?.error?.message || 'Erreur interne.'));
  }
}

    });
  } else {
    console.log('Formulaire invalide :', this.registerForm.errors, this.registerForm.value);
    alert('Veuillez remplir tous les champs requis.');
  }
}

}
