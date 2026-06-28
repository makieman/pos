import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../context/auth.state';
import { SidebarState } from '../services/sidebar.state';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  template: `
    <aside 
      class="fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-slate-900 shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800/50 lg:relative lg:translate-x-0"
      [class.w-64]="!state.isCollapsed()"
      [class.w-20]="state.isCollapsed() && !state.isMobileOpen()"
      [class.-translate-x-full]="!state.isMobileOpen()"
      [class.translate-x-0]="state.isMobileOpen()"
      [class.w-72]="state.isMobileOpen()"
    >
      <!-- Logo Section -->
      <div class="p-6 flex items-center justify-between overflow-hidden">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <span class="text-white font-bold text-sm">P</span>
          </div>
          @if (!state.isCollapsed() || state.isMobileOpen()) {
            <span class="text-white font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 grow">
              <span class="text-indigo-400">POS</span>
            </span>
          }
        </div>
        @if (state.isMobileOpen()) {
          <button (click)="state.closeMobile()" class="lg:hidden text-slate-400 hover:text-white">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      <!-- Toggle Button (Desktop Only) -->
      <button 
        (click)="state.toggle()"
        class="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-50 shadow-md"
      >
        <mat-icon class="text-sm scale-75">{{ state.isCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
      </button>
      
      <!-- Navigation -->
      <nav class="flex-1 px-3 mt-4 space-y-1 overflow-y-auto no-scrollbar">
        @for (item of filteredMenuItems(); track item.label) {
          <div>
            @if (item.subItems) {
              <!-- Dropdown Trigger -->
              <button
                (click)="state.toggleMenu(item.label)"
                class="w-full flex items-center justify-between px-3.5 py-3 text-slate-400 transition-all rounded-xl text-sm hover:bg-slate-800/50 hover:text-white group relative"
                [class.bg-slate-800/30]="state.expandedMenus()[item.label]"
              >
                <div class="flex items-center gap-3">
                  <mat-icon class="text-[20px] shrink-0 group-hover:text-indigo-400 transition-colors">{{item.icon}}</mat-icon>
                  @if (!state.isCollapsed() || state.isMobileOpen()) {
                    <span class="font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2">{{item.label}}</span>
                  }
                </div>
                @if (!state.isCollapsed() || state.isMobileOpen()) {
                  <mat-icon class="text-xs transition-transform duration-200" [class.rotate-180]="state.expandedMenus()[item.label]">expand_more</mat-icon>
                }
              </button>

              <!-- Sub Items -->
              @if (state.expandedMenus()[item.label] && (!state.isCollapsed() || state.isMobileOpen())) {
                <div class="mt-1 ml-4 border-l border-slate-800 pl-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  @for (sub of item.subItems; track sub.label) {
                    <a
                      [routerLink]="sub.path"
                      routerLinkActive="text-indigo-400 font-bold bg-indigo-50/5"
                      (click)="state.closeMobile()"
                      class="flex items-center gap-3 px-3.5 py-2.5 text-slate-500 transition-all rounded-lg text-[13px] hover:text-white hover:bg-slate-800/30"
                    >
                      {{sub.label}}
                    </a>
                  }
                </div>
              }
            } @else {
              <!-- Standard Link -->
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/10"
                [routerLinkActiveOptions]="{exact: item.path === '/dashboard'}"
                (click)="state.closeMobile()"
                class="flex items-center gap-3 px-3.5 py-3 text-slate-400 transition-all rounded-xl text-sm hover:bg-slate-800/50 hover:text-white group relative"
                [title]="state.isCollapsed() ? item.label : ''"
              >
                <mat-icon class="text-[20px] shrink-0 group-hover:text-indigo-400 transition-colors">{{item.icon}}</mat-icon>
                @if (!state.isCollapsed() || state.isMobileOpen()) {
                  <span class="font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 overflow-hidden">{{item.label}}</span>
                }
              </a>
            }
          </div>
        }
      </nav>

      <!-- User Profile / Bottom Actions -->
      <div class="p-4 border-t border-slate-800/50">
        <div class="flex items-center gap-3 p-2 bg-slate-800/40 rounded-xl mb-2 group overflow-hidden transition-all h-14">
          <div class="w-8 h-8 md:w-9 md:h-9 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-500/30">
            {{authService.user()?.name?.charAt(0)}}
          </div>
          
          @if (!state.isCollapsed() || state.isMobileOpen()) {
            <div class="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 grow">
              <p class="text-[11px] text-white font-semibold truncate">{{authService.user()?.name}}</p>
              <p class="text-[9px] text-slate-500 uppercase tracking-widest truncate">{{authService.user()?.role}}</p>
            </div>
            <button
              (click)="authService.logout()"
              class="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
              title="Sign Out"
            >
              <mat-icon class="text-sm">logout</mat-icon>
            </button>
          }
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  state = inject(SidebarState);

  menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      label: 'Sales',
      icon: 'point_of_sale',
      subItems: [
        { path: '/services', label: 'Cash Sale' },
        { path: '/sales-list', label: 'Sales List' },
      ]
    },
    { path: '/employees', label: 'Employees', icon: 'people' },
    { path: '/inventory', label: 'Inventory', icon: 'inventory_2' },
    { path: '/commissions', label: 'Commissions', icon: 'assessment' },
    { path: '/financial-report', label: 'Reports', icon: 'payments' },
    { path: '/compliance', label: 'Compliance Suite', icon: 'verified_user', demoOnly: true },
  ];

  filteredMenuItems = computed(() => {
    const user = this.authService.user();
    if (!user) return [];

    const role = user.role;

    return this.menuItems.map(item => {
      if (item.subItems) {
        const allowedSubs = item.subItems.filter(sub => {
          if (sub.path === '/services') {
            return role !== 'accountant';
          }
          return true;
        });
        if (allowedSubs.length > 0) {
          return { ...item, subItems: allowedSubs };
        }
        return null;
      }

      if (item.path === '/employees') {
        return role === 'admin' ? item : null;
      }
      if (item.path === '/inventory') {
        return ['admin', 'manager', 'cashier', 'supervisor'].includes(role) ? item : null;
      }
      if (item.path === '/commissions' || item.path === '/financial-report') {
        return ['admin', 'manager', 'accountant'].includes(role) ? item : null;
      }

    }).filter(item => {
      if (!item) return false;
      if ((item as any).demoOnly) {
        const email = user.email;
        return email === 'admin@salon.com'; // only demo admin sees this
      }
      return true;
    }) as any[];
  });
}
