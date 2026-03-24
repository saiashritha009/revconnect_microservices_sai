import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../../../core/components/navbar/navbar';
import { Sidebar } from '../../../core/components/sidebar/sidebar';
import { MessageService, ConversationPartner, MessageItem } from '../../../core/services/message.service';
import { UserService } from '../../../core/services/user.service';
import { MediaService } from '../../../core/services/media.service';
import { LinkifyPipe } from '../../../shared/pipes/linkify-pipe';

/**
 * HOW MESSAGES WORK (connected to backend MessageController):
 *
 * Backend uses the OTHER USER's ID as the "conversationId":
 *   - GET  /api/messages/conversations          → list of users you've chatted with
 *   - POST /api/messages/conversations?recipientId=X  → start/open a conversation
 *   - GET  /api/messages/conversations/{userId}  → fetch messages with that user
 *   - POST /api/messages/conversations/{userId}?content=X  → send a message to that user
 *   - POST /api/messages/conversations/{userId}/read  → mark all messages as read
 *   - GET  /api/messages/unread/count            → total unread message count
 *
 * So "conversationId" = the OTHER user's userId throughout.
 */
@Component({
    selector: 'app-messages-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, Navbar, Sidebar, LinkifyPipe],
    templateUrl: './messages-page.html',
    styleUrls: ['./messages-page.css']
})
export class MessagesPage implements OnInit, OnDestroy {
    @ViewChild('messagesEnd') messagesEnd?: ElementRef;

    conversations: ConversationPartner[] = [];
    selectedConversation: ConversationPartner | null = null;
    messages: MessageItem[] = [];
    newMessage = '';

    isLoadingConversations = false;
    isLoadingMessages = false;
    isSending = false;

    currentUserId: number = 0;

    // Emoji picker
    showEmojiPicker = false;
    commonEmojis = ['😀','😂','😍','🥰','😎','🤔','👍','❤️','🔥','🎉','👏','💯','🙌','😢','😮','🤝','✨','💪','🙏','👋'];

    // Photo upload
    isUploadingPhoto = false;
    photoPreviewUrl: string | null = null;
    pendingMediaUrl: string | null = null;

    // Context menu (right-click)
    contextMenuVisible = false;
    contextMenuX = 0;
    contextMenuY = 0;
    contextMenuMessage: MessageItem | null = null;

    // Edit mode
    editingMessageId: number | null = null;
    editingContent = '';

