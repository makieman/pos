import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ServiceRecordService } from '../services/api.services';
import { AuthService } from '../context/auth.state';
import { CommissionReportEntry } from '../models/types';

@Component({
  selector: 'app-commissions',
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Commission Report</h1>
          <p class="text-sm text-slate-500 mt-1">Daily per-employee commission breakdown.</p>
        </div>
        <!-- Date picker -->
        <div class="flex items-center gap-3">
          <label for="report-date" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Date</label>
          <input
            id="report-date"
            type="date"
            [(ngModel)]="selectedDate"
            (change)="loadReport()"
            class="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </header>

      <!-- Summary Bar -->
      @if (!loading()) {
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Total Owed Today</p>
            <p class="text-2xl font-black text-amber-700 font-mono">KSh {{totalOwed() | number}}</p>
            <p class="text-[9px] text-amber-400 mt-1">{{unpaidCount()}} employee(s) unpaid</p>
          </div>
          <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Total Paid Today</p>
            <p class="text-2xl font-black text-emerald-700 font-mono">KSh {{totalPaid() | number}}</p>
            <p class="text-[9px] text-emerald-400 mt-1">{{paidCount()}} employee(s) paid</p>
          </div>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white border border-slate-100 rounded-2xl p-6 animate-pulse">
              <div class="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
              <div class="space-y-2">
                <div class="h-3 bg-slate-50 rounded w-full"></div>
                <div class="h-3 bg-slate-50 rounded w-4/5"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Employee Commission Cards -->
      @if (!loading()) {
        @if (report().length === 0) {
          <div class="bg-white border border-slate-100 rounded-2xl p-16 text-center">
            <mat-icon class="text-slate-200 text-5xl mb-3 block mx-auto">bar_chart</mat-icon>
            <p class="text-sm font-bold text-slate-400">No commission data for {{selectedDate}}.</p>
            <p class="text-xs text-slate-300 mt-1">No completed sales with assigned staff members were found on this date.</p>
          </div>
        }

        @for (emp of report(); track emp.employeeId) {
          <div 
            class="bg-white border rounded-2xl overflow-hidden shadow-sm transition-all"
            [class.border-emerald-200]="emp.alreadyPaid"
            [class.border-slate-100]="!emp.alreadyPaid"
          >
            <!-- Card Header -->
            <div 
              class="px-6 py-4 flex items-center justify-between"
              [class.bg-emerald-50]="emp.alreadyPaid"
              [class.bg-slate-50]="!emp.alreadyPaid"
            >
              <div class="flex items-center gap-3">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                  [class.bg-emerald-100]="emp.alreadyPaid"
                  [class.text-emerald-700]="emp.alreadyPaid"
                  [class.bg-indigo-100]="!emp.alreadyPaid"
                  [class.text-indigo-700]="!emp.alreadyPaid"
                >
                  {{getInitials(emp.employeeName)}}
                </div>
                <div>
                  <h3 class="text-sm font-black text-slate-800">{{emp.employeeName}}</h3>
                  <p class="text-[9px] text-slate-400">{{emp.employeeEmail}}</p>
                </div>
              </div>

              <!-- Paid badge or Unpaid tag -->
              @if (emp.alreadyPaid) {
                <div class="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full">
                  <mat-icon class="text-sm">check_circle</mat-icon>
                  <div class="text-right">
                    <span class="text-xs font-black block">PAID</span>
                    @if (emp.paidAt) {
                      <span class="text-[9px] font-medium">{{emp.paidAt | date:'dd MMM, h:mm a'}}</span>
                    }
                  </div>
                </div>
              } @else {
                <span class="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  Unpaid
                </span>
              }
            </div>

            <!-- Items Breakdown Table -->
            <div class="px-6 py-4">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th class="pb-2">Service</th>
                    <th class="pb-2 text-right">Price</th>
                    <th class="pb-2 text-right">Rate</th>
                    <th class="pb-2 text-right">Earned</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (item of emp.items; track item.saleId + item.serviceName) {
                    <tr class="text-xs">
                      <td class="py-2.5 font-medium text-slate-700">{{item.serviceName}}</td>
                      <td class="py-2.5 text-right font-mono text-slate-500">KSh {{item.price | number}}</td>
                      <td class="py-2.5 text-right">
                        @if (item.commissionType === 'fixed') {
                          <span class="text-[10px] font-bold text-slate-400">Fixed</span>
                        } @else {
                          <span class="text-[10px] font-bold text-slate-400">{{item.commissionValue}}%</span>
                        }
                      </td>
                      <td class="py-2.5 text-right font-mono font-black"
                        [class.text-indigo-600]="item.commissionEarned > 0"
                        [class.text-slate-300]="item.commissionEarned === 0"
                      >
                        KSh {{item.commissionEarned | number:'1.0-0'}}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Card Footer: Total + Pay button -->
            <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Owed</p>
                <p class="text-xl font-black text-slate-900 font-mono">KSh {{emp.totalCommission | number:'1.0-0'}}</p>
              </div>

              @if (!emp.alreadyPaid && canPayCommissions()) {
                @if (emp.totalCommission > 0) {
                  <button
                    (click)="markAsPaid(emp)"
                    [disabled]="payingEmployeeId() === emp.employeeId"
                    class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                  >
                    @if (payingEmployeeId() === emp.employeeId) {
                      <mat-icon class="animate-spin text-sm">refresh</mat-icon>
                      Processing...
                    } @else {
                      <mat-icon class="text-sm">payments</mat-icon>
                      Mark as Paid — KSh {{emp.totalCommission | number:'1.0-0'}}
                    }
                  </button>
                } @else {
                  <span class="text-[10px] text-slate-400 italic">No commission owed</span>
                }
              }
            </div>
          </div>
        }
      }

      <!-- Success Toast -->
      @if (successMessage()) {
        <div class="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-600/30 animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3">
          <mat-icon>check_circle</mat-icon>
          <span class="text-sm font-bold">{{successMessage()}}</span>
        </div>
      }
    </div>
  `,
  styles: []
})
export class CommissionsPage implements OnInit {
  private serviceRecordService = inject(ServiceRecordService);
  authService = inject(AuthService);

  report = signal<CommissionReportEntry[]>([]);
  loading = signal(false);
  payingEmployeeId = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Default to today in YYYY-MM-DD format (local timezone)
  selectedDate: string = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD

  // Summary computed values
  totalOwed = computed(() =>
    this.report()
      .filter(e => !e.alreadyPaid)
      .reduce((sum, e) => sum + e.totalCommission, 0)
  );

  totalPaid = computed(() =>
    this.report()
      .filter(e => e.alreadyPaid)
      .reduce((sum, e) => sum + e.totalCommission, 0)
  );

  unpaidCount = computed(() => this.report().filter(e => !e.alreadyPaid).length);
  paidCount = computed(() => this.report().filter(e => e.alreadyPaid).length);

  // Only admin and manager can pay commissions
  canPayCommissions = computed(() => {
    const role = this.authService.user()?.role;
    return role === 'admin' || role === 'manager';
  });

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.loading.set(true);
    this.serviceRecordService.getCommissionReport(this.selectedDate).subscribe({
      next: (res) => {
        this.report.set(res.report || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markAsPaid(emp: CommissionReportEntry) {
    if (this.payingEmployeeId()) return; // Prevent concurrent pays

    this.payingEmployeeId.set(emp.employeeId);

    this.serviceRecordService.payCommissions({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      amount: emp.totalCommission,
      date: this.selectedDate,
    }).subscribe({
      next: (res) => {
        this.payingEmployeeId.set(null);
        this.showSuccess(res.message || `Commission paid to ${emp.employeeName}.`);
        this.loadReport(); // Reload to reflect updated paid state
      },
      error: (err) => {
        this.payingEmployeeId.set(null);
        const msg = err?.error?.message || 'Failed to process payment. Please try again.';
        alert(msg);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 4000);
  }
}
