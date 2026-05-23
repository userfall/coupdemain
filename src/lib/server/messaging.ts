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
import { ensureSupabaseInitialized } from "@/lib/server/supabase-init";
import {
  isMissingRowError,
  isSupabaseServerConfigured,
  requireSupabaseAdmin,
} from "@/lib/server/supabase-admin";

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

type SupabaseConversation = {
  id: string;
  post_id: string;
  owner_id: string;
  participant_id: string;
  created_at: string;
  last_message_at: string;
};

type SupabasePost = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  image_path: string | null;
  user_id: string;
  created_at?: string;
  views?: number;
};

type SupabaseMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
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

async function listSupabaseConversationRows(userId: string) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`owner_id.eq.${userId},participant_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    throw new Error(`Impossible de lire les conversations: ${error.message}`);
  }

  const rows = conversations ?? [];

  if (rows.length === 0) {
    return [];
  }

  const postIds = Array.from(new Set(rows.map((row) => row.post_id)));
  const userIds = Array.from(
    new Set(rows.flatMap((row) => [row.owner_id, row.participant_id])),
  );
  const conversationIds = rows.map((row) => row.id);

  const [
    { data: posts, error: postError },
    { data: users, error: userError },
    { data: messages, error: messageError },
  ] = await Promise.all([
    supabase.from("posts").select("id, slug, title, status, image_path").in("id", postIds),
    supabase.from("users").select("id, display_name, city, avatar_path").in("id", userIds),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at, read_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  if (postError) {
    throw new Error(`Impossible de lire les annonces des conversations: ${postError.message}`);
  }

  if (userError) {
    throw new Error(`Impossible de lire les profils des conversations: ${userError.message}`);
  }

  if (messageError) {
    throw new Error(`Impossible de lire les messages: ${messageError.message}`);
  }

  const postMap = new Map((posts ?? []).map((post) => [post.id, post]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));
  const latestByConversation = new Map<string, SupabaseMessage>();
  const unreadCounts = new Map<string, number>();

  for (const message of (messages ?? []) as SupabaseMessage[]) {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, message);
    }

    if (message.sender_id !== userId && !message.read_at) {
      unreadCounts.set(
        message.conversation_id,
        (unreadCounts.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  return rows
    .map((conversation) => {
      const post = postMap.get(conversation.post_id);
      const otherUserId =
        conversation.owner_id === userId
          ? conversation.participant_id
          : conversation.owner_id;
      const otherUser = userMap.get(otherUserId);
      const latest = latestByConversation.get(conversation.id);

      if (!post || !otherUser) {
        return null;
      }

      return {
        id: conversation.id,
        post_id: post.id,
        post_slug: post.slug,
        post_title: post.title,
        post_status: post.status,
        post_image_path: post.image_path,
        other_user_id: otherUser.id,
        other_user_name: otherUser.display_name,
        other_user_city: otherUser.city,
        other_user_avatar_path: otherUser.avatar_path,
        last_message_preview: latest?.content ?? "",
        last_message_at: conversation.last_message_at,
        unread_count: unreadCounts.get(conversation.id) ?? 0,
        created_at: conversation.created_at,
      } satisfies ConversationRow;
    })
    .filter((row): row is ConversationRow => Boolean(row));
}

async function getSupabaseConversationMessages(conversationId: string, userId: string) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Impossible de lire le detail des messages: ${error.message}`);
  }

  const senderIds = Array.from(new Set((messages ?? []).map((message) => message.sender_id)));
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, display_name, avatar_path")
    .in("id", senderIds);

  if (userError) {
    throw new Error(`Impossible de lire les expediteurs: ${userError.message}`);
  }

  const userMap = new Map((users ?? []).map((user) => [user.id, user]));

  return (messages ?? []).map(
    (message) =>
      ({
        id: message.id,
        content: message.content,
        createdAt: message.created_at,
        createdAtLabel: formatRelativeTime(message.created_at),
        senderId: message.sender_id,
        senderName: userMap.get(message.sender_id)?.display_name ?? "Membre",
        senderAvatarPath: userMap.get(message.sender_id)?.avatar_path ?? null,
        fromCurrentUser: message.sender_id === userId,
      }) satisfies ConversationMessage,
  );
}

