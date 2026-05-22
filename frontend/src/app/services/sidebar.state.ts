import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarState {
  isCollapsed = signal(false);
  isMobileOpen = signal(false);
  expandedMenus = signal<Record<string, boolean>>({
    'Sales': true // Default open for visibility
  });

  toggle() {
    this.isCollapsed.update(v => !v);
  }

  toggleMenu(label: string) {
    this.expandedMenus.update(menus => ({
      ...menus,
      [label]: !menus[label]
    }));
  }

  toggleMobile() {
    this.isMobileOpen.update(v => !v);
  }

  closeMobile() {
    this.isMobileOpen.set(false);
  }
}
