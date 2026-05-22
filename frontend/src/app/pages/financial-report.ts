import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ExpenseService, ServiceRecordService, ShiftService } from '../services/api.services';
import { AuthService } from '../context/auth.state';
import { Expense, ServiceRecord, Shift } from '../models/types';
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
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Financial Reports & Shifts</h1>
          <p class="text-sm text-slate-500 mt-1">Comprehensive view of business income, expenses, shifts, and Z-report audits.</p>
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

      <!-- Shift Control Widget Card -->
      <div class="card-sleek p-6 bg-slate-900 text-white overflow-hidden relative">
        <div class="absolute -right-10 -bottom-10 opacity-5 text-indigo-400 animate-pulse">
          <mat-icon class="text-[140px] w-auto h-auto">point_of_sale</mat-icon>
        </div>
        
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <mat-icon>{{ currentShift() ? 'lock_open' : 'lock' }}</mat-icon>
            </div>
            <div>
              <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Shift Management</p>
              <h2 class="text-lg font-bold">
                @if (currentShift()) {
                  Shift Active — Opened at {{ currentShift()?.openedAt | date:'shortTime' }}
                } @else {
                  No Active Shift Session
                }
              </h2>
              @if (currentShift()) {
                <p class="text-xs text-slate-400 mt-0.5">
                  Opening Float: <span class="font-mono text-slate-200">KSh {{ currentShift()?.openingFloat | number }}</span> | Cash Sales: <span class="font-mono text-slate-200">KSh {{ currentShift()?.cashSales | number }}</span>
                </p>
              } @else {
                <p class="text-xs text-slate-400 mt-0.5">Please open a new shift before processing any sales.</p>
              }
            </div>
          </div>
          
          <div class="flex gap-3">
            @if (!currentShift()) {
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  #openingFloatInput
                  placeholder="Float e.g. 5000" 
                  class="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-3 py-2 w-32 outline-none focus:border-indigo-500" 
                />
                <button 
                  (click)="openShift(openingFloatInput.value)" 
                  class="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20"
                >
                  Open Shift
                </button>
              </div>
            } @else {
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  #closingCashInput
                  placeholder="Closing Cash Count" 
                  class="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-3 py-2 w-36 outline-none focus:border-indigo-500" 
                />
                <button 
                  (click)="closeShift(closingCashInput.value)" 
                  class="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20"
                >
                  Close Shift
                </button>
              </div>
            }
          </div>
        </div>
      </div>

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

      <!-- Shift Reports Section (Z-Reports & Rollups) -->
      <div class="card-sleek bg-white overflow-hidden border border-slate-50">
        <header class="p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-widest">Shift History & Daily Rollups (Z-Reports)</h3>
          <button (click)="loadRollup()" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <mat-icon class="text-sm">refresh</mat-icon> Refresh Rollups
          </button>
        </header>
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Rollup card -->
            <div class="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <p class="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Daily Retained Rollup</p>
              <h4 class="text-lg font-bold text-indigo-900">KSh {{ rollupSummary()?.totalNetSales | number }}</h4>
              <p class="text-[10px] text-slate-400 mt-1">Net collection across all shifts today.</p>
            </div>
            <div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
              <p class="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">VAT Collection Rollup</p>
              <h4 class="text-lg font-bold text-emerald-900">KSh {{ rollupSummary()?.totalTax | number }}</h4>
              <p class="text-[10px] text-slate-400 mt-1">Accumulated 16% VAT collected.</p>
            </div>
            <div class="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <p class="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Discounts Granted</p>
              <h4 class="text-lg font-bold text-amber-900">KSh {{ rollupSummary()?.totalDiscounts | number }}</h4>
              <p class="text-[10px] text-slate-400 mt-1">Total discounts granted to customers.</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">
                  <th class="px-6 py-4 text-left">Opened At</th>
                  <th class="px-6 py-4 text-left">Closed At</th>
                  <th class="px-6 py-4 text-left">Opened By</th>
                  <th class="px-6 py-4 text-right">Float</th>
                  <th class="px-6 py-4 text-right">Net Sales</th>
                  <th class="px-6 py-4 text-right">Tax</th>
                  <th class="px-6 py-4 text-right">Closing Cash</th>
                  <th class="px-6 py-4 text-center">Status</th>
                  <th class="px-6 py-4 text-right">Z-Report</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (sh of shifts(); track sh.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4 text-xs text-slate-700 whitespace-nowrap">
                      {{sh.openedAt | date:'mediumTime'}}
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {{sh.closedAt ? (sh.closedAt | date:'mediumTime') : 'Active Now'}}
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-700 font-semibold">
                      {{ getOpenedByName(sh) }}
                    </td>
                    <td class="px-6 py-4 text-right text-xs font-mono font-bold text-slate-700">
                      KSh {{sh.openingFloat | number}}
                    </td>
                    <td class="px-6 py-4 text-right text-xs font-mono font-bold text-indigo-600">
                      KSh {{sh.netSales | number}}
                    </td>
                    <td class="px-6 py-4 text-right text-xs font-mono text-slate-500">
                      KSh {{sh.taxCollected | number}}
                    </td>
                    <td class="px-6 py-4 text-right text-xs font-mono font-bold text-slate-700">
                      {{ sh.closingCash !== null && sh.closingCash !== undefined ? 'KSh ' + (sh.closingCash | number) : '—' }}
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span 
                        [class.bg-emerald-50]="sh.status === 'open'"
                        [class.text-emerald-700]="sh.status === 'open'"
                        [class.bg-slate-100]="sh.status === 'closed'"
                        [class.text-slate-700]="sh.status === 'closed'"
                        class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      >
                        {{sh.status}}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button 
                        (click)="fetchZReport(sh.id || '')" 
                        class="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-slate-400 text-xs italic">No shift sessions logged yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Z-Report Detailed Modal -->
      @if (showZReportModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-lg p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <header class="mb-6 flex justify-between items-center">
              <div>
                <h2 class="text-xl font-bold text-slate-800">Shift Z-Report Details</h2>
                <p class="text-xs text-slate-400 mt-1">Official audit summary for active/closed shift session.</p>
              </div>
              <button (click)="printZReport()" class="text-xs font-bold text-indigo-600 flex items-center gap-1 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                <mat-icon class="text-sm">print</mat-icon> Print Z-Report
              </button>
            </header>

            <div id="z-report-print-pane" class="space-y-6 text-sm text-slate-700">
              <div class="border-b border-slate-100 pb-4">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Shift Identification</p>
                <div class="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p class="text-xs text-slate-400">Shift ID</p>
                    <p class="font-mono text-xs">{{ zReportData()?.shift?.id }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">Status</p>
                    <p class="font-bold text-xs uppercase">{{ zReportData()?.shift?.status }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">Opened At</p>
                    <p class="text-xs">{{ zReportData()?.shift?.openedAt | date:'medium' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">Closed At</p>
                    <p class="text-xs">{{ zReportData()?.shift?.closedAt ? (zReportData()?.shift?.closedAt | date:'medium') : 'Still Active' }}</p>
                  </div>
                </div>
              </div>

              <div class="border-b border-slate-100 pb-4 space-y-2">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit Balance Sheet</p>
                <div class="flex justify-between">
                  <span>Opening Float:</span>
                  <span class="font-mono font-semibold">KSh {{ zReportData()?.shift?.openingFloat | number }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Cash Sales:</span>
                  <span class="font-mono font-semibold text-emerald-600">+ KSh {{ zReportData()?.shift?.cashSales | number }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Cash Refunds:</span>
                  <span class="font-mono font-semibold text-rose-500">- KSh {{ zReportData()?.shift?.cashRefunds | number }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Total Tax (16% VAT):</span>
                  <span class="font-mono font-semibold text-slate-600">KSh {{ zReportData()?.shift?.taxCollected | number }}</span>
                </div>
                <div class="flex justify-between border-t border-slate-100 pt-2 font-bold">
                  <span>Expected Till Cash:</span>
                  <span class="font-mono text-indigo-600">KSh {{ (zReportData()?.shift?.openingFloat || 0) + (zReportData()?.shift?.cashSales || 0) - (zReportData()?.shift?.cashRefunds || 0) | number }}</span>
                </div>
                @if (zReportData()?.shift?.closingCash !== null) {
                  <div class="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                    <span>Actual Closing Cash Counted:</span>
                    <span class="font-mono">KSh {{ zReportData()?.shift?.closingCash | number }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Variance:</span>
                    <span class="font-mono font-bold" [class.text-rose-500]="getVariance() !== 0" [class.text-emerald-500]="getVariance() === 0">
                      KSh {{ getVariance() | number }}
                    </span>
                  </div>
                }
              </div>

              <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shift Checkouts Log ({{ zReportData()?.transactions?.length || 0 }})</p>
                <div class="max-h-40 overflow-y-auto space-y-2 border border-slate-50 p-3 rounded-xl bg-slate-50/50">
                  @for (t of zReportData()?.transactions; track t.id) {
                    <div class="flex justify-between text-xs py-1 border-b border-slate-100 last:border-b-0">
                      <span>{{ t.name }}</span>
                      <span class="font-mono font-bold">{{ t.status === 'refunded' ? 'REFUNDED' : (t.status === 'voided' ? 'VOIDED' : 'KSh ' + (t.price | number)) }}</span>
                    </div>
                  } @empty {
                    <p class="text-xs text-slate-400 italic">No checkout records in this shift.</p>
                  }
                </div>
              </div>
            </div>

            <div class="flex gap-4 pt-6 mt-4 border-t border-slate-100">
              <button (click)="closeZReportModal()" class="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">Close Z-Report</button>
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
export class FinancialReportPage implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private serviceRecordService = inject(ServiceRecordService);
  private shiftService = inject(ShiftService);
  private platformId = inject(PLATFORM_ID);
  authService = inject(AuthService);

  currentDate = new Date();
  expenses = signal<Expense[]>([]);
  sales = signal<ServiceRecord[]>([]);
  shifts = signal<Shift[]>([]);
  currentShift = signal<Shift | null>(null);
  showAddExpense = signal(false);
  loadingForm = signal(false);

  // Z-Report Modal Signals
  showZReportModal = signal(false);
  zReportData = signal<{ shift: Shift; transactions: ServiceRecord[] } | null>(null);
  
  // Daily Rollup Signal
  rollupSummary = signal<{ totalNetSales: number; totalTax: number; totalDiscounts: number } | null>(null);

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
    this.loadCurrentShift();
    this.loadRollup();
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

  loadCurrentShift() {
    this.shiftService.getCurrentShift().subscribe({
      next: (res) => {
        this.currentShift.set(res.active ? (res.shift || null) : null);
      }
    });
  }

  loadRollup() {
    this.shiftService.getDailyRollup().subscribe({
      next: (res) => {
        this.shifts.set(res.shifts);
        
        // Calculate rollup summary
        let totalNetSales = 0;
        let totalTax = 0;
        let totalDiscounts = 0;
        
        res.shifts.forEach(s => {
          totalNetSales += s.netSales || 0;
          totalTax += s.taxCollected || 0;
          totalDiscounts += s.discounts || 0;
        });

        this.rollupSummary.set({
          totalNetSales,
          totalTax,
          totalDiscounts
        });
      }
    });
  }

  getOpenedByName(shift: Shift): string {
    if (typeof shift.openedBy === 'string') return 'Staff Member';
    return shift.openedBy?.name || 'Staff Member';
  }

  openShift(val: string) {
    const float = parseFloat(val);
    if (isNaN(float) || float < 0) {
      alert('Please enter a valid float amount');
      return;
    }

    this.shiftService.openShift(float).subscribe({
      next: () => {
        this.loadCurrentShift();
        this.loadRollup();
        alert('Shift opened successfully with KSh ' + float);
      },
      error: (err) => {
        alert(err.message || 'Error opening shift');
      }
    });
  }

  closeShift(val: string) {
    const cash = parseFloat(val);
    if (isNaN(cash) || cash < 0) {
      alert('Please enter a valid closing cash amount');
      return;
    }

    this.shiftService.closeShift(cash).subscribe({
      next: () => {
        this.loadCurrentShift();
        this.loadRollup();
        this.loadData();
        alert('Shift closed successfully. Closing cash registered: KSh ' + cash);
      },
      error: (err) => {
        alert(err.message || 'Error closing shift');
      }
    });
  }

  fetchZReport(id: string) {
    this.shiftService.getZReport(id).subscribe({
      next: (data) => {
        this.zReportData.set(data);
        this.showZReportModal.set(true);
      },
      error: (err) => {
        alert(err.message || 'Error fetching Z-Report');
      }
    });
  }

  closeZReportModal() {
    this.showZReportModal.set(false);
    this.zReportData.set(null);
  }

  getVariance(): number {
    const data = this.zReportData();
    if (!data || !data.shift) return 0;
    const shift = data.shift;
    const expected = (shift.openingFloat || 0) + (shift.cashSales || 0) - (shift.cashRefunds || 0);
    return (shift.closingCash || 0) - expected;
  }

  printZReport() {
    if (isPlatformBrowser(this.platformId)) {
      const originalTitle = document.title;
      document.title = 'Shift_Z_Report_' + (this.zReportData()?.shift?.id || 'Audit');
      window.print();
      document.title = originalTitle;
    }
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
