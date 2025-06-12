import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AbonnementComponent } from './abonnement/abonnement.component';
import { DetailAbonComponent } from './detail-abon/detail-abon.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ListComponent } from './pages/users/list/list.component';
import { ProfilComponent } from './pages/users/profil/profil.component';
import { SuggestionComponent } from './suggestion/suggestion.component';
import { AllReportsComponent } from './all-reports/all-reports.component';
import { AssignedComponent } from './assigned/assigned.component';
import { PmListComponent } from './pm-list/pm-list.component';
import { DetailReportComponent } from './detail-report/detail-report.component';
import { RegisterComponent } from './pages/register/register.component';
import { MonProfilComponent } from './pages/mon-profil/mon-profil.component';
import { ListFmeComponent } from './pages/list-fme/list-fme.component';

const routes: Routes = [
 
   { path: 'home', component: HomeComponent, canActivate:[AuthGuard] },
     
  {
    path: 'user', children: [
      { path: 'list', component: ListComponent },
      { path: 'detail/:id', component: ProfilComponent },
    ], canActivate:[AuthGuard]
  },
  { path: 'auth/login', component: LoginComponent },
  { path: 'abonnement', component: AbonnementComponent, canActivate:[AuthGuard]},
  { path: 'suggestion', component: SuggestionComponent, canActivate:[AuthGuard]},
  { path: 'detail-abon/:id', component: DetailAbonComponent, canActivate:[AuthGuard]},
  { path: 'rapports-recu', component: AllReportsComponent, canActivate:[AuthGuard] },
  { path: 'assigned', component: AssignedComponent , canActivate:[AuthGuard]},
  { path: 'list-pm', component: PmListComponent , canActivate:[AuthGuard]},
  { path: 'rapport/:id', component: DetailReportComponent, canActivate:[AuthGuard] },
  { path: 'register', component: RegisterComponent , canActivate:[AuthGuard]},
  { path: 'mon-profil', component: MonProfilComponent , canActivate:[AuthGuard]},
  { path: 'fme-list', component: ListFmeComponent , canActivate:[AuthGuard]},
   { path: '', component: HomeComponent, canActivate:[AuthGuard] },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
