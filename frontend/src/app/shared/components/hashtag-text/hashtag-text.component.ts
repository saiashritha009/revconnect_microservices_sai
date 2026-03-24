import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hashtag-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngFor="let part of parts">
      <ng-container *ngIf="part.type === 'text'">{{part.content}}</ng-container>
      <ng-container *ngIf="part.type === 'tag'">
        <a class="hashtag-link" (click)="goToTag(part.content, $event)">{{part.content}}</a>
      </ng-container>
    </ng-container>
  `,
  styles: [`
    .hashtag-link {
      color: #3b82f6;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
    }
    .hashtag-link:hover {
      text-decoration: underline;
    }
  `]
})
export class HashtagTextComponent implements OnChanges {
  @Input() text: string = '';

  parts: { type: 'text' | 'tag', content: string }[] = [];

  constructor(private router: Router) { }

  ngOnChanges() {
    this.parseText();
  }

  parseText() {
    if (!this.text) {
      this.parts = [];
      return;
    }

    // Clean internal tags like [[CTA|...]], [[PROMO|...]], [[TAGS|...]]
    let cleanText = this.text.replace(/\[\[CTA\|.*?\]\]/g, '')
      .replace(/\[\[PROMO\|.*?\]\]/g, '')
      .replace(/\[\[TAGS\|.*?\]\]/g, '')
      .replace(/\[\[PRODUCT_TAGS\|.*?\]\]/g, '')
      .trim();

    const parts = cleanText.split(/(#[a-zA-Z0-9_]+)/g);

    this.parts = parts.map(part => {
      if (part.startsWith('#') && part.length > 1) {
        return { type: 'tag' as 'tag', content: part };
      }
      return { type: 'text' as 'text', content: part };
    }).filter(p => p.content.length > 0);
  }

  goToTag(tag: string, event: Event) {
    event.stopPropagation();
    // navigate to explore with the tag
    this.router.navigate(['/explore'], { queryParams: { q: tag } });
  }
}
