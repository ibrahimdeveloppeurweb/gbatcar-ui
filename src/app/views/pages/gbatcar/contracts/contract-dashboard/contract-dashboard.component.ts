import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-contract-dashboard',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, NgApexchartsModule, FeatherIconDirective],
  templateUrl: './contract-dashboard.component.html',
  styleUrl: './contract-dashboard.component.scss'
})
export class ContractDashboardComponent implements OnInit {

  // KPIs
  stats = {
    totalContracts: 345,
    totalContractsGrowth: 12,
    activeContracts: 310,
    defectRate: 4.8, // Taux de défaut (impayés graves)
    defectRateTrend: 'down',
    mrr: 28500000, // Monthly Recurring Revenue attendu FCFA
    mrrGrowth: 5.4
  };

  // Liste des risques imminents
  imminentRisks = [
    { id: 'C-2024-089', client: 'TransportExpress CI', issue: 'Retard de paiement > 30j', severity: 'danger', value: 450000 },
    { id: 'C-2023-112', client: 'Soro Jean', issue: 'Assurance expirée', severity: 'warning', value: 0 },
    { id: 'C-2024-001', client: 'Koffi Marie', issue: 'GPS Déconnecté', severity: 'danger', value: 0 },
    { id: 'C-2024-156', client: 'VTC Pro SARL', issue: 'Restitution prévue dans 5j', severity: 'info', value: 0 },
  ];

  // Chart Options
  cashflowChartOptions: any = {};

  ngOnInit(): void {
    this.initCharts();
  }

  initCharts() {
    this.cashflowChartOptions = {
      series: [{
        name: 'Encaissements Prévus',
        data: [25, 28, 26, 30, 29, 32, 28] // Millions FCFA
      }, {
        name: 'Encaissements Réalisés',
        data: [24, 26, 26, 28, 25, 29, 0] // Le dernier mois est en cours
      }],
      chart: {
        height: 350,
        type: 'area',
        fontFamily: 'inherit',
        toolbar: { show: false }
      },
      colors: ['#05a34a', '#66d1ce'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: ['Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Janv', 'Fév'],
        tooltip: { enabled: false }
      },
      legend: { position: 'top' },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      }
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }
}

