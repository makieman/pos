import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { EmployeeService, ClockService } from '../services/api.services';
import { AuthService } from '../context/auth.state';
import { Employee, ClockLog } from '../models/types';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Employees &amp; Attendance</h1>
          <p class="text-sm text-slate-500 mt-1">Manage staff roles, commission plans, and clock-in/out records.</p>
        </div>
        @if (authService.user()?.role === 'admin') {
          <button
            (click)="openCreateForm()"
            [class]="showForm() && !editingId ? 'bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold' : 'bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/10 transition-all active:scale-95'"
          >
            {{ showForm() && !editingId ? 'Close Form' : 'Add Employee' }}
          </button>
        }
      </header>

      <!-- Clock-In / Clock-Out Control Card -->
      <div class="card-sleek p-6 bg-slate-900 text-white overflow-hidden relative">
        <div class="absolute -right-10 -bottom-10 opacity-5 text-indigo-400">
          <mat-icon class="text-[120px] w-auto h-auto">schedule</mat-icon>
        </div>
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <mat-icon>{{ isClockedIn() ? 'alarm_on' : 'alarm_off' }}</mat-icon>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Status</p>
              <h2 class="text-lg font-bold">
                {{ authService.user()?.name }} —
                <span [class]="isClockedIn() ? 'text-emerald-400' : 'text-amber-400'">
                  {{ isClockedIn() ? 'Clocked In' : 'Clocked Out' }}
                </span>
              </h2>
              @if (currentClockLog()?.clockIn) {
                <p class="text-xs text-slate-400 mt-0.5">
                  Shift started at {{ currentClockLog()?.clockIn | date:'shortTime' }}
                </p>
              }
            </div>
          </div>
          <div class="flex gap-3">
            <button
              (click)="clockIn()"
              [disabled]="isClockedIn()"
              class="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              [class]="isClockedIn() ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'"
            >
              Clock In
            </button>
            <button
              (click)="clockOut()"
              [disabled]="!isClockedIn()"
              class="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              [class]="!isClockedIn() ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'"
            >
              Clock Out
            </button>
          </div>
        </div>
      </div>

      <!-- Create / Edit Form (admin only) -->
      @if (showForm() && authService.user()?.role === 'admin') {
        <div class="card-sleek p-8 bg-white max-w-2xl animate-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <mat-icon class="text-indigo-500">{{ editingId ? 'edit' : 'person_add' }}</mat-icon>
            {{ editingId ? 'Edit Employee' : 'Create New Employee' }}
          </h2>
          <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-1">
              <label for="emp-name" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
              <input id="emp-name" type="text" formControlName="name" placeholder="John Doe"
                class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div class="md:col-span-1">
              <label for="emp-email" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <input id="emp-email" type="email" formControlName="email" placeholder="john@pospro.com"
                class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            @if (!editingId) {
              <div class="md:col-span-1">
                <label for="emp-password" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Initial Password</label>
                <input id="emp-password" type="password" formControlName="password" placeholder="••••••••"
                  class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            }
            <div class="md:col-span-1">
              <label for="emp-role" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Access Role</label>
              <select id="emp-role" formControlName="role"
                class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="accountant">Accountant</option>
                <option value="supervisor">Supervisor</option>
                <option value="waiter">Waiter</option>
              </select>
            </div>
            <div class="md:col-span-1 grid grid-cols-2 gap-4">
              <div>
                <label for="emp-commType" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Commission Type</label>
                <select id="emp-commType" formControlName="commissionType"
                  class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (KSh)</option>
                </select>
              </div>
              <div>
                <label for="emp-commVal" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Value</label>
                <input id="emp-commVal" type="number" formControlName="commissionValue" placeholder="10"
                  class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>

            <div class="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" (click)="cancelForm()"
                class="px-6 py-2.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button type="submit" [disabled]="employeeForm.invalid || loadingForm()"
                class="bg-slate-900 text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 disabled:opacity-50">
                {{ editingId ? 'Save Changes' : 'Create Account' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Employee Table -->
      <div class="card-sleek overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission Plan</th>
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance</th>
              @if (authService.user()?.role === 'admin') {
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (emp of employees(); track emp.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
                      {{emp.name.charAt(0)}}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-slate-700">{{emp.name}}</p>
                      <p class="text-[11px] text-slate-400">{{emp.email}}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    {{emp.role}}
                  </span>
                </td>
                <td class="px-6 py-4">
                  @if (emp.commissionType) {
                    <div class="flex items-center text-sm text-slate-600">
                      {{emp.commissionValue}}{{emp.commissionType === 'percentage' ? '%' : ' KSh'}}
                    </div>
                  } @else {
                    <span class="text-slate-400 italic text-xs">No plan</span>
                  }
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 text-xs">
                    <span [class]="getEmployeeClockStatus(emp.id) ? 'bg-emerald-500' : 'bg-slate-300'" class="w-2 h-2 rounded-full"></span>
                    <span [class]="getEmployeeClockStatus(emp.id) ? 'text-emerald-600 font-semibold' : 'text-slate-400'">
                      {{ getEmployeeClockStatus(emp.id) ? 'Active' : 'Offline' }}
                    </span>
                  </span>
                </td>
                @if (authService.user()?.role === 'admin') {
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        (click)="openEditForm(emp)"
                        id="edit-emp-{{emp.id}}"
                        class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit employee"
                      >
                        <mat-icon class="text-sm">edit</mat-icon>
                      </button>
                      <button
                        (click)="deleteEmployee(emp)"
                        id="delete-emp-{{emp.id}}"
                        class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete employee"
                      >
                        <mat-icon class="text-sm">delete_outline</mat-icon>
                      </button>
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-16 text-center text-slate-400">
                  <mat-icon class="text-5xl mb-3 text-slate-100">people_outline</mat-icon>
                  <p class="text-xs font-medium">No team members recorded yet.</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class EmployeesPage implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private clockService = inject(ClockService);
  authService = inject(AuthService);

  employees = signal<Employee[]>([]);
  loading = signal(true);
  showForm = signal(false);
  loadingForm = signal(false);
  editingId: string | null = null;

  // Attendance stats for logged-in user
  isClockedIn = signal<boolean>(false);
  currentClockLog = signal<ClockLog | null>(null);
  allClockLogs = signal<ClockLog[]>([]);

  employeeForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['waiter', Validators.required],
    commissionType: ['percentage', Validators.required],
    commissionValue: [10, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.loadEmployees();
    this.loadClockStatus();
    this.loadAllClockLogs();
  }

  loadEmployees() {
    this.loading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadClockStatus() {
    this.clockService.getClockStatus().subscribe({
      next: (status) => {
        this.isClockedIn.set(status.isClockedIn);
        this.currentClockLog.set(status.currentLog || null);
      }
    });
  }

  loadAllClockLogs() {
    this.clockService.getAllClockLogs().subscribe({
      next: (logs) => { this.allClockLogs.set(logs); }
    });
  }

  clockIn() {
    this.clockService.clockIn().subscribe({
      next: () => { this.loadClockStatus(); this.loadAllClockLogs(); }
    });
  }

  clockOut() {
    this.clockService.clockOut().subscribe({
      next: () => { this.loadClockStatus(); this.loadAllClockLogs(); }
    });
  }

  getEmployeeClockStatus(empId: string): boolean {
    const log = this.allClockLogs().find(l => {
      const dbEmpId = typeof l.employee === 'string' ? l.employee : l.employee?.id;
      return dbEmpId === empId && l.status === 'in';
    });
    return !!log;
  }

  openCreateForm() {
    this.editingId = null;
    this.employeeForm.reset({ role: 'waiter', commissionType: 'percentage', commissionValue: 10 });
    // Restore password validator for create
    this.employeeForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.employeeForm.get('password')?.updateValueAndValidity();
    this.showForm.set(!this.showForm());
  }

  openEditForm(emp: Employee) {
    this.editingId = emp.id;
    // Remove password requirement when editing
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('password')?.updateValueAndValidity();
    this.employeeForm.patchValue({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      commissionType: emp.commissionType || 'percentage',
      commissionValue: emp.commissionValue ?? 10
    });
    this.showForm.set(true);
  }

  cancelForm() {
    this.editingId = null;
    this.showForm.set(false);
    this.employeeForm.reset({ role: 'waiter', commissionType: 'percentage', commissionValue: 10 });
  }

  deleteEmployee(emp: Employee) {
    if (!confirm(`Are you sure you want to delete ${emp.name}? This action cannot be undone.`)) return;
    this.employeeService.deleteEmployee(emp.id).subscribe({
      next: () => this.loadEmployees(),
      error: (err) => alert(`Failed to delete: ${err?.error?.message || 'Server error'}`)
    });
  }

  onSubmit() {
    if (this.employeeForm.invalid) return;

    this.loadingForm.set(true);
    const value = this.employeeForm.value as any;

    if (this.editingId) {
      const { password, ...updates } = value;
      this.employeeService.updateEmployee(this.editingId, updates).subscribe({
        next: () => {
          this.loadEmployees();
          this.cancelForm();
          this.loadingForm.set(false);
        },
        error: () => this.loadingForm.set(false)
      });
    } else {
      this.employeeService.createEmployee(value).subscribe({
        next: () => {
          this.loadEmployees();
          this.cancelForm();
          this.loadingForm.set(false);
        },
        error: () => this.loadingForm.set(false)
      });
    }
  }
}
