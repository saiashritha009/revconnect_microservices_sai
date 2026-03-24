import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../core/components/navbar/navbar';
import { Sidebar } from '../../../core/components/sidebar/sidebar';
import { AnalyticsService, AnalyticsOverview, PostPerformance, FollowerGrowth } from '../../../core/services/analytics.service';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, Sidebar, RouterModule],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.css',
})
export class AnalyticsDashboard implements OnInit, OnDestroy {
  private sessionInterval: any;
  currentUser: UserResponse | null = null;
  overview: AnalyticsOverview | null = null;
  topPosts: any[] = [];
  postPerformance: PostPerformance[] = [];
  followerGrowth: FollowerGrowth[] = [];
  engagement: any = null;


  // News items for discovery
  allNews = [
    {
      category: 'Sports',
      title: 'Championship Finals Set',
      description: 'Anticipation builds globally as the underdog team secures their spot in the ultimate showdown.',
      imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2605&auto=format&fit=crop'
    },
    {
      category: 'Cinema',
      title: 'Blockbuster Success',
      description: 'The highly anticipated sequel shatters box office records on its opening weekend worldwide.',
      imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2670&auto=format&fit=crop'
    },
    {
      category: 'Finance',
      title: 'Market Updates',
      description: 'Global markets see an unexpected surge following new international trade agreements.',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2670&auto=format&fit=crop'
    },
    {
      category: 'Technology',
      title: 'AI Breaktrough',
      description: 'Researchers unveil a new AI model capable of reasoning through complex quantum physics problems.',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop'
    },
    {
      category: 'Gaming',
      title: 'E3 Highlights',
      description: 'Next-generation consoles and highly anticipated titles steal the show at this year\'s convention.',
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop'
    },
    {
      category: 'Music',
      title: 'Summer Festivals',
      description: 'Millions gather across the globe to celebrate live music\'s massive resurgence this season.',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2670&auto=format&fit=crop'
    },
    {
      category: 'Politics',
      title: 'Global Summit',
      description: 'World leaders convene to discuss urgent climate action and international trade policies.',
      imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=2670&auto=format&fit=crop'
    },
    {
      category: 'Health',
      title: 'Wellness Revolution',
      description: 'New research reveals how daily micro-habits can dramatically improve mental and physical health outcomes.',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop'
    },
    {
      category: 'Travel',
      title: 'Hidden Destinations',
      description: 'Travelers discover untouched paradises as remote island tourism sees unprecedented growth this year.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2670&auto=format&fit=crop'
    },
    {
      category: 'Science',
      title: 'Mars Mission Update',
      description: 'Space agencies announce major breakthrough in sustainable fuel technology for deep space exploration.',
      imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2672&auto=format&fit=crop'
    },
    {
      category: 'Food',
      title: 'Culinary Trends 2026',
      description: 'Plant-based innovation continues to reshape global cuisine as chefs embrace sustainable ingredients.',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2670&auto=format&fit=crop'
    }
  ];
  randomNews: any[] = [];

  isLoading = true;
  activePeriod = 30; // 7, 30, 90 days
  loginTime: Date = new Date();
  sessionDurationText: string = '0s ago';