export async function listConversationsForUser(userId: string) {
  noStore();

  const rows = isSupabaseServerConfigured
    ? await listSupabaseConversationRows(userId)
    : getDatabase()
        .prepare(`
          ${conversationSelectSql()}
          where conversations.owner_id = ? or conversations.participant_id = ?
          order by datetime(conversations.last_message_at) desc
        `)
        .all<ConversationRow>(userId, userId, userId, userId, userId, userId, userId);

  return rows.map(mapConversationRow);
}

export async function getUnreadMessageCount(userId: string) {
  noStore();

  if (isSupabaseServerConfigured) {
    const conversations = await listSupabaseConversationRows(userId);
    return conversations.reduce((sum, conversation) => sum + conversation.unread_count, 0);
  }

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

export async function listNotificationsForUser(userId: string) {
  noStore();
  const conversations = await listConversationsForUser(userId);
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

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const { data: posts, error } = await requireSupabaseAdmin()
      .from("posts")
      .select("id, slug, title, status, views, created_at")
      .eq("user_id", userId)
      .order("views", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      throw new Error(`Impossible de lire les notifications annonces: ${error.message}`);
    }

    const listingNotifications = (posts ?? []).map(
      (row) =>
        ({
          id: `listing-${row.id}`,
          title: `Annonce suivie: ${row.title}`,
          body:
            row.status === "resolved"
              ? "Cette annonce est marquee comme resolue."
              : `${row.views} vue${row.views > 1 ? "s" : ""} pour cette annonce.`,
          href: `/annonces/${row.slug}`,
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

export async function findConversationForUserAndPost(postId: string, userId: string) {
  noStore();

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const { data, error } = await requireSupabaseAdmin()
      .from("conversations")
      .select("id")
      .eq("post_id", postId)
      .or(`owner_id.eq.${userId},participant_id.eq.${userId}`)
      .maybeSingle<{ id: string }>();

    if (error && !isMissingRowError(error)) {
      throw new Error(`Impossible de trouver la conversation: ${error.message}`);
    }

    return data?.id ?? null;
  }

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

async function buildSupabaseConversationDetail(
  conversationId: string,
  userId: string,
  markAsRead: boolean,
) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .or(`owner_id.eq.${userId},participant_id.eq.${userId}`)
    .maybeSingle<SupabaseConversation>();

  if (error && !isMissingRowError(error)) {
    throw new Error(`Impossible de lire la conversation: ${error.message}`);
  }

  if (!conversation) {
    return null;
  }

  if (markAsRead) {
    const { data: unreadRows, error: unreadError } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (unreadError) {
      throw new Error(`Impossible de marquer les messages comme lus: ${unreadError.message}`);
    }

    const unreadIds = (unreadRows ?? []).map((row) => row.id);

    if (unreadIds.length > 0) {
      const { error: updateError } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (updateError) {
        throw new Error(`Impossible de mettre a jour les messages lus: ${updateError.message}`);
      }
    }
  }

  const otherUserId =
    conversation.owner_id === userId ? conversation.participant_id : conversation.owner_id;

  const [{ data: post, error: postError }, { data: users, error: userError }, messages] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, slug, title, status, image_path")
        .eq("id", conversation.post_id)
        .maybeSingle<SupabasePost>(),
      supabase
        .from("users")
        .select("id, display_name, city, avatar_path")
        .in("id", [conversation.owner_id, conversation.participant_id]),
      getSupabaseConversationMessages(conversationId, userId),
    ]);

  if (postError && !isMissingRowError(postError)) {
    throw new Error(`Impossible de lire l'annonce de la conversation: ${postError.message}`);
  }

  if (userError) {
    throw new Error(`Impossible de lire les participants: ${userError.message}`);
  }

  if (!post) {
    return null;
  }

  const otherUser = (users ?? []).find((user) => user.id === otherUserId);

  if (!otherUser) {
    return null;
  }

  return {
    id: conversation.id,
    postId: post.id,
    postSlug: post.slug,
    postTitle: post.title,
    postStatus: post.status,
    postImagePath: post.image_path,
    otherUserId: otherUser.id,
    otherUserName: otherUser.display_name,
    otherUserCity: otherUser.city,
    otherUserAvatarPath: otherUser.avatar_path,
    createdAt: conversation.created_at,
    createdAtLabel: formatRelativeTime(conversation.created_at),
    unreadCount: markAsRead ? 0 : messages.filter((message) => !message.fromCurrentUser).length,
    messages,
  } satisfies ConversationDetail;
}

export async function getConversationForUser(conversationId: string, userId: string) {
  noStore();

  if (isSupabaseServerConfigured) {
    return buildSupabaseConversationDetail(conversationId, userId, true);
  }

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

export async function peekConversationForUser(conversationId: string, userId: string) {
  noStore();

  if (isSupabaseServerConfigured) {
    return buildSupabaseConversationDetail(conversationId, userId, false);
  }

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

export async function startConversation(input: {
  postId: string;
  senderId: string;
  content: string;
}) {
  const content = input.content.trim();

  if (content.length < 6) {
    throw new Error("Ajoute un premier message un peu plus detaille.");
  }

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", input.postId)
      .maybeSingle<PostOwnerRow>();

    if (postError && !isMissingRowError(postError)) {
      throw new Error(`Impossible de lire l'annonce: ${postError.message}`);
    }

    if (!post) {
      throw new Error("Annonce introuvable.");
    }

    if (post.user_id === input.senderId) {
      throw new Error("Tu ne peux pas ouvrir une conversation avec ta propre annonce.");
    }

    const { data: existingConversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("post_id", post.id)
      .eq("owner_id", post.user_id)
      .eq("participant_id", input.senderId)
      .maybeSingle<{ id: string }>();

    if (conversationError && !isMissingRowError(conversationError)) {
      throw new Error(`Impossible de verifier la conversation: ${conversationError.message}`);
    }

    const now = new Date().toISOString();
    const conversationId = existingConversation?.id ?? randomUUID();

    if (!existingConversation) {
      const { error } = await supabase.from("conversations").insert({
        id: conversationId,
        post_id: post.id,
        owner_id: post.user_id,
        participant_id: input.senderId,
        created_at: now,
        last_message_at: now,
      });

      if (error) {
        throw new Error(`Impossible de creer la conversation: ${error.message}`);
      }
    }

    const { error: messageError } = await supabase.from("messages").insert({
      id: randomUUID(),
      conversation_id: conversationId,
      sender_id: input.senderId,
      content,
      created_at: now,
      read_at: null,
    });

    if (messageError) {
      throw new Error(`Impossible d'envoyer le premier message: ${messageError.message}`);
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ last_message_at: now })
      .eq("id", conversationId);

    if (updateError) {
      throw new Error(`Impossible de rafraichir la conversation: ${updateError.message}`);
    }

    return { conversationId };
  }

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

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  content: string;
}) {
  const content = input.content.trim();

  if (content.length < 1) {
    throw new Error("Le message ne peut pas etre vide.");
  }

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("id, owner_id, participant_id")
      .eq("id", input.conversationId)
      .maybeSingle<ConversationIdentityRow>();

    if (error && !isMissingRowError(error)) {
      throw new Error(`Impossible de lire la conversation: ${error.message}`);
    }

    if (!conversation) {
      throw new Error("Conversation introuvable.");
    }

    if (
      conversation.owner_id !== input.senderId &&
      conversation.participant_id !== input.senderId
    ) {
      throw new Error("Conversation non autorisee.");
    }

    const now = new Date().toISOString();
    const { error: messageError } = await supabase.from("messages").insert({
      id: randomUUID(),
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content,
      created_at: now,
      read_at: null,
    });

    if (messageError) {
      throw new Error(`Impossible d'envoyer le message: ${messageError.message}`);
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ last_message_at: now })
      .eq("id", input.conversationId);

    if (updateError) {
      throw new Error(`Impossible de rafraichir la conversation: ${updateError.message}`);
    }

    return { ok: true };
  }

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
