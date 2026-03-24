import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
  standalone: true
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

  transform(content: string): SafeHtml {
    if (!content) return '';
    // Strip CTA, PROMO, and PRODUCT_TAGS markup tags
    let cleaned = content
      .replace(/\[\[CTA\|[^\]]*\]\]/g, '')
      .replace(/\[\[PROMO\|[^\]]*\]\]/g, '')
      .replace(/\[\[PRODUCT_TAGS\|[^\]]*\]\]/g, '')
      .trim();
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const html = cleaned.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="msg-link">${url}</a>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
