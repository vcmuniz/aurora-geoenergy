import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Release, 
  ReleaseRequest, 
  ReleaseResponse, 
  PreLaunchChecklist, 
  ReleaseTimeline 
} from '@shared/models/release.model';

@Injectable({
  providedIn: 'root'
})
export class ReleaseService {
  private apiUrl = 'http://localhost:3000/api/releases';

  constructor(private http: HttpClient) {}

  list(appId: string, skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/application/${appId}?skip=${skip}&limit=${limit}`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(request: ReleaseRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getPreLaunchChecklist(id: string): Observable<PreLaunchChecklist> {
    return this.http.get<PreLaunchChecklist>(`${this.apiUrl}/${id}/checklist`);
  }

  getTimeline(id: string): Observable<ReleaseTimeline> {
    return this.http.get<ReleaseTimeline>(`${this.apiUrl}/${id}/timeline`);
  }
}
