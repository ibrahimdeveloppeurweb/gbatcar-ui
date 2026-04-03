import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';
import { ContractService } from '../../../../../core/services/contract/contract.service';

import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contract-dashboard',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, NgApexchartsModule, FeatherIconDirective, NgSelectModule, FormsModule],
  templateUrl: './contract-dashboard.component.html',
  styleUrl: './contract-dashboard.component.scss'
})
export class ContractDashboardComponent implements OnInit {

  private contractService = inject(ContractService);
  private themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

  selectedMonth = 6;
  monthsList: number[] = Array.from({ length: 36 }, (_, i) => i + 1);
  loading = false;

  // KPIs
  stats = {
    totalContracts: 0,
    totalContractsGrowth: 0,
    activeContracts: 0,
    defectRate: 0, // Taux de défaut (impayés graves)
    defectRateTrend: 'down',
    mrr: 0, // Monthly Recurring Revenue attendu FCFA
    mrrGrowth: 0
  };

  // Liste des risques imminents
  imminentRisks = [
    { id: 'C-2024-089', client: 'TransportExpress CI', issue: 'Retard de paiement > 30j', severity: 'danger', value: 450000 },
    { id: 'C-2023-112', client: 'Soro Jean', issue: 'Assurance expirée', severity: 'warning', value: 0 },
    { id: 'C-2024-001', client: 'Koffi Marie', issue: 'GPS Déconnecté', severity: 'danger', value: 0 },
    { id: 'C-2024-156', client: 'VTC Pro SARL', issue: 'Restitution prévue dans 5j', severity: 'info', value: 0 },
  ];

  // Chart Options
  cashflowChartOptions: ApexOptions | any = {};

  // Trends
  trends: any = { cashflow: [] };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.contractService.getDashboardData({ months: this.selectedMonth }).subscribe({
      next: (data: any) => {
        this.stats = data.kpis;
        this.trends = data.trends;
        this.imminentRisks = data.imminentRisks;
        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching contract dashboard data', err);
        this.initCharts(); // Still init charts (maybe empty)
        this.loading = false;
      }
    });
  }

  onMonthChange() {
    this.loadDashboardData();
  }

  initCharts() {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const categories = [];
    const expectedData = new Array(this.selectedMonth).fill(0);
    const paidData = new Array(this.selectedMonth).fill(0);

    for (let i = this.selectedMonth - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      let name = monthNames[d.getMonth()];
      if (this.selectedMonth > 12) name += ' ' + d.getFullYear().toString().substring(2);
      categories.push(name);

      const yearStr = d.getFullYear();
      const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const key = `${yearStr}-${monthStr}`;

      const item = this.trends.cashflow?.find((x: any) => x.month === key);
      if (item) {
        expectedData[(this.selectedMonth - 1) - i] = parseFloat(item.expected);
        paidData[(this.selectedMonth - 1) - i] = parseFloat(item.paid);
      }
    }

    this.cashflowChartOptions = {
      series: [{
        name: 'Encaissements Prévus',
        data: expectedData
      }, {
        name: 'Encaissements Réalisés',
        data: paidData
      }],
      chart: {
        height: 350,
        type: 'area',
        fontFamily: 'inherit',
        toolbar: { show: false }
      },
      colors: ['#6c757d', '#05a34a', '#66d1ce'], // Using gray for expected to emphasize collected
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: categories,
        tooltip: { enabled: false }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => (val >= 1_000_000) ? (val / 1_000_000).toFixed(1) + 'M' : (val / 1_000).toFixed(0) + 'k'
        }
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
      },
      tooltip: {
        y: { formatter: (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA' }
      }
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }
}

