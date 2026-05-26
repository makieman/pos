import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from './base';
import { DashboardSummary, Employee, ServiceRecord, Expense, InventoryItem, Shift, ClockLog } from '../models/types';

@Injectable({ providedIn: 'root' })
export class DashboardService extends BaseApiService {
  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/dashboard`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}

@Injectable({ providedIn: 'root' })
export class EmployeeService extends BaseApiService {
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/users`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createEmployee(employeeData: Partial<Employee> & { password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, employeeData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateEmployee(id: string, updates: Partial<Employee>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, updates, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}

@Injectable({ providedIn: 'root' })
export class ServiceRecordService extends BaseApiService {
  createService(serviceData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/services`, serviceData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getRecentSales(): Observable<ServiceRecord[]> {
    return this.http.get<ServiceRecord[]>(`${this.baseUrl}/services`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  refundService(id: string, refundReason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/services/${id}/refund`, { refundReason }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  voidService(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/services/${id}/void`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}

@Injectable({ providedIn: 'root' })
export class ExpenseService extends BaseApiService {
  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/expenses`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/expenses`, expenseData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}

@Injectable({ providedIn: 'root' })
export class InventoryService extends BaseApiService {
  getItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.baseUrl}/inventory`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createItem(item: Partial<InventoryItem>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/inventory`, item, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateItem(id: string, updates: Partial<InventoryItem>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/inventory/${id}`, updates, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteItem(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/inventory/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}

@Injectable({ providedIn: 'root' })
export class ShiftService extends BaseApiService {
  getCurrentShift(): Observable<{ active: boolean; shift?: Shift }> {
    return this.http.get<any>(`${this.baseUrl}/shifts/current`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  openShift(openingFloat: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/shifts/open`, { openingFloat }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  closeShift(closingCash: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/shifts/close`, { closingCash }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getZReport(id: string): Observable<{ shift: Shift; transactions: ServiceRecord[] }> {
    return this.http.get<any>(`${this.baseUrl}/shifts/${id}/z-report`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getDailyRollup(): Observable<{ shifts: Shift[]; rollup: any }> {
    return this.http.get<any>(`${this.baseUrl}/shifts/rollup`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}

@Injectable({ providedIn: 'root' })
export class ClockService extends BaseApiService {
  getClockStatus(): Observable<{ isClockedIn: boolean; currentLog?: ClockLog; logs: ClockLog[] }> {
    return this.http.get<any>(`${this.baseUrl}/clock/status`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  clockIn(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/clock/in`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  clockOut(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/clock/out`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAllClockLogs(): Observable<ClockLog[]> {
    return this.http.get<ClockLog[]>(`${this.baseUrl}/clock/all`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}
