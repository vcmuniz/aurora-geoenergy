import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Approval, ApprovalRequest, ApprovalResponse } from '@shared/models/approval.model';

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {
  private apiUrl = 'http://localhost:3000/api/approvals';
  private approvalChangedSubject = new Subject<void>();
  
  // Observable that emits when an approval is approved/rejected
  approvalChanged$ = this.approvalChangedSubject.asObservable();

  // Public method to trigger refresh
  notifyChange(): void {
    this.approvalChangedSubject.next();
  }

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?skip=${skip}&limit=${limit}`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(releaseId: string, approverEmail: string, request: ApprovalRequest): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${releaseId}?approver_email=${approverEmail}`,
      request
    );
  }

  listByReleaseId(releaseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/release/${releaseId}`);
  }

  listPendingByApprover(approverEmail: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/approver/${approverEmail}`);
  }

  listPendingCurrentUser(skip: number = 0, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pending/current?skip=${skip}&limit=${limit}`);
  }

  listApprovedCurrentUser(skip: number = 0, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/approved/current?skip=${skip}&limit=${limit}`);
  }

  listRejectedCurrentUser(skip: number = 0, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rejected/current?skip=${skip}&limit=${limit}`);
  }

  approve(releaseId: string, notes?: string): Observable<any> {
    const result = this.http.post<any>(
      `${this.apiUrl}/${releaseId}/approve`,
      { notes: notes || '' }
    );
    result.subscribe(() => this.approvalChangedSubject.next());
    return result;
  }

  reject(releaseId: string, notes?: string): Observable<any> {
    const result = this.http.post<any>(
      `${this.apiUrl}/${releaseId}/reject`,
      { notes: notes || '' }
    );
    result.subscribe(() => this.approvalChangedSubject.next());
    return result;
  }

  updateApprovalOutcome(approvalId: string, request: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${approvalId}`, request);
  }
}
