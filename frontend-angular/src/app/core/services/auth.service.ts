import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, MeResponse, User } from '@shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  public isLoggedIn = this.user$.pipe(tap(() => this.isAuthenticated()));

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem('token', response.data.access_token);
            this.userSubject.next(response.data.user);
          }
        })
      );
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.userSubject.next(response.data);
          }
        })
      );
  }

  getCurrentUserEmail(): string {
    const user = this.userSubject.getValue();
    return user?.email || 'approver@company.co';
  }

  getCurrentUser$(): Observable<User | null> {
    return this.user$;
  }

  logout(): void {
    localStorage.removeItem('token');
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadStoredUser(): void {
    // Dados do usuário são carregados via /auth/me no AppComponent
    // Apenas o token é mantido no localStorage
  }
}
