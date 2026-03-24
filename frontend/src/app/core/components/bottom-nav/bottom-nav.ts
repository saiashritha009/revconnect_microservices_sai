import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/feed" routerLinkActive="active" class="nav-item">
        <i class="fa-solid fa-house"></i>
        <span>Home</span>
      </a>
      <a routerLink="/explore" routerLinkActive="active" class="nav-item">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>Explore</span>
      </a>
      <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
        <i class="fa-solid fa-bell"></i>
        <span>Alerts</span>
      </a>
      <a routerLink="/messages" routerLinkActive="active" class="nav-item">
        <i class="fa-solid fa-envelope"></i>
        <span>Chats</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active" class="nav-item">
        <i class="fa-solid fa-user"></i>
        <span>Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 56px;
      background: var(--bg-glass-heavy);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border-color);
      display: none;
      justify-content: space-around;
      align-items: center;
      z-index: 3000;
      padding-bottom: env(safe-area-inset-bottom);
      box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.7rem;
      font-weight: 700;
      transition: var(--transition-fast);
      flex: 1;
      padding: 8px 0;

      i { font-size: 1.1rem; }
      
      &.active {
        color: var(--accent-primary);
        transform: translateY(-2px);
      }
    }

    @media (max-width: 820px) {
      .bottom-nav {
        display: flex;
      }
    }
  `]
})
export class BottomNav {
  constructor(private router: Router) { }
}
