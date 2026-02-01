import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { 
  Release, 
  ReleaseRequest, 
  ReleaseResponse, 
  PreLaunchChecklist, 
  ReleaseTimeline 
} from '@shared/models/release.model';
import { ApprovalService } from './approval.service';

@Injectable({
  providedIn: 'root'
})
export class ReleaseService {
  private apiUrl = 'http://localhost:3000/api/releases';

  constructor(
    private http: HttpClient,
    private approvalService: ApprovalService
  ) {}

  list(appId: string, skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/application/${appId}?skip=${skip}&limit=${limit}`);
  }

  listAll(skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?skip=${skip}&limit=${limit}`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(request: ReleaseRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request).pipe(
      tap(() => this.approvalService.notifyChange())
    );
  }

  update(id: string, request: ReleaseRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, request);
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

  promote(releaseId: string, targetEnv: string, actor: string = 'system'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${releaseId}/promote`, { targetEnv, actor }).pipe(
      tap(() => this.approvalService.notifyChange())
    );
  }

  reject(releaseId: string, notes: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${releaseId}/reject`, { notes }).pipe(
      tap(() => this.approvalService.notifyChange())
    );
  }

  deploy(releaseId: string, notes: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${releaseId}/deploy`, { notes }).pipe(
      tap(() => this.approvalService.notifyChange())
    );
  }
}
