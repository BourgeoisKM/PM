import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AbonnementService {
  url: String = 'https://api.libenga.net/';

  constructor(private httpClient: HttpClient) { }
  LesAbonnements() {
    return this.httpClient.get(this.url + 'paie/list/');
  }
  getAbonnement(id: any){
    return this.httpClient.post(this.url + 'paie/', {
      id: id,

    });

  }


}

