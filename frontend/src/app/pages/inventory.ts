import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../services/api.services';
import { InventoryItem, InventoryCategory } from '../models/types';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Inventory Management</h1>
          <p class="text-sm text-slate-500 mt-1">Manage your services and products.</p>
        </div>
        <button 
          (click)="showAddModal.set(true)"
          class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-slate-900/10 transition-all active:scale-95 uppercase tracking-wider"
        >
          <mat-icon class="text-sm">add</mat-icon>
          Add New Item
        </button>
      </header>

      <!-- Category Filter Tabs -->
      <div class="flex border-b border-slate-100 mb-6">
        <button 
          (click)="filterCategory.set('all')"
          [class.border-indigo-500]="filterCategory() === 'all'"
          [class.text-indigo-600]="filterCategory() === 'all'"
          class="px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all"
        >
          All Items
        </button>
        <button 
          (click)="filterCategory.set('service')"
          [class.border-indigo-500]="filterCategory() === 'service'"
          [class.text-indigo-600]="filterCategory() === 'service'"
          class="px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all"
        >
          Services
        </button>
        <button 
          (click)="filterCategory.set('product')"
          [class.border-indigo-500]="filterCategory() === 'product'"
          [class.text-indigo-600]="filterCategory() === 'product'"
          class="px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all"
        >
          Products
        </button>
      </div>

      <!-- Inventory Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (item of filteredItems(); track item.id) {
          <div class="card-sleek p-6 bg-white group hover:shadow-xl transition-all duration-300 border border-slate-50 relative overflow-hidden">
            <!-- Category Tag -->
            <div class="absolute top-0 right-0 p-2">
              <span 
                [class.bg-blue-50]="item.category === 'service'"
                [class.text-blue-600]="item.category === 'service'"
                [class.bg-amber-50]="item.category === 'product'"
                [class.text-amber-600]="item.category === 'product'"
                class="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter"
              >
                {{item.category}}
              </span>
            </div>

            <div class="mb-4">
              <h3 class="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{{item.name}}</h3>
              <p class="text-[10px] text-slate-400 mt-1 line-clamp-2 h-8">{{item.description || 'No description'}}</p>
            </div>

            <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
              <div>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Price</p>
                <p class="text-sm font-bold text-slate-900">KSh {{item.price | number}}</p>
              </div>
              @if (item.category === 'product') {
                <div class="text-right">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stock</p>
                  <p [class.text-red-500]="(item.stock || 0) < 5" class="text-sm font-bold text-slate-700">{{item.stock}} left</p>
                </div>
              }
            </div>

            <!-- Actions Overlay -->
            <div class="mt-4 flex gap-2">
              <button 
                (click)="editItem(item)"
                class="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 py-2 rounded-lg transition-all"
              >
                Edit
              </button>
              <button 
                (click)="deleteItem(item.id)"
                class="px-3 text-slate-400 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-all"
              >
                <mat-icon class="text-sm">delete_outline</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (showAddModal()) {
        <div 
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          (click)="closeModal()"
          role="button"
          tabindex="0"
          (keydown.escape)="closeModal()"
        >
          <div 
            class="bg-white rounded-2xl w-full max-w-md p-8 animate-in zoom-in duration-300" 
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
            role="dialog"
            aria-labelledby="modal-title"
          >
            <header class="mb-8">
              <h2 id="modal-title" class="text-xl font-bold text-slate-800">{{editingId ? 'Edit Item' : 'New Inventory Item'}}</h2>
              <p class="text-xs text-slate-400 mt-1">Add a new service or product to your library.</p>
            </header>

            <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</span>
                  <div class="flex gap-2">
                    <button 
                      type="button"
                      (click)="itemForm.patchValue({ category: 'service' })"
                      [class.bg-indigo-600]="itemForm.get('category')?.value === 'service'"
                      [class.text-white]="itemForm.get('category')?.value === 'service'"
                      class="flex-1 py-2 text-[10px] font-bold uppercase border border-slate-200 rounded-lg transition-all"
                    >
                      Service
                    </button>
                    <button 
                      type="button"
                      (click)="itemForm.patchValue({ category: 'product' })"
                      [class.bg-indigo-600]="itemForm.get('category')?.value === 'product'"
                      [class.text-white]="itemForm.get('category')?.value === 'product'"
                      class="flex-1 py-2 text-[10px] font-bold uppercase border border-slate-200 rounded-lg transition-all"
                    >
                      Product
                    </button>
                  </div>
                </div>

                <div class="col-span-2">
                  <label for="name" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Name</label>
                  <input id="name" type="text" formControlName="name" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label for="price" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Price (KSh)</label>
                  <input id="price" type="number" formControlName="price" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                @if (itemForm.get('category')?.value === 'product') {
                  <div>
                    <label for="stock" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Initial Stock</label>
                    <input id="stock" type="number" formControlName="stock" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                }

                <div class="col-span-2 flex items-center gap-2 py-2 bg-slate-50 rounded-xl px-4 border border-slate-100">
                  <input id="isTaxable" type="checkbox" formControlName="isTaxable" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                  <label for="isTaxable" class="text-xs font-semibold text-slate-700 cursor-pointer">
                    Taxable Item (16% VAT will be applied during checkout)
                  </label>
                </div>

                <div class="col-span-2">
                  <label for="description" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea id="description" formControlName="description" rows="3" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                </div>
              </div>

              <div class="flex gap-4 pt-4">
                <button type="button" (click)="closeModal()" class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                <button 
                  type="submit" 
                  [disabled]="itemForm.invalid"
                  class="flex-[2] bg-slate-900 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/10"
                >
                  {{editingId ? 'Save Changes' : 'Create Item'}}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class InventoryPage implements OnInit {
  private inventoryService = inject(InventoryService);
  private fb = inject(FormBuilder);

  items = signal<InventoryItem[]>([]);
  filterCategory = signal<'all' | InventoryCategory>('all');
  showAddModal = signal(false);
  editingId: string | null = null;

  filteredItems = computed(() => {
    const list = this.items();
    const filter = this.filterCategory();
    if (filter === 'all') return list;
    return list.filter(item => item.category === filter);
  });

  itemForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['service' as InventoryCategory, Validators.required],
    description: [''],
    stock: [0, [Validators.min(0)]],
    isTaxable: [true]
  });

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.inventoryService.getItems().subscribe(data => this.items.set(data));
  }

  editItem(item: InventoryItem) {
    this.editingId = item.id;
    this.itemForm.patchValue({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      stock: item.stock || 0,
      isTaxable: item.isTaxable !== false
    });
    this.showAddModal.set(true);
  }

  deleteItem(id: string) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.inventoryService.deleteItem(id).subscribe(() => this.loadItems());
    }
  }

  closeModal() {
    this.showAddModal.set(false);
    this.editingId = null;
    this.itemForm.reset({ category: 'service', price: 0, stock: 0, isTaxable: true });
  }

  onSubmit() {
    if (this.itemForm.invalid) return;

    const data = this.itemForm.value as Partial<InventoryItem>;
    if (this.editingId) {
      this.inventoryService.updateItem(this.editingId, data).subscribe(() => {
        this.loadItems();
        this.closeModal();
      });
    } else {
      this.inventoryService.createItem(data).subscribe(() => {
        this.loadItems();
        this.closeModal();
      });
    }
  }
}
