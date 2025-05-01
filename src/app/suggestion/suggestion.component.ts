import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-suggestion',
  templateUrl: './suggestion.component.html',
  styleUrls: ['./suggestion.component.css']
})
export class SuggestionComponent {
 
  list_suggestion:any[] = [];
  constructor(private data: DataService,private router: Router) {

  }
  ngOnInit(): void {
    ;
  
  }
  
}
