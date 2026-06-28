import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ServiceRecordService, EmployeeService, InventoryService, ShiftService } from '../services/api.services';
import { AuthService } from '../context/auth.state';
import { Employee, ServiceRecord, PaymentMethod, InventoryItem, Shift } from '../models/types';

@Component({
  selector: 'app-service-recording',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 pb-20">
      <header class="flex justify-between items-center px-1">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Create New Sale</h1>
          <p class="text-xs text-slate-500 mt-1">Select products or services from the catalog to record a transaction.</p>
        </div>
      </header>

      <!-- Active Shift Presence Verification (Bypassed) -->
      @if (false) {
        <div class="card-sleek p-10 bg-slate-900 text-white rounded-2xl max-w-xl mx-auto text-center space-y-6 shadow-xl animate-in zoom-in duration-300">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full mb-2">
            <mat-icon class="scale-150">lock</mat-icon>
          </div>
          <h2 class="text-xl font-bold tracking-tight">Shift Control: Shift is Closed</h2>
          <p class="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            You must open a new shift by entering an opening cash float to begin recording sales.
          </p>
          <div class="max-w-xs mx-auto space-y-4 pt-4">
            <div>
              <label for="opening-float" class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Opening Cash Float (KSh)</label>
              <input 
                id="opening-float"
                type="number" 
                [(ngModel)]="openingFloatInput"
                class="w-full bg-slate-800 text-white text-center text-lg font-black border border-slate-700 rounded-xl p-3.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" 
                placeholder="1000" 
              />
            </div>
            <button 
              (click)="openShift()" 
              [disabled]="openingFloatInput <= 0 || loadingShift()"
              class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold p-3.5 rounded-xl uppercase tracking-wider text-[11px] shadow-lg shadow-indigo-600/15 transition-all"
            >
              @if (loadingShift()) {
                Opening Shift...
              } @else {
                Open Active Shift
              }
            </button>
          </div>
        </div>
      } @else {
        <!-- Checkout Interface -->
        <div class="p-5 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/10 text-white">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10 w-fit">
                <mat-icon class="text-sm">inventory_2</mat-icon>
                <span class="text-[10px] font-bold uppercase tracking-widest text-white/90">Catalog Selection</span>
              </div>

            </div>
            
            <div class="flex flex-col sm:flex-row gap-2">
              <select 
                [(ngModel)]="selectedCategory"
                class="bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg px-4 py-3 sm:py-0 outline-none appearance-none cursor-pointer hover:bg-white/20 transition-all sm:min-w-[140px] w-full sm:w-auto"
              >
                <option value="all" class="text-slate-900">All Categories</option>
                @for (cat of categories(); track cat) {
                  <option [value]="cat" class="text-slate-900">{{cat}}</option>
                }
              </select>
              
              <div class="relative group min-w-[200px]">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-400 transition-colors">search</mat-icon>
                <input 
                  type="text" 
                  [(ngModel)]="catalogSearch"
                  placeholder="Search products..." 
                  class="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-white text-slate-900 border-none rounded-lg text-sm outline-none shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Product Catalog Section -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
              <header class="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Catalog</h3>
                <span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">{{filteredCatalog().length}} Items Available</span>
              </header>
              
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      <th class="px-6 py-4">Item Name</th>
                      <th class="px-6 py-4">Category</th>
                      <th class="px-6 py-4">Tax Type</th>
                      <th class="px-6 py-4 text-center">In Stock</th>
                      <th class="px-6 py-4 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    @for (item of filteredCatalog(); track item.id) {
                      <tr 
                        (click)="addToCart(item)"
                        class="hover:bg-slate-50/80 cursor-pointer transition-all group border-l-4 border-transparent hover:border-indigo-600"
                      >
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-4">
                            <div class="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <mat-icon>{{item.category === 'service' ? 'spa' : 'package_2'}}</mat-icon>
                            </div>
                            <div>
                              <div class="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{{item.name}}</div>
                              <div class="text-[9px] text-slate-300 font-mono tracking-tighter">REF-{{item.id.slice(0,8)}}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <span class="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md lowercase tracking-tight">{{item.category}}</span>
                        </td>
                        <td class="px-6 py-4">
                          <span 
                            class="text-[9px] font-bold px-2 py-0.5 rounded-md tracking-tight"
                            [class.bg-purple-50]="item.isTaxable !== false"
                            [class.text-purple-600]="item.isTaxable !== false"
                            [class.bg-slate-100]="item.isTaxable === false"
                            [class.text-slate-400]="item.isTaxable === false"
                          >
                            {{item.isTaxable !== false ? 'Taxable (16% VAT)' : 'Non-Taxable'}}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-center font-mono">
                          @if (item.category === 'product') {
                            <span 
                              class="text-xs font-black py-1 px-3 rounded-lg"
                              [class.bg-indigo-50]="(item.stock || 0) > 5" 
                              [class.text-indigo-600]="(item.stock || 0) > 5"
                              [class.bg-rose-50]="(item.stock || 0) <= 5"
                              [class.text-rose-600]="(item.stock || 0) <= 5"
                            >
                              {{item.stock || 0}}
                            </span>
                          } @else {
                            <span class="text-xs text-slate-300 italic font-bold">Infinite</span>
                          }
                        </td>
                        <td class="px-6 py-4 text-right">
                          <div class="text-xs font-black text-slate-900 font-mono tracking-tighter">KSh {{item.price | number}}</div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="px-6 py-24 text-center">
                          <mat-icon class="text-6xl text-slate-100 mb-2">content_paste_search</mat-icon>
                          <p class="text-xs text-slate-400 font-medium italic">No catalog items matched your search.</p>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Basket Items with Item-Level Discount -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <header class="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Basket Summary</h3>
                <span class="text-[10px] text-slate-400 font-bold">Item-level discounts can be entered directly</span>
              </header>
              <div class="p-6">
                @if (selectedItems().length > 0) {
                  <div class="space-y-4">
                    @for (record of selectedItems(); track record.id + $index) {
                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50/50 rounded-xl group hover:bg-slate-50 transition-all border border-slate-100 gap-3">
                        <div class="flex items-center gap-3">
                          <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">{{$index + 1}}</div>
                          <div>
                            <span class="text-xs font-bold text-slate-700">{{record.name}}</span>
                            <p class="text-[9px] text-purple-600 font-bold uppercase tracking-widest mt-0.5">
                              {{record.isTaxable !== false ? 'Taxable (16% VAT)' : 'Non-Taxable'}}
                            </p>
                          </div>
                        </div>
                        
                        <div class="flex items-center justify-between sm:justify-end gap-6 grow">
                          <!-- Item level discount inputs (KSh) -->
                          <div class="flex items-center gap-1.5">
                            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Discount KSh:</label>
                            <input 
                              type="number"
                              [(ngModel)]="itemDiscounts[$index]"
                              (input)="recalculateTotals()"
                              class="w-16 p-1 text-xs font-mono text-center font-bold border border-slate-200 rounded" 
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          
                          <div class="flex items-center gap-4">
                            <span class="text-xs font-black text-slate-900 font-mono">KSh {{record.price | number}}</span>
                            <button (click)="removeItem($index)" class="text-slate-300 hover:text-rose-500 transition-colors">
                              <mat-icon class="text-sm">delete_outline</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="py-16 text-center">
                    <p class="text-xs text-slate-300 italic font-medium">Click on items in the catalog to add to basket.</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Checkout Column -->
          <div class="space-y-6">
            <div class="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden sticky top-8">
              <header class="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <h3 class="text-xs font-bold uppercase tracking-[0.1em]">Payment Summary</h3>
                <mat-icon class="text-indigo-400 text-sm">wallet</mat-icon>
              </header>
              
              <div class="p-6 space-y-6">
                <!-- Pricing Breakdown -->
                <div class="space-y-4">
                  <div class="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span class="text-slate-800 font-mono">KSh {{subtotal() | number}}</span>
                  </div>
                  
                  <div class="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span>Discounts given</span>
                    <span class="text-rose-500 font-mono">-KSh {{totalDiscountsSum() | number}}</span>
                  </div>

                  <div class="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span>Tax (16% VAT)</span>
                    <span class="text-purple-600 font-mono">KSh {{calculatedTax() | number}}</span>
                  </div>

                  <!-- Percentage Cart-level Discount Input -->
                  <div class="pt-2 flex items-center justify-between border-t border-slate-50 gap-2">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cart-level Discount (%)</label>
                    <input 
                      type="number" 
                      [(ngModel)]="cartDiscountPercent" 
                      (input)="recalculateTotals()"
                      class="w-16 p-2 text-xs font-mono font-black text-center bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div class="pt-4 border-t border-dashed border-slate-200 flex justify-between items-end">
                    <div class="space-y-1">
                      <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                      <div class="text-[10px] text-slate-900 font-bold animate-pulse">Ready for payment</div>
                    </div>
                    <span class="text-3xl font-black text-slate-900 tracking-tighter font-mono">KSh {{grandTotal() | number}}</span>
                  </div>
                </div>

                <!-- Transaction Assignment Form -->
                <form [formGroup]="serviceForm" (ngSubmit)="onFormSubmit()" class="space-y-5 pt-4">
                  <div class="space-y-4">
                    <div>
                      <label for="serv-staff-select" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Assign to Staff Member</label>
                      <select id="serv-staff-select" formControlName="employeeId" class="w-full text-xs font-bold border-slate-100 rounded-xl bg-slate-50 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm">
                        <option value="">Select Service Provider</option>
                        @for (emp of employees(); track emp.id) {
                          <option [value]="emp.id">{{emp.name}} ({{emp.role}})</option>
                        }
                      </select>
                    </div>

                    <div>
                      <span id="serv-pm-title" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Select Payment Method</span>
                      <div aria-labelledby="serv-pm-title" class="grid grid-cols-2 gap-2">
                        @for (method of [{id: 'cash', label: 'Cash'}, {id: 'mpesa', label: 'MPESA'}, {id: 'credit', label: 'Credit'}, {id: 'split', label: 'Split'}]; track method.id) {
                          <button 
                            type="button"
                            (click)="selectPaymentMethod(method.id)"
                            [class]="serviceForm.get('paymentMethod')?.value === method.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'"
                            class="p-3 rounded-xl text-[10px] font-bold transition-all border shadow-sm uppercase tracking-tighter"
                          >
                            {{method.label}}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Cash tendered changes (change calculation widget) -->
                    @if (serviceForm.get('paymentMethod')?.value === 'cash') {
                      <div class="animate-in slide-in-from-top-2">
                        <label for="cash-tendered" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cash Amount Tendered (KSh)</label>
                        <input 
                          id="cash-tendered"
                          type="number" 
                          [(ngModel)]="amountTendered"
                          [ngModelOptions]="{standalone: true}"
                          class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                          placeholder="Enter cash received"
                        />
                        @if (amountTendered >= grandTotal()) {
                          <div class="mt-2 text-right">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Change Due:</span>
                            <span class="text-lg font-black text-indigo-600 font-mono">KSh {{(amountTendered - grandTotal()) | number}}</span>
                          </div>
                        }
                      </div>
                    }

                    <!-- Split payment fields -->
                    @if (serviceForm.get('paymentMethod')?.value === 'split') {
                      <div class="grid grid-cols-2 gap-4 border border-indigo-50 p-4 rounded-xl bg-slate-50/50 animate-in slide-in-from-top-2">
                        <div>
                          <label for="split-cash" class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cash Portion (KSh)</label>
                          <input 
                            id="split-cash"
                            type="number" 
                            [(ngModel)]="splitCash"
                            [ngModelOptions]="{standalone: true}"
                            class="w-full text-xs border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Portion (KSh)</label>
                          <div class="w-full text-xs font-mono font-bold p-2 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 h-9 flex items-center">
                            KSh {{(grandTotal() - splitCash) | number}}
                          </div>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="pt-6">
                    <button 
                      type="submit" 
                      [disabled]="serviceForm.invalid || selectedItems().length === 0 || loading() || isWaiterAndDiscountApplied()"
                      class="w-full group bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-sm font-black text-white p-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                      @if (loading()) {
                        <mat-icon class="animate-spin text-sm">refresh</mat-icon>
                      } @else {
                        <mat-icon class="text-white/80 group-hover:scale-110 transition-transform">check_circle</mat-icon>
                      }
                      Complete Checkout
                    </button>
                    @if (isWaiterAndDiscountApplied()) {
                      <p class="text-[10px] text-red-500 mt-2 text-center ml-1">
                        Waiters are not permitted to apply discounts.
                      </p>
                    }
                  </div>
                </form>

                @if (success()) {
                  <div class="p-5 bg-indigo-50 border border-indigo-100 rounded-xl text-center text-slate-800 animate-in zoom-in duration-300">
                    <mat-icon class="text-indigo-600 text-lg mb-1 block mx-auto">check_circle</mat-icon>
                    <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600">Checkout Success</p>
                    
                    @if (lastChange() > 0) {
                      <p class="text-[11px] font-bold mt-2">Change Returned: <span class="font-mono text-indigo-600 font-black">KSh {{lastChange() | number}}</span></p>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    input { outline: none; }
    select { appearance: none; }
  `]
})
export class ServicesPage implements OnInit {
  private fb = inject(FormBuilder);
  private serviceRecordService = inject(ServiceRecordService);
  private employeeService = inject(EmployeeService);
  private inventoryService = inject(InventoryService);
  private shiftService = inject(ShiftService);
  authService = inject(AuthService);

  inventoryItems = signal<InventoryItem[]>([]);
  employees = signal<Employee[]>([]);
  selectedItems = signal<InventoryItem[]>([]);
  catalogSearch = signal('');
  selectedCategory = signal('all');
  
  loading = signal(false);
  success = signal(false);

  // Shift control state
  activeShift = signal<Shift | null>(null);
  openingFloatInput: number = 1000;
  loadingShift = signal(false);

  // Advanced checkout inputs
  itemDiscounts: { [key: number]: number } = {};
  cartDiscountPercent: number = 0;
  amountTendered: number = 0;
  lastChange = signal<number>(0);
  
  // Split payment state
  splitCash: number = 0;

  serviceForm = this.fb.group({
    employeeId: ['', Validators.required],
    paymentMethod: ['cash' as PaymentMethod, Validators.required]
  });

  // Computed totals
  categories = computed(() => {
    const cats = this.inventoryItems().map(i => i.category || 'general');
    return Array.from(new Set(cats));
  });

  filteredCatalog = computed(() => {
    const term = this.catalogSearch().toLowerCase();
    const cat = this.selectedCategory();
    let items = this.inventoryItems();

    if (cat !== 'all') {
      items = items.filter(i => (i.category || 'general') === cat);
    }

    if (!term) return items;
    return items.filter(i => 
      i.name.toLowerCase().includes(term) || 
      i.category?.toLowerCase().includes(term)
    );
  });

  selectedEmployee = computed(() => {
    const id = this.serviceForm.get('employeeId')?.value;
    return this.employees().find(e => e.id === id);
  });

  subtotal = signal<number>(0);
  totalDiscountsSum = signal<number>(0);
  calculatedTax = signal<number>(0);
  grandTotal = signal<number>(0);

  ngOnInit() {
    this.employeeService.getEmployees().subscribe(data => this.employees.set(data));
    this.inventoryService.getItems().subscribe(data => {
      this.inventoryItems.set(data.sort((a, b) => (b.stock || 0) - (a.stock || 0)));
    });
  }



  openShift() {
    if (this.openingFloatInput <= 0) return;
    this.loadingShift.set(true);
    this.shiftService.openShift(this.openingFloatInput).subscribe({
      next: (res) => {
        this.activeShift.set(res.shift);
        this.loadingShift.set(false);
      },
      error: () => this.loadingShift.set(false)
    });
  }

  selectPaymentMethod(method: any) {
    this.serviceForm.patchValue({ paymentMethod: method });
    this.amountTendered = 0;
    this.splitCash = 0;
  }

  addToCart(item: InventoryItem) {
    // Restrict out-of-stock product sales (Module 3)
    if (item.category === 'product' && (item.stock || 0) <= 0) {
      alert(`Product ${item.name} is currently out of stock! Sale blocked.`);
      return;
    }

    this.selectedItems.update(prev => [...prev, item]);
    this.success.set(false);
    this.recalculateTotals();
  }

  removeItem(index: number) {
    this.selectedItems.update(prev => prev.filter((_, i) => i !== index));
    // Clear discount index
    delete this.itemDiscounts[index];
    this.recalculateTotals();
  }

  recalculateTotals() {
    const itemsList = this.selectedItems();
    
    // Subtotal
    const sub = itemsList.reduce((acc, curr) => acc + (curr.price || 0), 0);
    this.subtotal.set(sub);

    // Item discounts sum
    let itemDiscountsSum = 0;
    let taxableAmount = 0;

    itemsList.forEach((item, index) => {
      const disc = Number(this.itemDiscounts[index]) || 0;
      itemDiscountsSum += disc;
      
      const itemSub = item.price - disc;
      if (item.isTaxable !== false) {
        taxableAmount += itemSub;
      }
    });

    // Cart level percentage discount
    const cartDiscount = (this.cartDiscountPercent / 100) * (sub - itemDiscountsSum);
    const totalDiscounts = itemDiscountsSum + cartDiscount;
    this.totalDiscountsSum.set(totalDiscounts);

    // Compute Tax (16% VAT on taxable items after proportional discount)
    const discountProportion = sub > 0 ? (totalDiscounts / sub) : 0;
    const discountedTaxableAmount = taxableAmount * (1 - discountProportion);
    const tax = Math.round(discountedTaxableAmount * 0.16);
    this.calculatedTax.set(tax);

    const total = Math.max(0, sub - totalDiscounts + tax);
    this.grandTotal.set(total);
    
    if (this.splitCash === 0) {
      this.splitCash = Math.round(total / 2);
    }
  }

  isWaiterAndDiscountApplied(): boolean {
    const role = this.authService.user()?.role;
    return role === 'waiter' && this.totalDiscountsSum() > 0;
  }

  onFormSubmit() {
    if (this.serviceForm.invalid || this.selectedItems().length === 0 || this.isWaiterAndDiscountApplied()) return;

    this.loading.set(true);
    const empId = this.serviceForm.get('employeeId')?.value;
    const paymentMethod = this.serviceForm.get('paymentMethod')?.value as PaymentMethod;

    // Compile items list
    const orderItems = this.selectedItems().map((item, index) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      discount: Number(this.itemDiscounts[index]) || 0,
      isTaxable: item.isTaxable !== false,
      category: item.category
    }));

    // Split details
    const splitDetails = paymentMethod === 'split' ? {
      cash: this.splitCash,
      card: this.grandTotal() - this.splitCash
    } : { cash: 0, card: 0 };

    const checkoutData = {
      items: orderItems,
      employeeId: empId,
      paymentMethod,
      splitDetails,
      cartDiscountPercent: this.cartDiscountPercent,
      amountTendered: this.amountTendered
    };

    this.serviceRecordService.createService(checkoutData).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(true);
        
        // Output change
        if (paymentMethod === 'cash') {
          this.lastChange.set(res.change || 0);
        } else {
          this.lastChange.set(0);
        }

        // Reset
        this.selectedItems.set([]);
        this.itemDiscounts = {};
        this.cartDiscountPercent = 0;
        this.amountTendered = 0;
        this.splitCash = 0;
        this.serviceForm.patchValue({
          employeeId: '',
          paymentMethod: 'cash'
        });
        
        this.recalculateTotals();
        
        // Refresh catalog for stock
        this.inventoryService.getItems().subscribe(data => {
          this.inventoryItems.set(data.sort((a, b) => (b.stock || 0) - (a.stock || 0)));
        });

        setTimeout(() => this.success.set(false), 8000);
      },
      error: () => this.loading.set(false)
    });
  }
}
