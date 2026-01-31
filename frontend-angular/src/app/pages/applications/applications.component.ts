import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '@core/services/application.service';
import { Application, ApplicationRequest } from '@shared/models/application.model';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  applications: Application[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;

  formData: ApplicationRequest = {
    name: '',
    ownerTeam: '',
    repoUrl: ''
  };

  skip = 0;
  limit = 10;

  constructor(private appService: ApplicationService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.appService.list(this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.applications = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar aplicações:', err);
        this.loading = false;
      }
    });
  }

  openForm(app?: Application): void {
    if (app) {
      this.editingId = app.id;
      this.formData = {
        name: app.name,
        ownerTeam: app.ownerTeam,
        repoUrl: app.repoUrl
      };
    } else {
      this.editingId = null;
      this.formData = { name: '', ownerTeam: '', repoUrl: '' };
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.formData = { name: '', ownerTeam: '', repoUrl: '' };
  }

  save(): void {
    if (!this.formData.name || !this.formData.ownerTeam) {
      alert('Nome e Equipe são obrigatórios');
      return;
    }

    if (this.editingId) {
      this.appService.update(this.editingId, this.formData).subscribe({
        next: () => {
          this.loadApplications();
          this.closeForm();
        },
        error: (err) => console.error('Erro ao atualizar:', err)
      });
    } else {
      this.appService.create(this.formData).subscribe({
        next: () => {
          this.loadApplications();
          this.closeForm();
        },
        error: (err) => console.error('Erro ao criar:', err)
      });
    }
  }

  delete(id: string): void {
    if (confirm('Tem certeza?')) {
      this.appService.delete(id).subscribe({
        next: () => this.loadApplications(),
        error: (err) => console.error('Erro ao deletar:', err)
      });
    }
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.loadApplications();
    }
  }

  nextPage(): void {
    this.skip += this.limit;
    this.loadApplications();
  }
}