  constructor(
    private analyticsService: AnalyticsService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success) this.currentUser = res.data;
        this.randomizeNews();
        this.loadData();
      }
    });
    // Update session timer every second
    this.sessionInterval = setInterval(() => {
      this.sessionDurationText = this.calcSessionDuration();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.sessionInterval) clearInterval(this.sessionInterval);
  }

  randomizeNews(): void {
    // Shuffle the array and pick the first 3
    const shuffled = [...this.allNews].sort(() => 0.5 - Math.random());
    this.randomNews = shuffled.slice(0, 3);
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const emptyRes = { success: false, message: '', data: null };
    forkJoin({
      overview: this.analyticsService.getOverview().pipe(catchError(() => of(emptyRes as any))),
      topPosts: this.analyticsService.getTopPosts(5).pipe(catchError(() => of(emptyRes as any))),
      performance: this.analyticsService.getPostPerformance(this.activePeriod).pipe(catchError(() => of(emptyRes as any))),
      growth: this.analyticsService.getFollowerGrowth(this.activePeriod).pipe(catchError(() => of(emptyRes as any))),
      engagement: this.analyticsService.getEngagement(this.activePeriod).pipe(catchError(() => of(emptyRes as any))),
      demographics: this.analyticsService.getAudienceDemographics().pipe(catchError(() => of(emptyRes as any)))
    }).subscribe({
      next: (results) => {
        if (results.overview?.success && results.overview.data) {
          const o = results.overview.data;
          this.overview = {
            totalViews: o.totalViews ?? 0, totalLikes: o.totalLikes ?? 0,
            totalComments: o.totalComments ?? 0, totalShares: o.totalShares ?? 0,
            totalFollowers: o.totalFollowers ?? 0, totalPosts: o.totalPosts ?? 0
          };
        } else {
          this.overview = { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalFollowers: 0, totalPosts: 0 };
        }
        if (results.topPosts?.success && results.topPosts.data) this.topPosts = results.topPosts.data;
        if (results.performance?.success && results.performance.data) this.postPerformance = results.performance.data;
        if (results.growth?.success && results.growth.data) this.followerGrowth = results.growth.data;
        if (results.engagement?.success && results.engagement.data) this.engagement = results.engagement.data;
        else this.engagement = { engagementRate: 0, totalInteractions: 0 };
        if (results.demographics?.data) {
          const d = results.demographics.data;
          this.audienceDemographics = {
            personal: d.personal ?? 0,
            creator: d.creator ?? 0,
            business: d.business ?? 0,
            totalFollowers: d.totalFollowers ?? 0,
            totalAudience: d.totalAudience ?? 0
          };
        } else {
          this.audienceDemographics = { personal: 0, creator: 0, business: 0, totalFollowers: 0, totalAudience: 0 };
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.overview = { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalFollowers: 0, totalPosts: 0 };
        this.engagement = { engagementRate: 0, totalInteractions: 0 };
        this.audienceDemographics = { personal: 0, creator: 0, business: 0, totalFollowers: 0, totalAudience: 0 };
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  audienceDemographics: any = null;

  setPeriod(days: number): void {
    this.activePeriod = days;
    this.loadData();
  }

  // Helper for mock visualization (bar height calculation)
  getBarHeight(value: number, max: number): string {
    if (max === 0) return '0%';
    return (value / max * 100) + '%';
  }

  getMaxGrowthValue(): number {
    if (!this.followerGrowth || this.followerGrowth.length === 0) return 0;
    return Math.max(...this.followerGrowth.map(g => g.followers));
  }

  getSessionDuration(): string {
    return this.sessionDurationText;
  }

  private calcSessionDuration(): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.loginTime.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m ago`;
  }

  getLoginTime(): string {
    return this.loginTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) +
      ', ' + this.loginTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  getAvgEngagement(): string {
    if (!this.overview || this.overview.totalPosts === 0) return '0';
    const avg = (this.overview.totalLikes + this.overview.totalComments + this.overview.totalShares) / this.overview.totalPosts;
    return avg.toFixed(1);
  }

  getBestPostTime(): string {
    const hours = [
      { range: '6 AM - 9 AM', score: 0.6 },
      { range: '9 AM - 12 PM', score: 0.75 },
      { range: '12 PM - 3 PM', score: 0.8 },
      { range: '3 PM - 6 PM', score: 0.85 },
      { range: '6 PM - 9 PM', score: 0.95 },
      { range: '9 PM - 12 AM', score: 0.7 }
    ];
    if (this.overview && this.overview.totalLikes > 10) {
      return '6 PM - 9 PM (Peak)';
    }
    return '6 PM - 9 PM';
  }

  exportCsv(): void {
    if (!this.postPerformance || this.postPerformance.length === 0) return;
    const headers = ['Content', 'Views', 'Likes', 'Comments', 'Shares', 'Engagement %'];
    const rows = this.postPerformance.map(p => {
      const eng = (((p.likes || 0) + (p.comments || 0)) / ((p.views || 0) || 1) * 100).toFixed(1);
      return [
        '"' + (this.getCleanContent(p.content) || '').replace(/"/g, '""') + '"',
        p.views || 0,
        p.likes || 0,
        p.comments || 0,
        p.shares || 0,
        eng + '%'
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content_performance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getCleanContent(content: string): string {
    if (!content) return 'Media Post';
    let clean = content.replace(/\[\[CTA\|.*?\|.*?\]\]/g, '')
      .replace(/\[\[PROMO\|.*?\]\]/g, '')
      .replace(/\[\[TAGS\|.*?\]\]/g, '')
      .trim();
    if (!clean) return 'Media Post';
    // Trim length if it's too long
    if (clean.length > 50) return clean.substring(0, 50) + '...';
    return clean;
  }
}
