import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent {
  @Input() events: any[] = [];

  getEventIcon(eventType: string): string {
    const icons: { [key: string]: string } = {
      'CREATED': '✨',
      'APPROVED': '✓',
      'REJECTED': '✗',
      'DEPLOYED': '🚀',
      'PROMOTED': '⬆️'
    };
    return icons[eventType] || '•';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'pending',
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'DEPLOYED': 'deployed',
      'PROMOTED': 'promoted'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'APPROVED': 'Aprovado',
      'REJECTED': 'Rejeitado',
      'DEPLOYED': 'Implantado',
      'COMPLETED': 'Completo'
    };
    return labels[status] || status;
  }

  getEventTypeLabel(eventType: string): string {
    const labels: { [key: string]: string } = {
      'CREATED': 'Criado',
      'UPDATED': 'Atualizado',
      'APPROVED': 'Aprovado',
      'REJECTED': 'Rejeitado',
      'DEPLOYED': 'Implantado',
      'PROMOTED': 'Promovido'
    };
    return labels[eventType] || eventType;
  }
}
