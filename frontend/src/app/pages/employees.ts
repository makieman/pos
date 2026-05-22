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
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">Employees & Attendance</h1>
          <p class="text-sm text-slate-500 mt-1">Manage staff roles, commission plans, and clock-in/out records.</p>
        </div>
        <button 
          (click)="showAddForm.set(!showAddForm())"
          [class]="showAddForm() ? 'bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold' : 'bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/10 transition-all active:scale-95'"
        >
          {{showAddForm() ? 'Close Form' : 'Add Employee'}}
        </button>
      </header>

      <!-- Clock-In / Clock-Out Control Card for the Active User -->
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

      @if (showAddForm()) {
        <div class="card-sleek p-8 bg-white max-w-2xl animate-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <mat-icon class="text-indigo-500">person_add</mat-icon>
            Create New Employee
          </h2>
          <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-1">
              <label for="name" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
              <input id="name" type="text" formControlName="name" placeholder="John Doe" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div class="md:col-span-1">
              <label for="email" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <input id="email" type="email" formControlName="email" placeholder="john@pospro.com" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div class="md:col-span-1">
              <label for="password" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Initial Password</label>
              <input id="password" type="password" formControlName="password" placeholder="••••••••" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div class="md:col-span-1">
              <label for="role" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Access Role</label>
              <select id="role" formControlName="role" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
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
                <label for="commissionType" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Commission Type</label>
                <select id="commissionType" formControlName="commissionType" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (KSh)</option>
                </select>
              </div>
              <div>
                <label for="commissionValue" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Value</label>
                <input id="commissionValue" type="number" formControlName="commissionValue" placeholder="10" class="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>
            
            <div class="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="submit" [disabled]="employeeForm.invalid || loadingForm()" class="bg-slate-900 text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                Create Account
              </button>
            </div>
          </form>
        </div>
      }

      <div class="card-sleek overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission Plan</th>
              <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance</th>
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
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-6 py-16 text-center text-slate-400">
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
  showAddForm = signal(false);
  loadingForm = signal(false);

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
      next: (logs) => {
        this.allClockLogs.set(logs);
      }
    });
  }

  clockIn() {
    this.clockService.clockIn().subscribe({
      next: () => {
        this.loadClockStatus();
        this.loadAllClockLogs();
      }
    });
  }

  clockOut() {
    this.clockService.clockOut().subscribe({
      next: () => {
        this.loadClockStatus();
        this.loadAllClockLogs();
      }
    });
  }

  getEmployeeClockStatus(empId: string): boolean {
    // Find if the employee has any active clock log in the all logs list
    const log = this.allClockLogs().find(l => {
      const dbEmpId = typeof l.employee === 'string' ? l.employee : l.employee?.id;
      return dbEmpId === empId && l.status === 'in';
    });
    return !!log;
  }

  onSubmit() {
    if (this.employeeForm.invalid) return;

    this.loadingForm.set(true);
    this.employeeService.createEmployee(this.employeeForm.value as any).subscribe({
      next: () => {
        this.loadEmployees();
        this.employeeForm.reset({ role: 'waiter', commissionType: 'percentage', commissionValue: 10 });
        this.showAddForm.set(false);
        this.loadingForm.set(false);
      },
      error: () => this.loadingForm.set(false)
    });
  }
}
