import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Approval, ApprovalRequest, ApprovalResponse } from '@shared/models/approval.model';

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {
  private apiUrl = 'http://localhost:3000/api/approvals';

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?skip=${skip}&limit=${limit}`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  approve(request: ApprovalRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, request);
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
}
