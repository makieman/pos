import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { EmployeesPage } from './pages/employees';
import { ServicesPage } from './pages/services';
import { SalesListPage } from './pages/sales-list';
import { InventoryPage } from './pages/inventory';
import { CommissionsPage } from './pages/commissions';
import { FinancialReportPage } from './pages/financial-report';
import { CompliancePage } from './pages/compliance';
import { LayoutComponent } from './components/layout';

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPage },
      { 
        path: 'employees', 
        component: EmployeesPage, 
        data: { roles: ['admin'] } 
      },
      { 
        path: 'sales-list', 
        component: SalesListPage 
      },
      { 
        path: 'services', 
        component: ServicesPage, 
        data: { roles: ['admin', 'manager', 'cashier', 'supervisor', 'waiter'] } 
      },
      { 
        path: 'inventory', 
        component: InventoryPage, 
        data: { roles: ['admin', 'manager', 'cashier', 'supervisor'] } 
      },
      { 
        path: 'commissions', 
        component: CommissionsPage, 
        data: { roles: ['admin', 'manager', 'accountant'] } 
      },
      { 
        path: 'financial-report', 
        component: FinancialReportPage, 
        data: { roles: ['admin', 'manager', 'accountant'] } 
      },
      { 
        path: 'compliance', 
        component: CompliancePage 
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
