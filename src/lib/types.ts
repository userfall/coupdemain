export type PostType = "request" | "offer";
export type PostStatus = "open" | "matched" | "resolved";

export type Category = {
  slug: string;
  name: string;
  description: string;
  count: number;
  tint: string;
  textColor: string;
};

export type CommunityPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: PostType;
  category: string;
  categoryLabel: string;
  city: string;
  author: string;
  authorId: string;
  authorAvatarPath: string | null;
  contactPreview: string;
  phonePreview: string | null;
  availability: string;
  createdAt: string;
  createdAtISO: string;
  status: PostStatus;
  statusLabel: string;
  urgent: boolean;
  tags: string[];
  imagePath: string | null;
  views: number;
};

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  city: string;
  avatarPath: string | null;
  createdAt: string;
};

export type MarketplaceStats = {
  activePosts: number;
  users: number;
  cities: number;
  resolvedPosts: number;
};

export type Stat = {
  label: string;
  value: string;
  note: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type DashboardTask = {
  title: string;
  priority: string;
  description: string;
};

export type PostDetailView = CommunityPost & {
  contactLabel: string;
  phoneLabel: string | null;
  isOwner: boolean;
  isSaved: boolean;
};

export type ConversationSummary = {
  id: string;
  postId: string;
  postSlug: string;
  postTitle: string;
  postStatus: PostStatus;
  postImagePath: string | null;
  otherUserId: string;
  otherUserName: string;
  otherUserCity: string;
  otherUserAvatarPath: string | null;
  lastMessagePreview: string;
  lastMessageAt: string;
  lastMessageAtLabel: string;
  unreadCount: number;
  createdAt: string;
};

export type ConversationMessage = {
  id: string;
  content: string;
  createdAt: string;
  createdAtLabel: string;
  senderId: string;
  senderName: string;
  senderAvatarPath: string | null;
  fromCurrentUser: boolean;
};

export type ConversationDetail = {
  id: string;
  postId: string;
  postSlug: string;
  postTitle: string;
  postStatus: PostStatus;
  postImagePath: string | null;
  otherUserId: string;
  otherUserName: string;
  otherUserCity: string;
  otherUserAvatarPath: string | null;
  createdAt: string;
  createdAtLabel: string;
  unreadCount: number;
  messages: ConversationMessage[];
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  category: "message" | "listing" | "saved";
  createdAt: string;
  createdAtLabel: string;
  unread: boolean;
};

export type LiveConversationPayload = {
  conversation: ConversationDetail;
  conversations: ConversationSummary[];
  unreadCount: number;
};
