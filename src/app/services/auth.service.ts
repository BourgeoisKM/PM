import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  url: String = 'http://127.0.0.1:8000/swagger/';
  constructor() { }
}
