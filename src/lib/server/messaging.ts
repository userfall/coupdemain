import { randomUUID } from "node:crypto";
import { unstable_noStore as noStore } from "next/cache";
import { formatRelativeTime } from "@/lib/formatters";
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  NotificationItem,
  PostStatus,
} from "@/lib/types";
import { getDatabase } from "@/lib/server/db";

type ConversationRow = {
  id: string;
  post_id: string;
  post_slug: string;
  post_title: string;
  post_status: PostStatus;
  post_image_path: string | null;
  other_user_id: string;
  other_user_name: string;
  other_user_city: string;
  other_user_avatar_path: string | null;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
};

type MessageRow = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_path: string | null;
};

type PostOwnerRow = {
  id: string;
  user_id: string;
};

type ConversationIdentityRow = {
  id: string;
  owner_id: string;
  participant_id: string;
};

function previewMessage(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 88) {
    return normalized;
  }

  return `${normalized.slice(0, 85)}...`;
}

function mapConversationRow(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    postId: row.post_id,
    postSlug: row.post_slug,
    postTitle: row.post_title,
    postStatus: row.post_status,
    postImagePath: row.post_image_path,
    otherUserId: row.other_user_id,
    otherUserName: row.other_user_name,
    otherUserCity: row.other_user_city,
    otherUserAvatarPath: row.other_user_avatar_path,
    lastMessagePreview: previewMessage(row.last_message_preview),
    lastMessageAt: row.last_message_at,
    lastMessageAtLabel: formatRelativeTime(row.last_message_at),
    unreadCount: Number(row.unread_count ?? 0),
    createdAt: row.created_at,
  };
}

function conversationSelectSql() {
  return `
    select
      conversations.id,
      posts.id as post_id,
      posts.slug as post_slug,
      posts.title as post_title,
      posts.status as post_status,
      posts.image_path as post_image_path,
      case when conversations.owner_id = ? then participant.id else owner.id end as other_user_id,
      case when conversations.owner_id = ? then participant.display_name else owner.display_name end as other_user_name,
      case when conversations.owner_id = ? then participant.city else owner.city end as other_user_city,
      case when conversations.owner_id = ? then participant.avatar_path else owner.avatar_path end as other_user_avatar_path,
      coalesce(latest.content, '') as last_message_preview,
      conversations.last_message_at,
      (
        select count(*)
        from messages
        where messages.conversation_id = conversations.id
          and messages.sender_id != ?
          and messages.read_at is null
      ) as unread_count,
      conversations.created_at
    from conversations
    join posts on posts.id = conversations.post_id
    join users as owner on owner.id = conversations.owner_id
    join users as participant on participant.id = conversations.participant_id
    left join messages as latest on latest.id = (
      select id
      from messages
      where messages.conversation_id = conversations.id
      order by datetime(messages.created_at) desc
      limit 1
    )
  `;
}

export function listConversationsForUser(userId: string) {
  noStore();
  const database = getDatabase();
  const rows = database
    .prepare(`
      ${conversationSelectSql()}
      where conversations.owner_id = ? or conversations.participant_id = ?
      order by datetime(conversations.last_message_at) desc
    `)
    .all<ConversationRow>(userId, userId, userId, userId, userId, userId, userId);

  return rows.map(mapConversationRow);
}

export function getUnreadMessageCount(userId: string) {
  noStore();
  const database = getDatabase();
  const row = database
    .prepare(`
      select count(*) as count
      from messages
      join conversations on conversations.id = messages.conversation_id
      where (conversations.owner_id = ? or conversations.participant_id = ?)
        and messages.sender_id != ?
        and messages.read_at is null
    `)
    .get<{ count: number }>(userId, userId, userId);

  return Number(row?.count ?? 0);
}

