import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Ao inicializar a app, se houver token, busca dados do usuário
    if (this.authService.isAuthenticated()) {
      this.authService.getMe().subscribe({
        error: (err) => {
          // Se /me falhar, faz logout (token expirado)
          console.warn('Token expired, logging out');
          this.authService.logout();
        }
      });
    }
  }
}
