import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HashtagTextComponent } from './hashtag-text.component';

describe('HashtagTextComponent', () => {
  let component: HashtagTextComponent;
  let fixture: ComponentFixture<HashtagTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HashtagTextComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HashtagTextComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
