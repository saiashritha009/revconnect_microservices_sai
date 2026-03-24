import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PostService, PostRequest, PostResponse } from './post.service';

describe('PostService', () => {
    let service: PostService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                PostService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(PostService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch public feed', () => {
        const mockResponse = {
            success: true,
            message: 'OK',
            data: { content: [], pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, last: true, first: true }
        };

        service.getPublicFeed(0, 10).subscribe(res => {
            expect(res).toEqual(mockResponse);
        });

        const req = httpTestingController.expectOne(request => request.url === '/api/posts/feed' && request.params.get('page') === '0' && request.params.get('size') === '10');
        expect(req.request.method).toEqual('GET');
        req.flush(mockResponse);
    });

    it('should create a new post', () => {
        const mockData = { id: 1, content: 'Test post', authorId: 1 } as PostResponse;
        const mockResp = { success: true, message: 'Created', data: mockData };
        const reqData: PostRequest = { content: 'Test post', postType: 'TEXT' };

        service.createPost(reqData).subscribe(res => {
            expect(res.data).toEqual(mockData);
        });

        const req = httpTestingController.expectOne('/api/posts');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual(reqData);
        req.flush(mockResp);
    });
});
