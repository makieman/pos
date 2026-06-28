import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ServiceRecordService, EmployeeService } from '../services/api.services';
import { AuthService } from '../context/auth.state';
import { ServiceRecord, Employee } from '../models/types';
import { FormsModule } from '@angular/forms';

type FilterRange = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'last-month' | 'custom';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 pb-20">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Sales Transactions</h1>
          <p class="text-sm text-slate-500 mt-1">Manage and track all transactions with refund and void compliance logs.</p>
        </div>
      </header>

      <!-- Search Section -->
      <div class="card-sleek bg-white p-6 border border-slate-100">
        <label for="sl-search-input" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Search Sales</label>
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</mat-icon>
            <input 
              id="sl-search-input"
              [(ngModel)]="searchQuery"
              type="text" 
              placeholder="Search sales by service or employee..." 
              class="w-full pl-10 pr-4 py-3 sm:py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm sm:shadow-none"
            />
          </div>
        </div>
      </div>

      <!-- Filters Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quick Filters -->
        <div class="card-sleek bg-white p-6 border border-slate-100">
          <span id="sl-quick-title" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Quick Filters</span>
          <div aria-labelledby="sl-quick-title" class="grid grid-cols-3 gap-2">
            @for (range of filterRanges; track range.id) {
              <button 
                (click)="activeRange.set(range.id)"
                [class]="activeRange() === range.id ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'"
                class="py-2.5 px-2 text-[10px] font-bold rounded-lg border transition-all truncate"
              >
                {{range.label}}
              </button>
            }
          </div>
        </div>

        <!-- Date Range Selection -->
        <div class="card-sleek bg-white p-6 border border-slate-100 lg:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="sl-spec-date" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Specific Date</label>
              <input id="sl-spec-date" type="date" [(ngModel)]="specificDate" class="w-full px-4 py-3 sm:py-2.5 text-sm border border-slate-200 rounded-lg outline-none" />
            </div>
            <div>
              <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1">
                  <label for="sl-start-date" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Start Date</label>
                  <input id="sl-start-date" type="date" [(ngModel)]="startDate" class="w-full px-3 py-3 sm:py-2.5 text-xs border border-slate-200 rounded-lg" />
                </div>
                <div class="flex-1">
                  <label for="sl-end-date" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">End Date</label>
                  <input id="sl-end-date" type="date" [(ngModel)]="endDate" class="w-full px-3 py-3 sm:py-2.5 text-xs border border-slate-200 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Method Filter -->
      <div class="card-sleek bg-white p-6 border border-slate-100">
        <span id="sl-pm-title" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Payment Method</span>
        <div aria-labelledby="sl-pm-title" class="flex flex-wrap gap-2">
          <button 
            (click)="activePaymentMethod.set('all')"
            [class]="activePaymentMethod() === 'all' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-100'"
            class="px-4 py-2 rounded-lg border text-[11px] font-bold transition-all"
          >
            All Methods
          </button>
          @for (method of paymentMethods; track method.id) {
            <button 
              (click)="activePaymentMethod.set(method.id)"
              [class]="activePaymentMethod() === method.id ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-100'"
              class="px-4 py-2 rounded-lg border text-[11px] font-bold transition-all"
            >
              {{method.label}}
            </button>
          }
        </div>
      </div>

      <!-- Stats -->
      <div class="w-full md:w-80 bg-white card-sleek p-6 border border-slate-100">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <mat-icon>monetization_on</mat-icon>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</p>
            <p class="text-xl font-black text-slate-900">KSh {{totalFilteredSales() | number}}</p>
          </div>
        </div>
      </div>

      <!-- List -->
      <div class="card-sleek bg-white overflow-hidden border border-slate-100">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th class="px-6 py-5">Date & Time</th>
                <th class="px-6 py-5">Items / Category</th>
                <th class="px-6 py-5">Staff Member</th>
                <th class="px-6 py-5">Payment & Tax</th>
                <th class="px-6 py-5">Status</th>
                <th class="px-6 py-5 text-right">Total Price</th>
                <th class="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (sale of filteredSales(); track sale.id) {
                <tr class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-[11px] font-bold text-slate-700">{{sale.createdAt | date:'MMM d, yyyy'}}</div>
                    <div class="text-[9px] text-slate-400">{{sale.createdAt | date:'shortTime'}}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-[12px] font-bold text-slate-800">{{sale.name}}</div>
                    @if (sale.items && sale.items.length > 0) {
                      <div class="text-[9px] text-slate-400 mt-0.5">
                        {{ sale.items.length }} {{ sale.items.length === 1 ? 'item' : 'items' }} checkout
                      </div>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[9px] font-black uppercase">
                        {{sale.employeeId ? getEmployeeName(sale.employeeId).charAt(0) : '?'}}
                      </div>
                      <span class="text-xs font-medium text-slate-600">{{sale.employeeId ? getEmployeeName(sale.employeeId) : 'Unknown'}}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col gap-0.5">
                      <span class="px-2 py-0.5 w-max rounded text-[9px] font-black uppercase border border-slate-100 bg-slate-50 text-slate-500">
                        {{sale.paymentMethod}}
                      </span>
                      @if (sale.tax) {
                        <span class="text-[9px] text-indigo-500">VAT: KSh {{ sale.tax | number }}</span>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span 
                      [class.bg-emerald-50]="sale.status === 'completed' || !sale.status"
                      [class.text-emerald-700]="sale.status === 'completed' || !sale.status"
                      [class.bg-rose-50]="sale.status === 'refunded'"
                      [class.text-rose-700]="sale.status === 'refunded'"
                      [class.bg-slate-100]="sale.status === 'voided'"
                      [class.text-slate-700]="sale.status === 'voided'"
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    >
                      {{ sale.status || 'completed' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="text-sm font-black text-slate-900 font-mono">KSh {{ (sale.price || 0) | number }}</span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    @if (sale.status === 'completed' || !sale.status) {
                      <div class="flex justify-end gap-2">
                        <button 
                          (click)="openRefundModal(sale)"
                          [disabled]="!canPerformRefundOrVoid()"
                          title="Refund Transaction"
                          class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                          [class]="canPerformRefundOrVoid() ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400 cursor-not-allowed'"
                        >
                          Refund
                        </button>
                        <button 
                          (click)="voidSale(sale)"
                          [disabled]="!canPerformRefundOrVoid()"
                          title="Void Transaction"
                          class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                          [class]="canPerformRefundOrVoid() ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'"
                        >
                          Void
                        </button>
                      </div>
                    } @else {
                      <span class="text-xs text-slate-400 italic">No Action</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-6 py-20 text-center">
                    <mat-icon class="text-5xl text-slate-100 mb-2">find_in_page</mat-icon>
                    <p class="text-slate-400 text-sm font-medium">No transactions match your search criteria.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Refund Reason Modal -->
      @if (showRefundModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-md p-8 animate-in zoom-in duration-300">
            <header class="mb-6">
              <h2 class="text-xl font-bold text-slate-800">Process Refund</h2>
              <p class="text-xs text-slate-400 mt-1">Provide a refund reason. Refund will restock inventory and log compliance audits.</p>
            </header>

            <div class="space-y-4">
              <div>
                <label for="refundReason" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Refund Reason</label>
                <textarea 
                  id="refundReason" 
                  [(ngModel)]="refundReason" 
                  rows="3" 
                  placeholder="e.g. Customer returned damaged item / requested swap"
                  class="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>
            </div>

            <div class="flex gap-4 pt-6">
              <button (click)="closeRefundModal()" class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
              <button 
                (click)="submitRefund()" 
                [disabled]="!refundReason.trim()"
                class="flex-[2] bg-rose-600 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/10"
              >
                Approve Refund
              </button>
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
export class SalesListPage implements OnInit {
  private serviceRecordService = inject(ServiceRecordService);
  private employeeService = inject(EmployeeService);
  authService = inject(AuthService);

  sales = signal<ServiceRecord[]>([]);
  employees = signal<Employee[]>([]);
  
  // Filtering Signals
  searchQuery = signal('');
  activeRange = signal<FilterRange>('this-month');
  activePaymentMethod = signal<string>('all');
  specificDate = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Refund Modal Signals
  showRefundModal = signal(false);
  selectedSaleToRefund = signal<ServiceRecord | null>(null);
  refundReason = '';

  filterRanges: { id: FilterRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this-week', label: 'This Week' },
    { id: 'this-month', label: 'This Month' },
    { id: 'last-month', label: 'Last Month' },
    { id: 'custom', label: 'Custom Range' },
  ];

  paymentMethods = [
    { id: 'cash', label: 'Cash' },
    { id: 'mpesa', label: 'MPESA' },
    { id: 'credit', label: 'Credit' },
    { id: 'split', label: 'Split' }
  ];

  filteredSales = computed(() => {
    let list = this.sales();

    // Text Search
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || (s.employeeId && this.getEmployeeName(s.employeeId).toLowerCase().includes(q)));
    }

    // Payment Method
    if (this.activePaymentMethod() !== 'all') {
      list = list.filter(s => s.paymentMethod === this.activePaymentMethod());
    }

    // Date Range Filtering
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    list = list.filter(s => {
      if (!s.createdAt) return false;
      const saleDate = new Date(s.createdAt);
      
      switch (this.activeRange()) {
        case 'today':
          return saleDate >= startOfToday;
        case 'yesterday': {
          const yesterday = new Date(startOfToday);
          yesterday.setDate(yesterday.getDate() - 1);
          return saleDate >= yesterday && saleDate < startOfToday;
        }
        case 'this-week': {
          const weekStart = new Date(startOfToday);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          return saleDate >= weekStart;
        }
        case 'this-month':
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        case 'last-month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return saleDate.getMonth() === lastMonth.getMonth() && saleDate.getFullYear() === lastMonth.getFullYear();
        }
        case 'custom': {
          if (this.specificDate()) {
            const spec = new Date(this.specificDate());
            return saleDate.toDateString() === spec.toDateString();
          }
          if (this.startDate() && this.endDate()) {
            const start = new Date(this.startDate());
            const end = new Date(this.endDate());
            end.setHours(23, 59, 59, 999);
            return saleDate >= start && saleDate <= end;
          }
          return true;
        }
        default:
          return true;
      }
    });

    return list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  });

  totalFilteredSales = computed(() => {
    // Only count completed sales in total filtered sales sum (refunded and voided do not count toward daily gross totals)
    return this.filteredSales()
      .filter(s => s.status === 'completed' || !s.status)
      .reduce((acc, curr) => acc + (curr.price || 0), 0);
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.employeeService.getEmployees().subscribe(data => this.employees.set(data));
    this.serviceRecordService.getRecentSales().subscribe(data => this.sales.set(data));
  }

  getEmployeeName(id: string): string {
    const emp = this.employees().find(e => e.id === id || (e as any)._id === id);
    return emp ? emp.name : 'Staff Member';
  }

  canPerformRefundOrVoid(): boolean {
    const user = this.authService.user();
    if (!user) return false;
    // Admins, Managers, and Supervisors are permitted. Waiters, Cashiers, and Accountants are restricted.
    return ['admin', 'manager', 'supervisor'].includes(user.role);
  }

  openRefundModal(sale: ServiceRecord) {
    this.selectedSaleToRefund.set(sale);
    this.refundReason = '';
    this.showRefundModal.set(true);
  }

  closeRefundModal() {
    this.showRefundModal.set(false);
    this.selectedSaleToRefund.set(null);
  }

  submitRefund() {
    const sale = this.selectedSaleToRefund();
    if (!sale || !sale.id) return;

    this.serviceRecordService.refundService(sale.id, this.refundReason).subscribe({
      next: () => {
        this.closeRefundModal();
        this.loadData();
        alert('Refund processed successfully. Inventory restocked.');
      },
      error: (err) => {
        alert(err.message || 'Error processing refund');
      }
    });
  }

  voidSale(sale: ServiceRecord) {
    if (!sale || !sale.id) return;
    if (confirm('Are you sure you want to void this transaction? This will mark it as VOIDED and restock any products.')) {
      this.serviceRecordService.voidService(sale.id).subscribe({
        next: () => {
          this.loadData();
          alert('Transaction voided successfully.');
        },
        error: (err) => {
          alert(err.message || 'Error voiding transaction');
        }
      });
    }
  }
}
