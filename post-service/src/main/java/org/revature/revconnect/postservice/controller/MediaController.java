package org.revature.revconnect.postservice.controller;

import org.revature.revconnect.postservice.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.postservice.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Media", description = "Media Upload and Management APIs")
public class MediaController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a single file")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file) {
        log.info("Uploading file: {}", file.getOriginalFilename());
        String url = fileStorageService.storeFile(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded", Map.of("url", url)));
    }

    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload multiple files")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> uploadMultipleFiles(
            @RequestParam("files") List<MultipartFile> files) {
        log.info("Uploading {} files", files.size());
        List<Map<String, String>> urls = files.stream()
                .map(file -> Map.of("url", fileStorageService.storeFile(file)))
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Files uploaded", urls));
    }

    @PostMapping(value = "/upload/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload profile picture")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfilePicture(
            @RequestParam("file") MultipartFile file) {
        log.info("Uploading profile picture");
        String url = fileStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success("Profile picture updated", Map.of("url", url)));
    }

    @PostMapping(value = "/upload/cover-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload cover photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadCoverPhoto(
            @RequestParam("file") MultipartFile file) {
        log.info("Uploading cover photo");
        String url = fileStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success("Cover photo updated", Map.of("url", url)));
    }

    @DeleteMapping("/{mediaId}")
    @Operation(summary = "Delete a media file")
    public ResponseEntity<ApiResponse<Void>> deleteMedia(@PathVariable Long mediaId) {
        log.info("Deleting media: {}", mediaId);
        return ResponseEntity.ok(ApiResponse.success("Media deleted", null));
    }

    @GetMapping("/{mediaId}")
    @Operation(summary = "Get media details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMedia(@PathVariable Long mediaId) {
        log.info("Getting media: {}", mediaId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", mediaId)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my media files")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyMedia(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Getting my media");
        return ResponseEntity.ok(ApiResponse.success(List.of()));
    }

    @PostMapping(value = "/upload/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload video")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVideo(
            @RequestParam("file") MultipartFile file) {
        log.info("Uploading video");
        String url = fileStorageService.storeFile(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Video uploaded", Map.of("url", url)));
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get("uploads").toAbsolutePath().normalize().resolve(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = "application/octet-stream";
                if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
                else if (fileName.toLowerCase().endsWith(".png")) contentType = "image/png";
                else if (fileName.toLowerCase().endsWith(".gif")) contentType = "image/gif";
                else if (fileName.toLowerCase().endsWith(".mp4")) contentType = "video/mp4";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{mediaId}/thumbnail")
    @Operation(summary = "Get media thumbnail")
    public ResponseEntity<ApiResponse<Map<String, String>>> getThumbnail(@PathVariable Long mediaId) {
        log.info("Getting thumbnail for media: {}", mediaId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", "url")));
    }

    @PostMapping("/{mediaId}/process")
    @Operation(summary = "Process media (resize, compress)")
    public ResponseEntity<ApiResponse<Map<String, String>>> processMedia(
            @PathVariable Long mediaId,
            @RequestParam(required = false) Integer width,
            @RequestParam(required = false) Integer height,
            @RequestParam(required = false) Integer quality) {
        log.info("Processing media: {}", mediaId);
        return ResponseEntity.ok(ApiResponse.success("Media processed", Map.of("url", "url")));
    }
}
