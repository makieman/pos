import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ExpenseService, ServiceRecordService } from '../services/api.services';
import { AuthService } from '../context/auth.state';
import { Expense, ServiceRecord } from '../models/types';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500 pb-20">
      <!-- Printable-only Header -->
      <div class="print-only-header">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-slate-900">POSPro POS</h1>
            <p class="text-xs text-slate-400 mt-1">Official Financial & Revenue Statement</p>
          </div>
          <div class="text-right">
            <p class="text-xs font-bold text-slate-800">Generated On</p>
            <p class="text-xs font-mono text-slate-500">{{currentDate | date:'medium'}}</p>
          </div>
        </div>
      </div>

      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Financial Reports</h1>
          <p class="text-sm text-slate-500 mt-1">Comprehensive view of business income, expenses, and profit.</p>
        </div>
        <div class="flex gap-3">
          <button 
            (click)="exportPDF()"
            class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition-all active:scale-95 uppercase tracking-wider"
          >
            <mat-icon class="text-sm">picture_as_pdf</mat-icon>
            Export PDF
          </button>
          <button 
            (click)="showAddExpense.set(!showAddExpense())"
            class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-slate-900/10 transition-all active:scale-95 uppercase tracking-wider"
          >
            <mat-icon class="text-sm">{{showAddExpense() ? 'close' : 'add'}}</mat-icon>
            {{showAddExpense() ? 'Close' : 'Add Expense'}}
          </button>
        </div>
      </header>

      <!-- Financial Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card-sleek p-6 bg-white border-l-4 border-emerald-500 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Total Revenue</span>
            <mat-icon class="text-emerald-500 text-sm">trending_up</mat-icon>
          </div>
          <p class="text-2xl font-black text-slate-900">KSh {{totalIncome() | number}}</p>
          <p class="text-[10px] text-slate-400 mt-1">Gross sales from all services</p>
        </div>

        <div class="card-sleek p-6 bg-white border-l-4 border-rose-500 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-rose-600">Total Expenses</span>
            <mat-icon class="text-rose-500 text-sm">trending_down</mat-icon>
          </div>
          <p class="text-2xl font-black text-slate-900">KSh {{totalExpenses() | number}}</p>
          <p class="text-[10px] text-slate-400 mt-1">Business costs + employee commissions</p>
        </div>

        <div class="card-sleek p-6 bg-slate-900 text-white border-l-4 border-indigo-500 shadow-xl overflow-hidden relative group">
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Net Profit</span>
              <mat-icon class="text-indigo-400 text-sm">account_balance_wallet</mat-icon>
            </div>
            <p class="text-2xl font-black text-white">KSh {{netProfit() | number}}</p>
            <div class="flex items-center gap-1 mt-1">
              <span class="text-[10px] font-bold" [class.text-emerald-400]="profitMargin() > 0" [class.text-rose-400]="profitMargin() <= 0">
                {{profitMargin() | number:'1.0-1'}}%
              </span>
              <span class="text-[10px] text-slate-400">profit margin</span>
            </div>
          </div>
          <mat-icon class="absolute -right-8 -bottom-8 text-white/5 text-[120px] group-hover:scale-110 transition-transform duration-1000">payments</mat-icon>
        </div>
      </div>

      @if (showAddExpense()) {
        <div class="card-sleek p-8 bg-white max-w-xl animate-in slide-in-from-top-4 duration-300 mx-auto">
          <h2 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <mat-icon class="text-orange-500">receipt_long</mat-icon>
            Record New Expense
          </h2>
          <form [formGroup]="expenseForm" (ngSubmit)="onExpenseSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-1">
              <label for="title" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
              <input id="title" type="text" formControlName="title" placeholder="e.g. Salon Rent / Rent" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div class="md:col-span-1">
              <label for="amount" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount (KSh)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">KSh</span>
                <input id="amount" type="number" formControlName="amount" placeholder="500" class="w-full pl-10 pr-3 py-2.5 text-sm border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>
            
            <div class="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="submit" [disabled]="expenseForm.invalid || loadingForm()" class="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95">
                @if (loadingForm()) {
                  <mat-icon class="animate-spin text-sm mr-2">refresh</mat-icon>
                }
                Save Expense
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class FinancialReportPage implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private serviceRecordService = inject(ServiceRecordService);
  private platformId = inject(PLATFORM_ID);
  authService = inject(AuthService);

  currentDate = new Date();
  expenses = signal<Expense[]>([]);
  sales = signal<ServiceRecord[]>([]);
  showAddExpense = signal(false);
  loadingForm = signal(false);

  expenseForm = this.fb.group({
    title: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(0)]]
  });

  exportPDF() {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }

  // Computed Values
  totalIncome = computed(() => {
    return this.sales()
      .filter(s => s.status === 'completed' || !s.status)
      .reduce((acc, curr) => acc + (curr.price || 0), 0);
  });

  totalCommissions = computed(() => {
    return this.sales()
      .filter(s => s.status === 'completed' || !s.status)
      .reduce((acc, curr) => acc + (curr.commissionEarned || 0), 0);
  });

  businessExpensesTotal = computed(() => {
    return this.expenses().reduce((acc, curr) => acc + (curr.amount || 0), 0);
  });

  totalExpenses = computed(() => {
    return this.totalCommissions() + this.businessExpensesTotal();
  });

  netProfit = computed(() => {
    return this.totalIncome() - this.totalExpenses();
  });

  profitMargin = computed(() => {
    const income = this.totalIncome();
    if (income === 0) return 0;
    return (this.netProfit() / income) * 100;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      expenses: this.expenseService.getExpenses(),
      sales: this.serviceRecordService.getRecentSales()
    }).subscribe(results => {
      this.expenses.set(results.expenses);
      this.sales.set(results.sales);
    });
  }

  onExpenseSubmit() {
    if (this.expenseForm.invalid) return;

    this.loadingForm.set(true);
    const data = this.expenseForm.value as unknown as Expense;
    this.expenseService.createExpense(data).subscribe({
      next: () => {
        this.loadData();
        this.expenseForm.reset();
        this.showAddExpense.set(false);
        this.loadingForm.set(false);
      },
      error: () => this.loadingForm.set(false)
    });
  }
}
