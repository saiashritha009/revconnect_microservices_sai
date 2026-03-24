import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPage implements OnInit {
  mobileMenuOpen = false;
  constructor(private router: Router) {}

  ngOnInit(): void {
    // If user is already logged in, we might want to redirect them to the feed
    const token = localStorage.getItem('revconnect_token');
    if (token) {
      // Potentially redirect to feed if already logged in, 
      // but for now let's let them see the landing page if they explicitly go to it.
    }
  }

  getStarted() {
    this.router.navigate(['/login']);
  }
}
