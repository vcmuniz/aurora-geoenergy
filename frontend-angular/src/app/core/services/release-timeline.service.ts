import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReleaseTimelineService {
  private apiUrl = 'http://localhost:3000/api/releases';

  constructor(private http: HttpClient) {}

  getTimeline(releaseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${releaseId}/timeline`);
  }
}
