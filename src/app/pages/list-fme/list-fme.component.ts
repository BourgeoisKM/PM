import { Component, OnInit } from '@angular/core';
import { FmeService } from 'src/app/services/fme.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list-fme',
  templateUrl: './list-fme.component.html',
  styleUrls: ['./list-fme.component.css']
})
export class ListFmeComponent implements OnInit {
  fmeUsers: any[] = [];

  constructor(private fmeService: FmeService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadFmeUsers();
  }

  loadFmeUsers(): void {
    this.fmeService.getUsers().subscribe({
      next: (users: any[]) => {
        this.fmeUsers = users.filter(user => user.role === 'fme');
      },
      error: () => {
        this.toastr.error('Erreur lors du chargement des utilisateurs');
      }
    });
  }

  deleteUser(id: string): void {
    if (confirm('Confirmez-vous la suppression de cet utilisateur ?')) {
      this.fmeService.deleteUser(id).subscribe({
        next: () => {
          this.toastr.success('Utilisateur supprimé avec succès');
          this.fmeUsers = this.fmeUsers.filter(user => user.id !== id);
        },
        error: () => {
          this.toastr.error('Échec de la suppression');
        }
      });
    }
  }
}
