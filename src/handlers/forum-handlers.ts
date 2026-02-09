/**
 * Forum-related request handlers for MCP tools
 */

import { vexForumClient } from "../utils/discourse-client.js";
import { createTextResponse, createErrorResponse, truncateText } from "../utils/response-formatter.js";

// Type definitions for handler parameters
export interface SearchForumParams {
  query: string;
  category?: string;
  user?: string;
  order?: "latest" | "likes" | "views" | "latest_topic";
  before?: string;
  after?: string;
  max_results?: number;
}

export interface GetForumTopicParams {
  topic_id: number;
  max_posts?: number;
  include_raw?: boolean;
}

export interface GetForumPostParams {
  post_id: number;
}

export interface GetForumUserParams {
  username: string;
}

export interface ListForumCategoriesParams {}

export interface GetLatestForumTopicsParams {
  category_slug?: string;
  category_id?: number;
  page?: number;
  max_results?: number;
}

/**
 * Strip HTML tags from content for cleaner text output
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, "\n\n") // Collapse multiple newlines
    .trim();
}

/**
 * Format a date string to a readable format
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export class ForumHandlers {
  /**
   * Handles search-forum tool requests
   */
  static async handleSearchForum(args: SearchForumParams) {
    try {
      const maxResults = Math.min(args.max_results || 10, 50);

      const result = await vexForumClient.search(args.query, {
        category: args.category,
        user: args.user,
        order: args.order,
        before: args.before,
        after: args.after,
      });

      const topics = result.topics || [];
      const posts = result.posts || [];

      if (topics.length === 0 && posts.length === 0) {
        return createTextResponse(`No results found for "${args.query}"`);
      }

      let responseText = `**Search Results for "${args.query}"**\n\n`;

      // Format topics
      if (topics.length > 0) {
        responseText += `### Topics (${topics.length} found)\n\n`;
        const displayTopics = topics.slice(0, maxResults);

        for (const topic of displayTopics) {
          responseText +=
            `**[${topic.title}](https://www.vexforum.com/t/${topic.slug}/${topic.id})**\n` +
            `- Views: ${topic.views} | Replies: ${topic.reply_count} | Likes: ${topic.like_count}\n` +
            `- Created: ${formatDate(topic.created_at)}` +
            (topic.tags && topic.tags.length > 0 ? ` | Tags: ${topic.tags.join(", ")}` : "") +
            `\n\n`;
        }

        if (topics.length > maxResults) {
          responseText += `*... and ${topics.length - maxResults} more topics*\n\n`;
        }
      }

      // Format posts with blurbs
      if (posts.length > 0) {
        responseText += `### Matching Posts (${posts.length} found)\n\n`;
        const displayPosts = posts.slice(0, maxResults);

        for (const post of displayPosts) {
          const blurb = truncateText(stripHtml(post.blurb), 200);
          responseText +=
            `**${post.topic_title_headline || "Post"}** by @${post.username}\n` +
            `> ${blurb}\n` +
            `- [View Post](https://www.vexforum.com/t/-/${post.topic_id}/${post.post_number}) | ` +
            `Likes: ${post.like_count} | Posted: ${formatDate(post.created_at)}\n\n`;
        }

        if (posts.length > maxResults) {
          responseText += `*... and ${posts.length - maxResults} more posts*\n\n`;
        }
      }

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "searching VEX Forum");
    }
  }

  /**
   * Handles get-forum-topic tool requests
   */
  static async handleGetForumTopic(args: GetForumTopicParams) {
    try {
      const maxPosts = Math.min(args.max_posts || 10, 50);

      const topic = await vexForumClient.getTopic(args.topic_id, {
        include_raw: args.include_raw,
      });

      let responseText =
        `**${topic.title}**\n` +
        `[View on VEX Forum](https://www.vexforum.com/t/${topic.slug}/${topic.id})\n\n` +
        `- **Views:** ${topic.views}\n` +
        `- **Replies:** ${topic.reply_count}\n` +
        `- **Likes:** ${topic.like_count}\n` +
        `- **Created:** ${formatDate(topic.created_at)}\n` +
        `- **Last Activity:** ${formatDate(topic.last_posted_at)}\n` +
        (topic.tags && topic.tags.length > 0 ? `- **Tags:** ${topic.tags.join(", ")}\n` : "") +
        (topic.closed ? `- **Status:** Closed\n` : "") +
        (topic.archived ? `- **Status:** Archived\n` : "");

      // Add participant info if available
      if (topic.details?.participants && topic.details.participants.length > 0) {
        const topParticipants = topic.details.participants
          .slice(0, 5)
          .map((p) => `@${p.username} (${p.post_count} posts)`)
          .join(", ");
        responseText += `- **Top Participants:** ${topParticipants}\n`;
      }

      responseText += "\n---\n\n";

      // Add posts
      const posts = topic.post_stream?.posts || [];
      const displayPosts = posts.slice(0, maxPosts);

      responseText += `### Posts (showing ${displayPosts.length} of ${posts.length})\n\n`;

      for (const post of displayPosts) {
        const content = args.include_raw && post.raw
          ? post.raw
          : stripHtml(post.cooked);

        const truncatedContent = truncateText(content, 1500);

        responseText +=
          `#### Post #${post.post_number} by @${post.username}` +
          (post.name ? ` (${post.name})` : "") +
          `\n` +
          `*${formatDate(post.created_at)}*` +
          (post.like_count ? ` | ${post.like_count} likes` : "") +
          `\n\n` +
          `${truncatedContent}\n\n` +
          `---\n\n`;
      }

      if (posts.length > maxPosts) {
        responseText += `*${posts.length - maxPosts} more posts not shown. View the full topic on VEX Forum.*\n`;
      }

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, `retrieving topic ${args.topic_id}`);
    }
  }

  /**
   * Handles get-forum-post tool requests
   */
  static async handleGetForumPost(args: GetForumPostParams) {
    try {
      const post = await vexForumClient.getPost(args.post_id);

      const content = post.raw || stripHtml(post.cooked);

      // Format topic title - use slug as fallback if title not available
      const topicDisplay = post.topic_title
        ? post.topic_title
        : post.topic_slug?.replace(/-/g, " ") || `Topic ${post.topic_id}`;

      const responseText =
        `**Post #${post.post_number}** in topic: **${topicDisplay}**\n` +
        `[View on VEX Forum](https://www.vexforum.com/t/${post.topic_slug}/${post.topic_id}/${post.post_number})\n\n` +
        `- **Author:** @${post.username}` + (post.name ? ` (${post.name})` : "") + `\n` +
        `- **Posted:** ${formatDate(post.created_at)}\n` +
        `- **Updated:** ${formatDate(post.updated_at)}\n` +
        (post.like_count ? `- **Likes:** ${post.like_count}\n` : "") +
        `- **Reply Count:** ${post.reply_count}\n\n` +
        `---\n\n` +
        `${content}`;

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, `retrieving post ${args.post_id}`);
    }
  }

  /**
   * Handles get-forum-user tool requests
   */
  static async handleGetForumUser(args: GetForumUserParams) {
    try {
      const response = await vexForumClient.getUser(args.username);
      const user = response.user;

      // Format time read (in seconds) to human readable
      const formatTimeRead = (seconds?: number): string => {
        if (!seconds) return "N/A";
        const hours = Math.floor(seconds / 3600);
        if (hours >= 24) {
          const days = Math.floor(hours / 24);
          return `${days} days`;
        }
        return `${hours} hours`;
      };

      let responseText =
        `**@${user.username}**` + (user.name ? ` (${user.name})` : "") + `\n` +
        `[View Profile](https://www.vexforum.com/u/${user.username})\n\n` +
        (user.title ? `- **Title:** ${user.title}\n` : "") +
        `- **Trust Level:** ${user.trust_level}\n` +
        (user.post_count !== undefined ? `- **Posts:** ${user.post_count}\n` : "") +
        (user.posts_read_count !== undefined ? `- **Posts Read:** ${user.posts_read_count}\n` : "") +
        (user.days_visited !== undefined ? `- **Days Visited:** ${user.days_visited}\n` : "") +
        `- **Badges:** ${user.badge_count || 0}\n` +
        (user.time_read ? `- **Time Read:** ${formatTimeRead(user.time_read)}\n` : "") +
        `- **Joined:** ${formatDate(user.created_at)}\n` +
        `- **Last Seen:** ${formatDate(user.last_seen_at)}\n` +
        (user.location ? `- **Location:** ${user.location}\n` : "") +
        (user.website ? `- **Website:** ${user.website}\n` : "");

      if (user.moderator || user.admin) {
        responseText += `- **Role:** ${user.admin ? "Admin" : "Moderator"}\n`;
      }

      // Try bio_cooked first, then bio_excerpt
      const bioContent = user.bio_cooked || (user as any).bio_excerpt;
      if (bioContent) {
        const bio = stripHtml(bioContent);
        if (bio) {
          responseText += `\n**Bio:**\n${truncateText(bio, 500)}\n`;
        }
      }

      // Add groups if available
      if (user.groups && user.groups.length > 0) {
        const groupNames = user.groups
          .filter((g) => !g.automatic)
          .map((g) => g.name)
          .slice(0, 10);
        if (groupNames.length > 0) {
          responseText += `\n**Groups:** ${groupNames.join(", ")}\n`;
        }
      }

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, `retrieving user ${args.username}`);
    }
  }

  /**
   * Handles list-forum-categories tool requests
   */
  static async handleListForumCategories(_args: ListForumCategoriesParams) {
    try {
      const response = await vexForumClient.getCategories();
      const categories = response.category_list.categories;

      let responseText = `**VEX Forum Categories** (${categories.length} total)\n\n`;

      // Group by parent categories
      const parentCategories = categories.filter((c) => !c.has_children || c.subcategory_ids === undefined);
      const childCategories = new Map<number, typeof categories>();

      for (const cat of categories) {
        if (cat.subcategory_ids) {
          for (const subId of cat.subcategory_ids) {
            const subCat = categories.find((c) => c.id === subId);
            if (subCat) {
              if (!childCategories.has(cat.id)) {
                childCategories.set(cat.id, []);
              }
              childCategories.get(cat.id)!.push(subCat);
            }
          }
        }
      }

      for (const cat of parentCategories) {
        responseText +=
          `### ${cat.name}\n` +
          `- **Slug:** ${cat.slug} | **ID:** ${cat.id}\n` +
          `- **Topics:** ${cat.topic_count} | **Posts:** ${cat.post_count}\n` +
          (cat.description_text ? `- ${truncateText(cat.description_text, 150)}\n` : "");

        const children = childCategories.get(cat.id);
        if (children && children.length > 0) {
          responseText += `- **Subcategories:**\n`;
          for (const child of children) {
            responseText += `  - ${child.name} (${child.slug}, ID: ${child.id}) - ${child.topic_count} topics\n`;
          }
        }
        responseText += "\n";
      }

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "listing forum categories");
    }
  }

  /**
   * Handles get-latest-forum-topics tool requests
   */
  static async handleGetLatestForumTopics(args: GetLatestForumTopicsParams) {
    try {
      const maxResults = Math.min(args.max_results || 20, 50);

      let response;
      let categoryInfo = "";

      if (args.category_slug && args.category_id) {
        response = await vexForumClient.getCategoryTopics(
          args.category_slug,
          args.category_id,
          { page: args.page }
        );
        categoryInfo = ` in category "${args.category_slug}"`;
      } else {
        response = await vexForumClient.getLatestTopics({ page: args.page });
      }

      const topics = response.topic_list.topics;

      if (topics.length === 0) {
        return createTextResponse(`No topics found${categoryInfo}`);
      }

      let responseText = `**Latest Topics${categoryInfo}**\n\n`;

      const displayTopics = topics.slice(0, maxResults);

      for (const topic of displayTopics) {
        responseText +=
          `**[${topic.title}](https://www.vexforum.com/t/${topic.slug}/${topic.id})**\n` +
          `- Views: ${topic.views} | Replies: ${topic.reply_count} | Likes: ${topic.like_count}\n` +
          `- Last Activity: ${formatDate(topic.bumped_at)}\n` +
          (topic.tags && topic.tags.length > 0 ? `- Tags: ${topic.tags.join(", ")}\n` : "") +
          (topic.pinned ? `- *Pinned*\n` : "") +
          `\n`;
      }

      if (topics.length > maxResults) {
        responseText += `*... and ${topics.length - maxResults} more topics*\n`;
      }

      if (response.topic_list.more_topics_url) {
        responseText += `\n*More topics available. Use page parameter to load more.*\n`;
      }

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "retrieving latest forum topics");
    }
  }
}
