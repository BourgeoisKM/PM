import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './pages/login/login.component';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ListComponent } from './pages/users/list/list.component';
import { AsideComponent } from './components/aside/aside.component';
import { ProfilComponent } from './pages/users/profil/profil.component';
import { HttpClientModule } from '@angular/common/http';
import { SuggestionComponent } from './suggestion/suggestion.component';
import { AbonnementComponent } from './abonnement/abonnement.component';
import { DetailAbonComponent } from './detail-abon/detail-abon.component';
import { AllReportsComponent } from './all-reports/all-reports.component';
import { AssignedComponent } from './assigned/assigned.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PmListComponent } from './pm-list/pm-list.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DetailReportComponent } from './detail-report/detail-report.component';
import { NgChartsModule } from 'ng2-charts';
import { RegisterComponent } from './pages/register/register.component';
import { MonProfilComponent } from './pages/mon-profil/mon-profil.component';
import { ListFmeComponent } from './pages/list-fme/list-fme.component';
import { ToastrModule } from 'ngx-toastr';


 
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    ListComponent,
    AsideComponent,
    ProfilComponent,
    SuggestionComponent,
    AbonnementComponent,
    DetailAbonComponent,
    AllReportsComponent,
    AssignedComponent,
    PmListComponent,
    DetailReportComponent,
    RegisterComponent,
    MonProfilComponent,
    ListFmeComponent,

   ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    NgxPaginationModule,
    NgChartsModule,
    ToastrModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
