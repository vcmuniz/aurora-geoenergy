import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog, AuditLogFilters, AuditLogResponse } from '@shared/models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = 'http://localhost:3000/api/audit';

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 100, filters?: AuditLogFilters): Observable<any> {
    let url = `${this.apiUrl}?skip=${skip}&limit=${limit}`;

    if (filters?.actor) {
      url += `&actor=${filters.actor}`;
    }
    if (filters?.action) {
      url += `&action=${filters.action}`;
    }
    if (filters?.entity) {
      url += `&entity=${filters.entity}`;
    }

    return this.http.get<any>(url);
  }

  listByEntity(entity: string, entityId: string, skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${entity}/${entityId}?skip=${skip}&limit=${limit}`
    );
  }

  listByActor(actor: string, skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/actor/${actor}?skip=${skip}&limit=${limit}`
    );
  }
}
