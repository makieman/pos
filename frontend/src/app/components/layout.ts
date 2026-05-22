import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar';
import { SidebarState } from '../services/sidebar.state';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, MatIconModule, CommonModule],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden relative">
      <!-- Mobile Header -->
      <header class="lg:hidden fixed top-0 inset-x-0 h-16 bg-slate-900 flex items-center px-4 z-40 border-b border-white/5">
        <button (click)="state.toggleMobile()" class="p-2 text-slate-400 hover:text-white transition-colors">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="ml-3 flex items-center gap-2">
          <div class="w-7 h-7 bg-indigo-500 rounded flex items-center justify-center">
            <span class="text-white font-bold text-xs">P</span>
          </div>
          <span class="text-white font-bold text-sm tracking-tight">POSPro</span>
        </div>
      </header>

      <!-- Mobile Overlay -->
      @if (state.isMobileOpen()) {
        <div 
          (click)="state.closeMobile()"
          (keyup.escape)="state.closeMobile()"
          tabindex="0"
          role="button"
          aria-label="Close mobile menu"
          class="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        ></div>
      }

      <app-sidebar></app-sidebar>
      
      <main class="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div class="max-w-7xl mx-auto p-4 md:p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class LayoutComponent {
  state = inject(SidebarState);
}
