import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private baseUrl: string = 'https://pm-backend-3t2n.onrender.com';

  constructor(private httpClient: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || 'oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  login(phone: any, pass: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/account/login/`, { phone, pass });
  }

  LesExperts(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/expert/get`);
  }

  getExpert(id: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/expert/`, { id });
  }

  assignPreventiveMaintenance(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/pm-schedules`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getSites(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/sites`, {
      headers: this.getAuthHeaders()
    });
  }

  getVendors(): Observable<any[]> {
    const vendors = [
      { id: 'v1', name: 'NETIS' },
      { id: 'v2', name: 'NOVACOM' },
      { id: 'v3', name: 'GLOBAL TECH' }
    ];
    return new Observable(observer => {
      observer.next(vendors);
      observer.complete();
    });
  }

  getAssignedPMs(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/pm-schedules`, {
      headers: this.getAuthHeaders()
    });
  }

  getOneReport(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.httpClient.post(`${this.baseUrl}/report/`, { id }, { headers });
  }

  getreport(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/reports`, {
      headers: this.getAuthHeaders()
    });
  }

  getFullReport(id: string): Observable<any> {
    const token = 'oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ';  // Jeton d'authentification statique
    if (!token) {
      console.error('Jeton d\'authentification manquant');
      return new Observable(observer => {
        observer.error('Jeton d\'authentification manquant');
      });
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);  // Utilisation du jeton dans les en-têtes
    return this.httpClient.get<any>(`${this.baseUrl}/reports/${id}/full`, { headers });
  }
  
  getUsers(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders()
    });
  }
}
