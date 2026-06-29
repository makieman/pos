import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ServiceRecordService, EmployeeService, InventoryService } from '../services/api.services';
import { AuthService } from '../context/auth.state';
import { Employee, PaymentMethod, InventoryItem } from '../models/types';

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

            <!-- Basket Items with per-item employee assignment -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <header class="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Basket Summary</h3>
                <span class="text-[10px] text-slate-400 font-bold">Assign staff to each item</span>
              </header>
              <div class="p-6">
                @if (selectedItems().length > 0) {
                  <div class="space-y-4">
                    @for (record of selectedItems(); track record.id + $index) {
                      <div 
                        class="flex flex-col p-4 bg-slate-50/50 rounded-xl group hover:bg-slate-50 transition-all border border-slate-100 gap-3"
                        [class.border-red-200]="formSubmitAttempted && !itemEmployees()[$index]"
                        [class.bg-red-50]="formSubmitAttempted && !itemEmployees()[$index]"
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">{{$index + 1}}</div>
                            <div>
                              <span class="text-xs font-bold text-slate-700">{{record.name}}</span>
                              <p class="text-[9px] text-purple-600 font-bold uppercase tracking-widest mt-0.5">
                                {{record.isTaxable !== false ? 'Taxable (16% VAT)' : 'Non-Taxable'}}
                              </p>
                            </div>
                          </div>
                          <div class="flex items-center gap-4">
                            <span class="text-xs font-black text-slate-900 font-mono">KSh {{record.price | number}}</span>
                            <button (click)="removeItem($index)" class="text-slate-300 hover:text-rose-500 transition-colors">
                              <mat-icon class="text-sm">delete_outline</mat-icon>
                            </button>
                          </div>
                        </div>

                        <!-- Per-item controls: discount + employee -->
                        <div class="flex flex-col sm:flex-row gap-3">
                          <!-- Item discount -->
                          <div class="flex items-center gap-1.5">
                            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Discount KSh:</label>
                            <input 
                              type="number"
                              [ngModel]="itemDiscounts()[$index] || 0"
                              (ngModelChange)="setDiscount($index, $event)"
                              class="w-16 p-1 text-xs font-mono text-center font-bold border border-slate-200 rounded" 
                              placeholder="0"
                              min="0"
                            />
                          </div>

                          <!-- Per-item employee assignment -->
                          <div class="flex-1">
                            <select
                              [ngModel]="itemEmployees()[$index] || ''"
                              (ngModelChange)="setEmployee($index, $event)"
                              class="w-full text-xs font-bold border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                              [class.border-red-300]="formSubmitAttempted && !itemEmployees()[$index]"
                              [class.bg-red-50]="formSubmitAttempted && !itemEmployees()[$index]"
                              [class.border-slate-200]="!formSubmitAttempted || itemEmployees()[$index]"
                              [class.bg-slate-50]="!formSubmitAttempted || itemEmployees()[$index]"
                            >
                              <option value="">Who performed this?</option>
                              @for (emp of employees(); track emp.id) {
                                <option [value]="emp.id">{{emp.name}} ({{emp.role}})</option>
                              }
                            </select>
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

                <!-- Payment Form -->
                <form [formGroup]="serviceForm" (ngSubmit)="onFormSubmit()" class="space-y-5 pt-4">
                  <div class="space-y-4">
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

                    <!-- Cash tendered -->
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

                    <!-- Split payment -->
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
                      (click)="onSubmitClick()"
                      [disabled]="serviceForm.invalid || selectedItems().length === 0 || loading() || isWaiterAndDiscountApplied() || hasUnassignedItems()"
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
                    @if (formSubmitAttempted && hasUnassignedItems()) {
                      <p class="text-[10px] text-red-500 mt-2 text-center ml-1">
                        Please assign a staff member to every item in the basket.
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
  authService = inject(AuthService);

  inventoryItems = signal<InventoryItem[]>([]);
  employees = signal<Employee[]>([]);
  selectedItems = signal<InventoryItem[]>([]);
  catalogSearch = signal('');
  selectedCategory = signal('all');
  
  loading = signal(false);
  success = signal(false);

  // Track if user attempted to submit (to trigger red highlights)
  formSubmitAttempted = false;

  // Signal-based dictionaries to guarantee reactiveness with Angular Signals
  itemDiscounts = signal<{ [key: number]: number }>({});
  itemEmployees = signal<{ [key: number]: string }>({});
  
  cartDiscountPercent: number = 0;
  amountTendered: number = 0;
  lastChange = signal<number>(0);
  splitCash: number = 0;

  serviceForm = this.fb.group({
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

  subtotal = signal<number>(0);
  totalDiscountsSum = signal<number>(0);
  calculatedTax = signal<number>(0);
  grandTotal = signal<number>(0);

  // True if any basket item has no employee assigned (reacts to itemEmployees signal changes)
  hasUnassignedItems = computed(() => {
    return this.selectedItems().some((_, i) => !this.itemEmployees()[i]);
  });

  ngOnInit() {
    this.employeeService.getEmployees().subscribe(data => this.employees.set(data));
    this.inventoryService.getItems().subscribe(data => {
      this.inventoryItems.set(data.sort((a, b) => (b.stock || 0) - (a.stock || 0)));
    });
  }

  selectPaymentMethod(method: any) {
    this.serviceForm.patchValue({ paymentMethod: method });
    this.amountTendered = 0;
    this.splitCash = 0;
  }

  addToCart(item: InventoryItem) {
    if (item.category === 'product' && (item.stock || 0) <= 0) {
      alert(`Product ${item.name} is currently out of stock! Sale blocked.`);
      return;
    }
    this.selectedItems.update(prev => [...prev, item]);
    this.success.set(false);
    this.recalculateTotals();
  }

  setEmployee(index: number, employeeId: string) {
    this.itemEmployees.update(prev => ({
      ...prev,
      [index]: employeeId
    }));
  }

  setDiscount(index: number, amount: number) {
    this.itemDiscounts.update(prev => ({
      ...prev,
      [index]: amount
    }));
    this.recalculateTotals();
  }

  removeItem(index: number) {
    // Remove the item from the basket
    this.selectedItems.update(prev => prev.filter((_, i) => i !== index));

    // Re-index both dicts so keys stay aligned with the new array positions
    const newEmployees: { [key: number]: string } = {};
    const newDiscounts: { [key: number]: number } = {};

    this.selectedItems().forEach((_, i) => {
      const oldIndex = i >= index ? i + 1 : i;
      if (this.itemEmployees()[oldIndex] !== undefined) {
        newEmployees[i] = this.itemEmployees()[oldIndex];
      }
      if (this.itemDiscounts()[oldIndex] !== undefined) {
        newDiscounts[i] = this.itemDiscounts()[oldIndex];
      }
    });

    this.itemEmployees.set(newEmployees);
    this.itemDiscounts.set(newDiscounts);
    this.recalculateTotals();
  }

  recalculateTotals() {
    const itemsList = this.selectedItems();
    
    const sub = itemsList.reduce((acc, curr) => acc + (curr.price || 0), 0);
    this.subtotal.set(sub);

    let itemDiscountsSum = 0;
    let taxableAmount = 0;

    itemsList.forEach((item, index) => {
      const disc = Number(this.itemDiscounts()[index]) || 0;
      itemDiscountsSum += disc;
      const itemSub = item.price - disc;
      if (item.isTaxable !== false) {
        taxableAmount += itemSub;
      }
    });

    const cartDiscount = (this.cartDiscountPercent / 100) * (sub - itemDiscountsSum);
    const totalDiscounts = itemDiscountsSum + cartDiscount;
    this.totalDiscountsSum.set(totalDiscounts);

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

  onSubmitClick() {
    this.formSubmitAttempted = true;
  }

  onFormSubmit() {
    this.formSubmitAttempted = true;
    if (this.serviceForm.invalid || this.selectedItems().length === 0 || this.isWaiterAndDiscountApplied() || this.hasUnassignedItems()) return;

    this.loading.set(true);
    const paymentMethod = this.serviceForm.get('paymentMethod')?.value as PaymentMethod;

    // Compile items with per-item employeeId
    const orderItems = this.selectedItems().map((item, index) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      discount: Number(this.itemDiscounts()[index]) || 0,
      isTaxable: item.isTaxable !== false,
      category: item.category,
      employeeId: this.itemEmployees()[index] || null,
    }));

    const splitDetails = paymentMethod === 'split' ? {
      cash: this.splitCash,
      card: this.grandTotal() - this.splitCash
    } : { cash: 0, card: 0 };

    const checkoutData = {
      items: orderItems,
      paymentMethod,
      splitDetails,
      cartDiscountPercent: this.cartDiscountPercent,
      amountTendered: this.amountTendered
    };

    this.serviceRecordService.createService(checkoutData).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(true);
        
        if (paymentMethod === 'cash') {
          this.lastChange.set(res.change || 0);
        } else {
          this.lastChange.set(0);
        }

        // Reset all state
        this.selectedItems.set([]);
        this.itemDiscounts.set({});
        this.itemEmployees.set({});
        this.cartDiscountPercent = 0;
        this.amountTendered = 0;
        this.splitCash = 0;
        this.formSubmitAttempted = false;
        this.serviceForm.patchValue({ paymentMethod: 'cash' });
        
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
