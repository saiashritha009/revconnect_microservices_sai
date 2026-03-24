import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPassword } from './reset-password';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ResetPassword', () => {
    let component: ResetPassword;
    let fixture: ComponentFixture<ResetPassword>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ResetPassword],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
            schemas: [NO_ERRORS_SCHEMA]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ResetPassword);
        component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
