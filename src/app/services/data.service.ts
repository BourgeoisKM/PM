import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private baseUrl = 'https://pm-backend-3t2n.onrender.com';

  constructor(private httpClient: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/auth/login`, credentials);
  }

  registerUser(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/auth/register`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  saveUser(userData: any): void {
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }

  // Maintenant getCurrentUser() renvoie un Observable<any> pour faciliter l'usage en async
  getCurrentUser(): Observable<any> {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      return of(null);
    }
    try {
      const user = JSON.parse(userJson);
      return of(user);
    } catch (e) {
      console.error('Erreur parsing currentUser:', e);
      return of(null);
    }
  }

  getUserProfile(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/auth/me`, {
      headers: this.getAuthHeaders()
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }

  getUsers(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders()
    });
  }

  getExperts(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/expert/get`, {
      headers: this.getAuthHeaders()
    });
  }

  getExpert(id: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/expert/`, { id }, {
      headers: this.getAuthHeaders()
    });
  }

  // Vendors filtrés selon l'utilisateur connecté, en Observable
  getVendors(): Observable<any[]> {
  const allVendors = [
    { id: 'fe2f623f-1900-431f-8684-7659e180a207', name: 'NETIS' },
    { id: 'fe85da04-2d40-40eb-86f5-682fde6f9573', name: 'NOVACOM' },
    { id: '8014a694-842d-48fd-9c4d-dc32cf15fb93', name: 'GLOBAL TECH' },
    { id: 'c257ad68-2390-425a-9946-f800c48fe8c4', name: 'GEEK' },
    { id: '3aed5813-e6a8-4670-b1f0-775aa4fbe9be', name: 'East Castle' }
  ];

  return this.getCurrentUser().pipe(
    map(user => {
      // Si admin => retourne tout
      if (user?.role === 'ops_admin') {
        return allVendors;
      }

      // Sinon, filtre selon vendorId
      if (user?.vendorId) {
        return allVendors.filter(vendor => vendor.id === user.vendorId);
      }

      return [];
    })
  );
}
  getSites(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/sites`, {
      headers: this.getAuthHeaders()
    });
  }

  assignPreventiveMaintenance(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/pm-schedules`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getAssignedPMs(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/pm-schedules`, {
      headers: this.getAuthHeaders()
    });
  }

  getReports(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/reports`, {
      headers: this.getAuthHeaders()
    });
  }

  getOneReport(id: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/report/`, { id }, {
      headers: this.getAuthHeaders()
    });
  }

  getFullReport(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/reports/${id}/full`, {
      headers: this.getAuthHeaders()
    });
  }
}
