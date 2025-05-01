import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs'
import { Token } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  url: String = 'https://pm-backend-3t2n.onrender.com/';
  apiUrl: any;
  constructor(private httpClient: HttpClient) { }

  login(phone: any, pass: any) {
    //sdfsdf
    return this.httpClient.post(this.url + 'account/login/', {
      phone,
      pass,
    });
  }

  LesExperts() { //Les sites
    return this.httpClient.get(this.url + 'expert/get');
  }


  getExpert(id: any) {
    return this.httpClient.post(this.url + 'expert/', {
      id: id,
    });
  }

  getreport(): Observable<any[]> {
    // Utilisation de l'authentification via Bearer token, assure-toi qu'il est valide
    const token = 'oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ'; 
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.httpClient.get<any[]>('https://pm-backend-3t2n.onrender.com/reports', { headers });
  }
  
  assignPreventiveMaintenance(data: any) {
    const token = localStorage.getItem('token'); 
  const headers = new HttpHeaders({
    'Authorization': `Bearer oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ`
  });
  return this.httpClient.post(this.url + 'pm-schedules',  data,{ headers });
}

getSites() {
  const token = localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ`
  };

  return this.httpClient.get<any[]>(`${this.url}sites`, { headers });
}

getVendors(): Observable<any[]> {
  const vendors = [
    {
      id: 'v1',
      name: 'NETIS'
    },
    {
      id: 'v2',
      name: 'NOVACOM'
    },
    {
      id: 'v3',
      name: 'GLOBAL TECH'
    }
  ];
  return new Observable(observer => {
    observer.next(vendors);
    observer.complete();
  });
}
getAssignedPMs() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ`
  });

  return this.httpClient.get<any[]>('https://pm-backend-3t2n.onrender.com/pm-schedules', { headers });
}
getOneReport(id: string) {
  const token = localStorage.getItem('token'); 
  const headers = new HttpHeaders({
    'Authorization': `Bearer oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ`
  });

  return this.httpClient.get(`${this.url}/report/${id}`, { headers });
}
getFullReport(id: string) {
  // Utilisation de l'authentification via Bearer token, assure-toi qu'il est valide
  const token = 'oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ'; 
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  return this.httpClient.get<any[]>('https://pm-backend-3t2n.onrender.com/reports', { headers });
}

getUsers(): Observable<any[]> {
  const token = localStorage.getItem('token');

  const headers = {
    Authorization: `Bearer oat_Mg.bVZDdGRFZDJkOHAxc3dVeU9GUk1ick5WWXZFNlIwa0wzSWpJUHR6ajU3MDA5OTE1MQ`
  };

  return this.httpClient.get<any[]>(`${this.url}users`, { headers });
}

}



