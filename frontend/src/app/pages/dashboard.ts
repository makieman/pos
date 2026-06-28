import { Component, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, ServiceRecordService, EmployeeService } from '../services/api.services';
import { DashboardSummary, ServiceRecord, Employee } from '../models/types';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Printable-only Header -->
      <div class="print-only-header">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-slate-900">POSPro POS</h1>
            <p class="text-xs text-slate-400 mt-1">Daily Operations & Dashboard Summary</p>
          </div>
          <div class="text-right">
            <p class="text-xs font-bold text-slate-800">Date Generated</p>
            <p class="text-xs font-mono text-slate-500">{{today | date:'medium'}}</p>
          </div>
        </div>
      </div>

      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">System Dashboard</h1>
          <p class="text-sm text-slate-500 mt-1">Summary of your business performance as of today.</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <mat-icon class="text-sm">calendar_today</mat-icon>
            {{today | date:'fullDate'}}
          </span>
          <button (click)="loadData()" class="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
            <mat-icon class="text-sm">refresh</mat-icon>
          </button>
        </div>
      </header>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-24 bg-slate-200 rounded-xl"></div>
          }
        </div>
      } @else if (summary()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div [routerLink]="['/financial-report']" class="card-sleek p-5 group cursor-pointer hover:border-indigo-100">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
            <div class="flex items-end justify-between">
              <h2 class="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{summary()?.totalIncome | currency:summary()?.currency:'symbol':'1.0-0'}}</h2>
              <span class="text-indigo-500 text-[10px] font-bold bg-indigo-50 px-2 py-1 rounded">+12%</span>
            </div>
          </div>

          <div [routerLink]="['/financial-report']" class="card-sleek p-5 group cursor-pointer hover:border-indigo-100">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Commission</p>
            <div class="flex items-end justify-between">
              <h2 class="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{summary()?.totalCommission | currency:summary()?.currency:'symbol':'1.0-0'}}</h2>
              <span class="text-slate-400 text-[10px] font-bold bg-slate-50 px-2 py-1 rounded">VARIABLE</span>
            </div>
          </div>

          <div [routerLink]="['/financial-report']" class="card-sleek p-5 group cursor-pointer hover:border-rose-100">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
            <div class="flex items-end justify-between">
              <h2 class="text-2xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{{summary()?.totalExpenses | currency:summary()?.currency:'symbol':'1.0-0'}}</h2>
              <span class="text-red-500 text-[10px] font-bold bg-red-50 px-2 py-1 rounded">-4%</span>
            </div>
          </div>

          <div [routerLink]="['/financial-report']" class="p-5 rounded-xl border border-indigo-500 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
            <p class="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Net Profit</p>
            <div class="flex items-end justify-between">
              <h2 class="text-2xl font-bold">{{summary()?.netProfit | currency:summary()?.currency:'symbol':'1.0-0'}}</h2>
              <div class="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                <mat-icon class="text-sm">trending_up</mat-icon>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
           <!-- Recent Sales -->
           <div class="lg:col-span-2 card-sleek flex flex-col bg-white">
              <div class="p-5 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-slate-800 text-sm">Recent Sales Transactions</h3>
                  <p class="text-[10px] text-slate-400 font-medium">Real-time update of last 10 activities</p>
                </div>
                <button [routerLink]="['/services']" class="text-indigo-600 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Record New</button>
              </div>
              <div class="flex-1 overflow-auto">
                <table class="w-full text-left">
                  <thead>
                    <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th class="px-5 py-3">Service</th>
                      <th class="px-5 py-3">Staff</th>
                      <th class="px-5 py-3 text-center">Method</th>
                      <th class="px-5 py-3 text-right">Commission</th>
                      <th class="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    @for (sale of sales(); track sale.id) {
                      <tr class="hover:bg-slate-50/80 transition-colors group">
                        <td class="px-5 py-4">
                          <div class="text-xs font-bold text-slate-700">{{sale.name}}</div>
                          <div class="text-[9px] text-slate-400">{{sale.createdAt | date:'shortTime'}}</div>
                        </td>
                        <td class="px-5 py-4 text-xs font-medium text-slate-600">
                          {{getEmployeeName(sale.employeeId)}}
                        </td>
                        <td class="px-5 py-4">
                          <div class="flex justify-center">
                            <span [class]="getPaymentClass(sale.paymentMethod)" class="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                              {{sale.paymentMethod}}
                            </span>
                          </div>
                        </td>
                        <td class="px-5 py-4 text-right">
                          <span class="text-xs font-bold text-indigo-600">KSh {{sale.commissionEarned | number}}</span>
                        </td>
                        <td class="px-5 py-4 text-right text-xs font-bold text-slate-800">
                          KSh {{sale.price | number}}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
           </div>
           
           <div class="space-y-6">
             <div class="bg-indigo-900 p-6 rounded-xl text-white relative overflow-hidden group">
                <div class="relative z-10">
                  <h4 class="font-bold mb-1">Daily Report Ready</h4>
                  <p class="text-xs text-indigo-300 mb-6 max-w-[180px]">Download your summarized transaction log for today's sales.</p>
                  <button (click)="exportPDF()" class="bg-white text-indigo-900 text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-all active:scale-95 uppercase tracking-wider">Export PDF</button>
                </div>
                <mat-icon class="absolute -right-6 -bottom-6 text-white/5 text-[120px] group-hover:scale-110 transition-transform duration-700">description</mat-icon>
             </div>

             <div class="card-sleek p-6 border-indigo-50 bg-white">
               <h4 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <mat-icon class="text-indigo-500 text-sm">stars</mat-icon>
                 Commission Overview
               </h4>
               <div class="space-y-4">
                 <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                   <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rate</div>
                   <div class="text-xs font-bold text-slate-700">Variable</div>
                 </div>
                 <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                   <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Earner</div>
                   <div class="text-xs font-bold text-indigo-600">John Doe</div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DashboardPage implements OnInit {
  private dashboardService = inject(DashboardService);
  private serviceRecordService = inject(ServiceRecordService);
  private employeeService = inject(EmployeeService);
  private platformId = inject(PLATFORM_ID);
  
  summary = signal<DashboardSummary | null>(null);
  sales = signal<ServiceRecord[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(true);
  today = new Date();

  ngOnInit() {
    this.loadData();
  }

  exportPDF() {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      summary: this.dashboardService.getSummary(),
      sales: this.serviceRecordService.getRecentSales(),
      employees: this.employeeService.getEmployees()
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.sales.set(data.sales);
        this.employees.set(data.employees);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getEmployeeName(id: string): string {
    return this.employees().find(e => e.id === id)?.name || 'Unknown';
  }

  getPaymentClass(method: string): string {
    switch(method) {
      case 'mpesa': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'cash': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'credit': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }
}