export function listNotificationsForUser(userId: string) {
  noStore();
  const conversations = listConversationsForUser(userId);
  const conversationNotifications = conversations.map(
    (conversation) =>
      ({
        id: `message-${conversation.id}`,
        title:
          conversation.unreadCount > 0
            ? `${conversation.otherUserName} t'a ecrit`
            : `Conversation avec ${conversation.otherUserName}`,
        body:
          conversation.unreadCount > 0
            ? `${conversation.unreadCount} nouveau${conversation.unreadCount > 1 ? "x" : ""} message${conversation.unreadCount > 1 ? "s" : ""} au sujet de "${conversation.postTitle}".`
            : `Dernier message a propos de "${conversation.postTitle}".`,
        href: `/messages/${conversation.id}`,
        category: "message",
        createdAt: conversation.lastMessageAt,
        createdAtLabel: conversation.lastMessageAtLabel,
        unread: conversation.unreadCount > 0,
      }) satisfies NotificationItem,
  );

  const database = getDatabase();
  const rows = database
    .prepare(`
      select
        posts.id as post_id,
        posts.slug as post_slug,
        posts.title as post_title,
        posts.status as post_status,
        posts.views as views,
        posts.created_at as created_at
      from posts
      where posts.user_id = ?
      order by posts.views desc, datetime(posts.created_at) desc
      limit 3
    `)
    .all<{
      post_id: string;
      post_slug: string;
      post_title: string;
      post_status: PostStatus;
      views: number;
      created_at: string;
    }>(userId);

  const listingNotifications = rows.map(
    (row) =>
      ({
        id: `listing-${row.post_id}`,
        title: `Annonce suivie: ${row.post_title}`,
        body:
          row.post_status === "resolved"
            ? "Cette annonce est marquee comme resolue."
            : `${row.views} vue${row.views > 1 ? "s" : ""} pour cette annonce.`,
        href: `/annonces/${row.post_slug}`,
        category: "listing",
        createdAt: row.created_at,
        createdAtLabel: formatRelativeTime(row.created_at),
        unread: false,
      }) satisfies NotificationItem,
  );

  return [...conversationNotifications, ...listingNotifications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function findConversationForUserAndPost(postId: string, userId: string) {
  noStore();
  const database = getDatabase();
  const row = database
    .prepare(`
      select id
      from conversations
      where post_id = ?
        and (owner_id = ? or participant_id = ?)
      limit 1
    `)
    .get<{ id: string }>(postId, userId, userId);

  return row?.id ?? null;
}

export function getConversationForUser(conversationId: string, userId: string) {
  noStore();
  const database = getDatabase();
  const conversationRow = database
    .prepare(`
      ${conversationSelectSql()}
      where conversations.id = ?
        and (conversations.owner_id = ? or conversations.participant_id = ?)
      limit 1
    `)
    .get<ConversationRow>(
      userId,
      userId,
      userId,
      userId,
      userId,
      conversationId,
      userId,
      userId,
    );

  if (!conversationRow) {
    return null;
  }

  database
    .prepare(`
      update messages
      set read_at = ?
      where conversation_id = ?
        and sender_id != ?
        and read_at is null
    `)
    .run(new Date().toISOString(), conversationId, userId);

  const messageRows = database
    .prepare(`
      select
        messages.id,
        messages.content,
        messages.created_at,
        messages.sender_id,
        users.display_name as sender_name,
        users.avatar_path as sender_avatar_path
      from messages
      join users on users.id = messages.sender_id
      where messages.conversation_id = ?
      order by datetime(messages.created_at) asc
    `)
    .all<MessageRow>(conversationId);

  const messages = messageRows.map(
    (message) =>
      ({
        id: message.id,
        content: message.content,
        createdAt: message.created_at,
        createdAtLabel: formatRelativeTime(message.created_at),
        senderId: message.sender_id,
        senderName: message.sender_name,
        senderAvatarPath: message.sender_avatar_path,
        fromCurrentUser: message.sender_id === userId,
      }) satisfies ConversationMessage,
  );

  return {
    id: conversationRow.id,
    postId: conversationRow.post_id,
    postSlug: conversationRow.post_slug,
    postTitle: conversationRow.post_title,
    postStatus: conversationRow.post_status,
    postImagePath: conversationRow.post_image_path,
    otherUserId: conversationRow.other_user_id,
    otherUserName: conversationRow.other_user_name,
    otherUserCity: conversationRow.other_user_city,
    otherUserAvatarPath: conversationRow.other_user_avatar_path,
    createdAt: conversationRow.created_at,
    createdAtLabel: formatRelativeTime(conversationRow.created_at),
    unreadCount: 0,
    messages,
  } satisfies ConversationDetail;
}

export function peekConversationForUser(conversationId: string, userId: string) {
  noStore();
  const database = getDatabase();
  const conversationRow = database
    .prepare(`
      ${conversationSelectSql()}
      where conversations.id = ?
        and (conversations.owner_id = ? or conversations.participant_id = ?)
      limit 1
    `)
    .get<ConversationRow>(
      userId,
      userId,
      userId,
      userId,
      userId,
      conversationId,
      userId,
      userId,
    );

  if (!conversationRow) {
    return null;
  }

  const messageRows = database
    .prepare(`
      select
        messages.id,
        messages.content,
        messages.created_at,
        messages.sender_id,
        users.display_name as sender_name,
        users.avatar_path as sender_avatar_path
      from messages
      join users on users.id = messages.sender_id
      where messages.conversation_id = ?
      order by datetime(messages.created_at) asc
    `)
    .all<MessageRow>(conversationId);

  const messages = messageRows.map(
    (message) =>
      ({
        id: message.id,
        content: message.content,
        createdAt: message.created_at,
        createdAtLabel: formatRelativeTime(message.created_at),
        senderId: message.sender_id,
        senderName: message.sender_name,
        senderAvatarPath: message.sender_avatar_path,
        fromCurrentUser: message.sender_id === userId,
      }) satisfies ConversationMessage,
  );

  return {
    id: conversationRow.id,
    postId: conversationRow.post_id,
    postSlug: conversationRow.post_slug,
    postTitle: conversationRow.post_title,
    postStatus: conversationRow.post_status,
    postImagePath: conversationRow.post_image_path,
    otherUserId: conversationRow.other_user_id,
    otherUserName: conversationRow.other_user_name,
    otherUserCity: conversationRow.other_user_city,
    otherUserAvatarPath: conversationRow.other_user_avatar_path,
    createdAt: conversationRow.created_at,
    createdAtLabel: formatRelativeTime(conversationRow.created_at),
    unreadCount: Number(conversationRow.unread_count ?? 0),
    messages,
  } satisfies ConversationDetail;
}

export function startConversation(input: {
  postId: string;
  senderId: string;
  content: string;
}) {
  const database = getDatabase();
  const post = database
    .prepare("select id, user_id from posts where id = ? limit 1")
    .get<PostOwnerRow>(input.postId);

  if (!post) {
    throw new Error("Annonce introuvable.");
  }

  if (post.user_id === input.senderId) {
    throw new Error("Tu ne peux pas ouvrir une conversation avec ta propre annonce.");
  }

  const content = input.content.trim();

  if (content.length < 6) {
    throw new Error("Ajoute un premier message un peu plus detaille.");
  }

  const existingConversation = database
    .prepare(`
      select id
      from conversations
      where post_id = ?
        and owner_id = ?
        and participant_id = ?
      limit 1
    `)
    .get<{ id: string }>(post.id, post.user_id, input.senderId);

  const now = new Date().toISOString();
  const conversationId = existingConversation?.id ?? randomUUID();

  if (!existingConversation) {
    database
      .prepare(`
        insert into conversations (
          id,
          post_id,
          owner_id,
          participant_id,
          created_at,
          last_message_at
        )
        values (?, ?, ?, ?, ?, ?)
      `)
      .run(conversationId, post.id, post.user_id, input.senderId, now, now);
  }

  database
    .prepare(`
      insert into messages (
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        read_at
      )
      values (?, ?, ?, ?, ?, null)
    `)
    .run(randomUUID(), conversationId, input.senderId, content, now);

  database
    .prepare("update conversations set last_message_at = ? where id = ?")
    .run(now, conversationId);

  return { conversationId };
}

export function sendMessage(input: {
  conversationId: string;
  senderId: string;
  content: string;
}) {
  const database = getDatabase();
  const conversation = database
    .prepare(`
      select id, owner_id, participant_id
      from conversations
      where id = ?
      limit 1
    `)
    .get<ConversationIdentityRow>(input.conversationId);

  if (!conversation) {
    throw new Error("Conversation introuvable.");
  }

  if (
    conversation.owner_id !== input.senderId &&
    conversation.participant_id !== input.senderId
  ) {
    throw new Error("Conversation non autorisee.");
  }

  const content = input.content.trim();

  if (content.length < 1) {
    throw new Error("Le message ne peut pas etre vide.");
  }

  const now = new Date().toISOString();

  database
    .prepare(`
      insert into messages (
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        read_at
      )
      values (?, ?, ?, ?, ?, null)
    `)
    .run(randomUUID(), input.conversationId, input.senderId, content, now);

  database
    .prepare("update conversations set last_message_at = ? where id = ?")
    .run(now, input.conversationId);

  return { ok: true };
}