    constructor(
        private messageService: MessageService,
        private userService: UserService,
        private mediaService: MediaService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    @HostListener('document:click')
    onDocumentClick() {
        if (this.contextMenuVisible) {
            this.contextMenuVisible = false;
            this.cdr.detectChanges();
        }
    }

    ngOnInit() {
        this.loadCurrentUser();

        // If navigated from profile page with a userId, open that conversation
        this.route.queryParams.subscribe(params => {
            const userId = params['userId'];
            if (userId) {
                const partnerId = +userId;
                // First create/open the conversation with this user
                this.messageService.createConversation(partnerId).subscribe({
                    next: (res) => {
                        if (res.success && res.data) {
                            // Backend returns { recipientId } - need to fetch full user profile
                            this.userService.getUserById(partnerId).subscribe({
                                next: (userRes) => {
                                    if (userRes.success && userRes.data) {
                                        const partner: ConversationPartner = {
                                            userId: userRes.data.id,
                                            username: userRes.data.username,
                                            name: userRes.data.name,
                                            profilePicture: userRes.data.profilePicture || ''
                                        };
                                        this.selectConversation(partner);
                                    }
                                    this.loadConversations();
                                },
                                error: () => this.loadConversationsAndSelect(partnerId)
                            });
                        } else {
                            this.loadConversationsAndSelect(partnerId);
                        }
                    },
                    error: () => {
                        this.loadConversationsAndSelect(partnerId);
                    }
                });
            } else {
                this.loadConversations();
            }
        });
    }

    ngOnDestroy() { }

    loadCurrentUser() {
        this.userService.getMyProfile().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.currentUserId = res.data.id;
                    this.cdr.markForCheck();
                }
            }
        });
    }

    loadConversations() {
        this.isLoadingConversations = true;
        this.cdr.markForCheck();

        // GET /api/messages/conversations
        this.messageService.getConversations().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    // Sort by lastMessageTime descending (newest first)
                    this.conversations = res.data.sort((a: any, b: any) => {
                        const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                        const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                        return tb - ta;
                    });
                    // Enrich conversations missing user data (Feign enrichment may fail)
                    this.conversations.forEach(conv => {
                        if (!conv.name || !conv.username) {
                            this.userService.getUserById(conv.userId).subscribe({
                                next: (userRes) => {
                                    if (userRes.success && userRes.data) {
                                        conv.name = userRes.data.name;
                                        conv.username = userRes.data.username;
                                        conv.profilePicture = userRes.data.profilePicture || '';
                                        this.cdr.markForCheck();
                                    }
                                }
                            });
                        }
                    });
                }
                this.isLoadingConversations = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoadingConversations = false;
                this.cdr.markForCheck();
            }
        });
    }

    loadConversationsAndSelect(partnerId: number) {
        this.messageService.getConversations().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.conversations = res.data;
                    // Auto-select the conversation with this partner
                    const partner = this.conversations.find(c => Number(c.userId) === partnerId);
                    if (partner) {
                        this.selectConversation(partner);
                    } else {
                        // Partner not in list yet - load their profile and add
                        this.userService.getUserById(partnerId).subscribe({
                            next: (userRes) => {
                                if (userRes.success && userRes.data) {
                                    const newPartner: ConversationPartner = {
                                        userId: userRes.data.id,
                                        username: userRes.data.username,
                                        name: userRes.data.name,
                                        profilePicture: userRes.data.profilePicture || ''
                                    };
                                    // Make sure we don't accidentally add duplicates if it somehow resolved in the meantime
                                    if (!this.conversations.some(c => Number(c.userId) === partnerId)) {
                                        this.conversations.unshift(newPartner);
                                    }
                                    this.selectConversation(newPartner);
                                    this.cdr.markForCheck();
                                }
                            }
                        });
                    }
                }
                this.cdr.markForCheck();
            }
        });
    }

    selectConversation(partner: ConversationPartner) {
        this.selectedConversation = partner;
        this.messages = [];
        this.loadMessages(partner.userId);
        // Ensure the partner is in the conversations list (for sidebar highlighting)
        if (!this.conversations.some(c => Number(c.userId) === Number(partner.userId))) {
            this.conversations.unshift(partner);
        }
        // POST /api/messages/conversations/{userId}/read
        this.messageService.markConversationAsRead(partner.userId).subscribe();
        this.cdr.markForCheck();
    }

    loadMessages(conversationId: number) {
        this.isLoadingMessages = true;
        this.cdr.markForCheck();

        // GET /api/messages/conversations/{userId}?page=0&size=50
        this.messageService.getMessages(conversationId, 0, 50).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    // Backend returns newest first — reverse for chronological display
                    this.messages = [...res.data].reverse();
                }
                this.isLoadingMessages = false;
                this.cdr.markForCheck();
                setTimeout(() => this.scrollToBottom(), 100);
            },
            error: () => {
                this.isLoadingMessages = false;
                this.cdr.markForCheck();
            }
        });
    }

    sendMessage() {
        const content = this.newMessage.trim();
        const mediaUrl = this.pendingMediaUrl;
        if ((!content && !mediaUrl) || !this.selectedConversation || this.isSending) return;

        this.isSending = true;
        this.showEmojiPicker = false;
        const conversationId = this.selectedConversation.userId;
        const tempMessage = content;
        this.newMessage = '';
        this.pendingMediaUrl = null;
        this.photoPreviewUrl = null;

        // Optimistic: add message to UI immediately
        const optimisticMsg: MessageItem = {
            id: Date.now(),
            senderId: this.currentUserId,
            receiverId: conversationId,
            content: tempMessage,
            mediaUrl: mediaUrl || null,
            timestamp: new Date().toISOString(),
            isRead: false,
            isDeleted: false
        };
        this.messages.push(optimisticMsg);
        this.cdr.markForCheck();
        setTimeout(() => this.scrollToBottom(), 50);

        this.messageService.sendMessage(conversationId, tempMessage, mediaUrl || undefined).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    optimisticMsg.id = res.data.messageId;
                }
                this.isSending = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.messages = this.messages.filter(m => m.id !== optimisticMsg.id);
                this.newMessage = tempMessage;
                this.pendingMediaUrl = mediaUrl;
                this.isSending = false;
                this.cdr.markForCheck();
            }
        });
    }

    onPhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        this.isUploadingPhoto = true;
        this.cdr.markForCheck();

        this.mediaService.uploadFile(file).subscribe({
            next: (res) => {
                if (res.success && res.data?.url) {
                    this.pendingMediaUrl = res.data.url;
                    this.photoPreviewUrl = res.data.url;
                }
                this.isUploadingPhoto = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isUploadingPhoto = false;
                this.cdr.markForCheck();
            }
        });
        input.value = '';
    }

    removePendingPhoto() {
        this.pendingMediaUrl = null;
        this.photoPreviewUrl = null;
        this.cdr.markForCheck();
    }

    openContextMenu(event: MouseEvent, msg: MessageItem) {
        if (!this.isMine(msg)) return;
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuVisible = true;
        this.contextMenuX = event.clientX;
        this.contextMenuY = event.clientY;
        this.contextMenuMessage = msg;
        this.cdr.detectChanges();
    }

    startEditMessage() {
        if (!this.contextMenuMessage) return;
        this.editingMessageId = this.contextMenuMessage.id;
        this.editingContent = this.contextMenuMessage.content;
        this.contextMenuVisible = false;
        this.cdr.detectChanges();
    }

    saveEditMessage(msg: MessageItem) {
        const content = this.editingContent.trim();
        if (!content) return;
        this.messageService.editMessage(msg.id, content).subscribe({
            next: () => {
                msg.content = content;
                this.editingMessageId = null;
                this.editingContent = '';
                this.cdr.markForCheck();
            }
        });
    }

    cancelEditMessage() {
        this.editingMessageId = null;
        this.editingContent = '';
        this.cdr.markForCheck();
    }

    deleteMessage() {
        if (!this.contextMenuMessage) return;
        const msgId = this.contextMenuMessage.id;
        this.contextMenuVisible = false;
        this.messageService.deleteMessage(msgId).subscribe({
            next: () => {
                this.messages = this.messages.filter(m => m.id !== msgId);
                this.cdr.detectChanges();
            }
        });
    }

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
        this.cdr.markForCheck();
    }

    insertEmoji(emoji: string) {
        this.newMessage += emoji;
        this.cdr.markForCheck();
    }

    isMine(message: MessageItem): boolean {
        return message.senderId === this.currentUserId;
    }

    getAvatarUrl(partner: ConversationPartner): string {
        return partner.profilePicture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name || partner.username)}&background=random`;
    }

    getRelativeTime(dateString: string): string {
        if (!dateString) return '';
        let normalized = dateString;
        if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-', 10)) {
            normalized += 'Z';
        }
        const date = new Date(normalized);
        const now = new Date();
        const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
        if (seconds < 60) return 'just now';
        const intervals: [number, string][] = [[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'min']];
        for (const [secs, label] of intervals) {
            const count = Math.floor(seconds / secs);
            if (count >= 1) return `${count} ${label}${count > 1 && label !== 'min' ? 's' : ''} ago`;
        }
        return Math.floor(seconds) + ' seconds ago';
    }

    formatMessage(content: string): string {
        if (!content) return '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="msg-link">${url}</a>`;
        });
    }

    isSharedPost(msg: MessageItem): boolean {
        return !!(msg.content && msg.content.startsWith('📤 Shared post'));
    }

    getSharedPostAuthor(msg: MessageItem): string {
        if (!msg.content) return '';
        const match = msg.content.match(/@(\S+)/);
        return match ? match[1] : '';
    }

    getSharedPostContent(msg: MessageItem): string {
        if (!msg.content) return '';
        // Remove the header line (first line starting with 📤)
        const lines = msg.content.split('\n');
        const contentLines = lines.slice(1).filter(l => !l.startsWith('━'));
        return contentLines.join('\n').trim();
    }

    scrollToBottom() {
        try {
            if (this.messagesEnd) {
                this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
            }
        } catch { }
    }

}
