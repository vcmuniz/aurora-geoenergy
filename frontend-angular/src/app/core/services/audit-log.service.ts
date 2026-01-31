import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = 'http://localhost:3000/api/audit-logs';

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?skip=${skip}&limit=${limit}`);
  }

  listByEntity(entityType: string, entityId: string, skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/entity/${entityType}/${entityId}?skip=${skip}&limit=${limit}`);
  }

  listByActor(actorEmail: string, skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/actor/${actorEmail}?skip=${skip}&limit=${limit}`);
  }
}
