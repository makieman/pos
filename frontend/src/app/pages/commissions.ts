import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ServiceRecordService, EmployeeService } from '../services/api.services';
import { ServiceRecord, Employee } from '../models/types';

@Component({
  selector: 'app-commissions',
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Commissions & Earnings</h1>
          <p class="text-sm text-slate-500 mt-1">Track and filter employee commissions and performance reports.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest px-1">Total Payout</p>
            <p class="text-lg font-bold text-indigo-700 px-1">KSh {{totalCommissionPaid() | number}}</p>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <div class="rounded-2xl shadow-sm border border-slate-100 p-6 bg-white flex flex-wrap gap-6 items-end border border-slate-50">
        <div class="flex-1 min-w-[200px]">
          <label for="staff-filter" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Filter by Staff</label>
          <select id="staff-filter" [(ngModel)]="selectedEmployeeId" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
            <option value="all">All Staff Members</option>
            @for (emp of employees(); track emp.id) {
              <option [value]="emp.id">{{emp.name}}</option>
            }
          </select>
        </div>
        
        <div class="flex-1 min-w-[200px]">
          <label for="date-filter" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Time Period</label>
          <select id="date-filter" [(ngModel)]="selectedPeriod" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">Lifetime</option>
          </select>
        </div>

        <button (click)="resetFilters()" class="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
          Reset
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Daily Transaction Log -->
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden border border-slate-50">
            <header class="p-5 border-b border-slate-50 bg-slate-50/30">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-widest">Transaction Log</h3>
            </header>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th class="px-6 py-4">Date & Service</th>
                    <th class="px-6 py-4">Employee</th>
                    <th class="px-6 py-4 text-right">Commission</th>
                    <th class="px-6 py-4 text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (sale of filteredSales(); track sale.id) {
                    <tr class="hover:bg-slate-50/50 transition-colors group">
                      <td class="px-6 py-4">
                        <div class="text-xs font-bold text-slate-700">{{sale.name}}</div>
                        <div class="text-[9px] text-slate-400">{{sale.createdAt | date:'mediumDate'}} at {{sale.createdAt | date:'shortTime'}}</div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <div class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[9px] font-bold">
                            {{getEmployeeInitials(sale.employeeId)}}
                          </div>
                          <span class="text-xs font-medium text-slate-600">{{getEmployeeName(sale.employeeId)}}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <span class="text-xs font-bold text-indigo-600">KSh {{sale.commissionEarned | number}}</span>
                      </td>
                      <td class="px-6 py-4 text-right text-xs font-bold text-slate-800">
                        KSh {{sale.price | number}}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="px-6 py-12 text-center">
                        <mat-icon class="text-slate-200 text-4xl mb-2">history</mat-icon>
                        <p class="text-xs text-slate-400">No transactions found for the selected filters.</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Commissions Report -->
        <div class="space-y-6">
          <div class="rounded-2xl shadow-sm border border-slate-100 bg-white p-6 border-t-4 border-indigo-500">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <mat-icon class="text-indigo-500 text-sm">assessment</mat-icon>
              Commission Summary
            </h3>
            
            <div class="space-y-4">
              @for (stat of staffStats(); track stat.name) {
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="text-xs font-bold text-slate-800">{{stat.name}}</h4>
                      <p class="text-[9px] text-slate-400 font-medium uppercase tracking-widest">{{stat.count}} services completed</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-black text-indigo-600">KSh {{stat.total | number}}</p>
                      <p class="text-[8px] text-slate-400 font-bold uppercase">Total Earned</p>
                    </div>
                  </div>
                  
                  <!-- Miniature progress bar for share of total payouts -->
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors" 
                      [style.width.%]="(stat.total / (totalCommissionPaid() || 1)) * 100"
                    ></div>
                  </div>
                  <div class="mt-2 flex justify-between items-center">
                    <span class="text-[9px] text-slate-400">Avg. KSh {{stat.avg | number:'1.0-0'}}/service</span>
                    <span class="text-[9px] font-bold text-indigo-400">{{(stat.total / (totalCommissionPaid() || 1)) * 100 | number:'1.0-0'}}% of total</span>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8">
                  <p class="text-[10px] text-slate-400 italic">No staff data available.</p>
                </div>
              }
            </div>

            <div class="mt-8 pt-6 border-t border-slate-100">
              <button class="w-full py-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-all">
                Download Full Report
              </button>
            </div>
          </div>

          <div class="rounded-2xl shadow-sm border border-slate-100 bg-slate-900 p-6 text-white relative overflow-hidden group">
            <div class="relative z-10">
              <div class="flex items-center gap-2 mb-2">
                <mat-icon class="text-indigo-400 text-sm animate-pulse">tips_and_updates</mat-icon>
                <h4 class="text-[10px] font-bold uppercase tracking-widest">Performance Insight</h4>
              </div>
              <p class="text-xs text-indigo-100 leading-relaxed">
                Staff commissions account for <span class="font-bold text-white">{{(totalCommissionPaid() / (totalSalesVolume() || 1)) * 100 | number:'1.0-0'}}%</span> 
                of your total revenue this period.
              </p>
            </div>
            <mat-icon class="absolute -right-8 -top-8 text-white/5 text-[120px] group-hover:scale-110 transition-transform duration-1000">show_chart</mat-icon>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CommissionsPage implements OnInit {
  private serviceRecordService = inject(ServiceRecordService);
  private employeeService = inject(EmployeeService);

  sales = signal<ServiceRecord[]>([]);
  employees = signal<Employee[]>([]);
  
  selectedEmployeeId = 'all';
  selectedPeriod = 'all';

  filteredSales = computed(() => {
    let list = this.sales();
    const empId = this.selectedEmployeeId;
    const period = this.selectedPeriod;

    // Filter by employee
    if (empId !== 'all') {
      list = list.filter(sale => sale.employeeId === empId);
    }

    // Filter by period (mock implementation)
    if (period === 'today') {
      const todayStr = new Date().toDateString();
      list = list.filter(sale => sale.createdAt && new Date(sale.createdAt).toDateString() === todayStr);
    }

    return list;
  });

  totalCommissionPaid = computed(() => {
    return this.filteredSales().reduce((acc, curr) => acc + (curr.commissionEarned || 0), 0);
  });

  totalSalesVolume = computed(() => {
    return this.filteredSales().reduce((acc, curr) => acc + (curr.price || 0), 0);
  });

  staffStats = computed(() => {
    const stats: { name: string; total: number; count: number; avg: number }[] = [];
    const sales = this.filteredSales();
    const emps = this.employees();

    emps.forEach(emp => {
      const empSales = sales.filter(s => s.employeeId === emp.id);
      if (empSales.length > 0) {
        const total = empSales.reduce((acc, curr) => acc + (curr.commissionEarned || 0), 0);
        stats.push({
          name: emp.name,
          total: total,
          count: empSales.length,
          avg: total / empSales.length
        });
      }
    });

    return stats.sort((a, b) => b.total - a.total);
  });

  ngOnInit() {
    this.serviceRecordService.getRecentSales().subscribe(data => this.sales.set(data));
    this.employeeService.getEmployees().subscribe(data => this.employees.set(data));
  }

  getEmployeeName(id: string): string {
    return this.employees().find(e => e.id === id)?.name || 'Unknown';
  }

  getEmployeeInitials(id: string): string {
    const name = this.getEmployeeName(id);
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  resetFilters() {
    this.selectedEmployeeId = 'all';
    this.selectedPeriod = 'all';
  }
}
