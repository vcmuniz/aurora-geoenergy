import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReleaseService } from '@core/services/release.service';
import { ApplicationService } from '@core/services/application.service';
import { Release, ReleaseRequest } from '@shared/models/release.model';
import { Application } from '@shared/models/application.model';

@Component({
  selector: 'app-releases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './releases.component.html',
  styleUrls: ['./releases.component.scss']
})
export class ReleasesComponent implements OnInit {
  releases: Release[] = [];
  applications: Application[] = [];
  loading = false;
  showForm = false;
  selectedAppId = '';

  formData: ReleaseRequest = {
    applicationId: '',
    version: '',
    env: 'DEV',
    evidenceUrl: '',
    evidenceScore: 0
  };

  skip = 0;
  limit = 10;

  constructor(
    private releaseService: ReleaseService,
    private appService: ApplicationService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.appService.list(0, 100).subscribe({
      next: (response: any) => {
        this.applications = response.data || [];
      },
      error: (err) => console.error('Erro ao carregar aplicações:', err)
    });
  }

  loadReleases(): void {
    if (!this.selectedAppId) return;

    this.loading = true;
    this.releaseService.list(this.selectedAppId, this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.releases = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar releases:', err);
        this.loading = false;
      }
    });
  }

  onAppChange(): void {
    this.skip = 0;
    this.loadReleases();
  }

  openForm(): void {
    this.formData = {
      applicationId: this.selectedAppId,
      version: '',
      env: 'DEV',
      evidenceUrl: '',
      evidenceScore: 0
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  save(): void {
    if (!this.formData.version || !this.selectedAppId) {
      alert('Versão e Aplicação são obrigatórias');
      return;
    }

    this.formData.applicationId = this.selectedAppId;
    this.releaseService.create(this.formData).subscribe({
      next: () => {
        this.loadReleases();
        this.closeForm();
      },
      error: (err) => console.error('Erro ao criar:', err)
    });
  }

  delete(id: string): void {
    if (confirm('Tem certeza?')) {
      this.releaseService.delete(id).subscribe({
        next: () => this.loadReleases(),
        error: (err) => console.error('Erro ao deletar:', err)
      });
    }
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.loadReleases();
    }
  }

  nextPage(): void {
    this.skip += this.limit;
    this.loadReleases();
  }
}
