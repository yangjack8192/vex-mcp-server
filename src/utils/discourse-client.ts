/**
 * Discourse API client using cloudscraper for Cloudflare bypass
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory (go up from build/utils or src/utils)
const projectRoot = path.resolve(__dirname, "..", "..");

interface CloudscraperRequest {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  data?: unknown;
  timeout?: number;
}

interface CloudscraperResponse {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  url: string;
  data: unknown;
  isJson: boolean;
  error?: boolean;
  message?: string;
}

/**
 * Execute a request using the Python cloudscraper helper
 */
async function executeCloudscraperRequest(
  request: CloudscraperRequest
): Promise<CloudscraperResponse> {
  return new Promise((resolve, reject) => {
    // Python script is in src/utils/, not build/utils/
    const pythonScript = path.join(projectRoot, "src", "utils", "cloudscraper_helper.py");

    const pythonProcess = spawn("python3", [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        try {
          const errorData = JSON.parse(stdout);
          reject(new Error(errorData.message || `Python process exited with code ${code}`));
        } catch {
          reject(new Error(stderr || `Python process exited with code ${code}`));
        }
        return;
      }

      try {
        const response = JSON.parse(stdout);
        if (response.error) {
          reject(new Error(response.message));
        } else {
          resolve(response);
        }
      } catch (e) {
        reject(new Error(`Failed to parse response: ${stdout}`));
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });

    // Send request data to stdin
    pythonProcess.stdin.write(JSON.stringify(request));
    pythonProcess.stdin.end();
  });
}

/**
 * VEX Forum Discourse API Client
 */
export class DiscourseClient {
  private baseUrl: string;

  constructor(baseUrl: string = "https://www.vexforum.com") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Make a GET request to the Discourse API
   */
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await executeCloudscraperRequest({
      url,
      method: "GET",
      params,
      timeout: 30,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Request to ${endpoint} failed`);
    }

    return response.data as T;
  }

  /**
   * Search the forum
   */
  async search(query: string, options?: {
    category?: string | number;
    user?: string;
    order?: "latest" | "likes" | "views" | "latest_topic";
    status?: "open" | "closed" | "archived" | "noreplies" | "single_user";
    min_posts?: number;
    max_posts?: number;
    before?: string;
    after?: string;
  }): Promise<DiscourseSearchResult> {
    // Build search query string
    let searchQuery = query;

    if (options?.category) {
      searchQuery += ` #${options.category}`;
    }
    if (options?.user) {
      searchQuery += ` @${options.user}`;
    }
    if (options?.order) {
      searchQuery += ` order:${options.order}`;
    }
    if (options?.status) {
      searchQuery += ` status:${options.status}`;
    }
    if (options?.min_posts) {
      searchQuery += ` min_posts:${options.min_posts}`;
    }
    if (options?.max_posts) {
      searchQuery += ` max_posts:${options.max_posts}`;
    }
    if (options?.before) {
      searchQuery += ` before:${options.before}`;
    }
    if (options?.after) {
      searchQuery += ` after:${options.after}`;
    }

    return this.get<DiscourseSearchResult>("/search.json", { q: searchQuery });
  }

  /**
   * Get a topic by ID
   */
  async getTopic(topicId: number, options?: {
    post_number?: number;
    include_raw?: boolean;
  }): Promise<DiscourseTopic> {
    const params: Record<string, string | number> = {};
    if (options?.include_raw) {
      params.include_raw = 1;
    }
    if (options?.post_number) {
      params.post_number = options.post_number;
    }
    return this.get<DiscourseTopic>(`/t/${topicId}.json`, params);
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: number): Promise<DiscoursePost> {
    return this.get<DiscoursePost>(`/posts/${postId}.json`);
  }

  /**
   * Get user profile by username
   */
  async getUser(username: string): Promise<DiscourseUserResponse> {
    return this.get<DiscourseUserResponse>(`/u/${username}.json`);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<DiscourseCategoriesResponse> {
    return this.get<DiscourseCategoriesResponse>("/categories.json");
  }

  /**
   * Get latest topics
   */
  async getLatestTopics(options?: {
    page?: number;
    order?: string;
  }): Promise<DiscourseTopicListResponse> {
    const params: Record<string, string | number> = {};
    if (options?.page) {
      params.page = options.page;
    }
    if (options?.order) {
      params.order = options.order;
    }
    return this.get<DiscourseTopicListResponse>("/latest.json", params);
  }

  /**
   * Get topics from a specific category
   */
  async getCategoryTopics(
    categorySlug: string,
    categoryId: number,
    options?: { page?: number }
  ): Promise<DiscourseTopicListResponse> {
    const params: Record<string, string | number> = {};
    if (options?.page) {
      params.page = options.page;
    }
    return this.get<DiscourseTopicListResponse>(
      `/c/${categorySlug}/${categoryId}.json`,
      params
    );
  }
}

// Type definitions for Discourse API responses

export interface DiscourseSearchResult {
  posts?: DiscourseSearchPost[];
  topics?: DiscourseSearchTopic[];
  users?: DiscourseSearchUser[];
  grouped_search_result?: {
    more_posts: boolean;
    more_users: boolean;
    more_categories: boolean;
    term: string;
    search_log_id: number;
    more_full_page_results: boolean;
    can_create_topic: boolean;
    error: string | null;
    post_ids: number[];
    user_ids: number[];
    category_ids: number[];
    tag_ids: number[];
    group_ids: number[];
  };
}

export interface DiscourseSearchPost {
  id: number;
  name: string;
  username: string;
  avatar_template: string;
  created_at: string;
  like_count: number;
  blurb: string;
  post_number: number;
  topic_title_headline: string;
  topic_id: number;
}

export interface DiscourseSearchTopic {
  id: number;
  title: string;
  fancy_title: string;
  slug: string;
  posts_count: number;
  reply_count: number;
  highest_post_number: number;
  created_at: string;
  last_posted_at: string;
  bumped: boolean;
  bumped_at: string;
  archetype: string;
  unseen: boolean;
  pinned: boolean;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  views: number;
  like_count: number;
  category_id: number;
  tags?: string[];
}

export interface DiscourseSearchUser {
  id: number;
  username: string;
  name: string;
  avatar_template: string;
}

export interface DiscourseTopic {
  id: number;
  title: string;
  fancy_title: string;
  slug: string;
  posts_count: number;
  reply_count: number;
  highest_post_number: number;
  created_at: string;
  last_posted_at: string;
  bumped: boolean;
  bumped_at: string;
  archetype: string;
  pinned: boolean;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  views: number;
  like_count: number;
  category_id: number;
  tags?: string[];
  post_stream?: {
    posts: DiscourseTopicPost[];
    stream?: number[];
  };
  details?: {
    auto_close_at: string | null;
    auto_close_hours: number | null;
    auto_close_based_on_last_post: boolean;
    created_by: {
      id: number;
      username: string;
      name: string;
      avatar_template: string;
    };
    last_poster: {
      id: number;
      username: string;
      name: string;
      avatar_template: string;
    };
    participants: Array<{
      id: number;
      username: string;
      name: string;
      avatar_template: string;
      post_count: number;
    }>;
    links?: Array<{
      url: string;
      title: string;
      internal: boolean;
      attachment: boolean;
      reflection: boolean;
      clicks: number;
      user_id: number;
      domain: string;
    }>;
  };
}

export interface DiscourseTopicPost {
  id: number;
  name: string;
  username: string;
  avatar_template: string;
  created_at: string;
  cooked: string;
  raw?: string;
  post_number: number;
  post_type: number;
  updated_at: string;
  reply_count: number;
  reply_to_post_number: number | null;
  quote_count: number;
  incoming_link_count: number;
  reads: number;
  readers_count: number;
  score: number;
  yours: boolean;
  topic_id: number;
  topic_slug: string;
  primary_group_name: string | null;
  flair_name: string | null;
  flair_url: string | null;
  flair_bg_color: string | null;
  flair_color: string | null;
  version: number;
  can_edit: boolean;
  can_delete: boolean;
  can_recover: boolean;
  can_wiki: boolean;
  user_title: string | null;
  actions_summary?: Array<{
    id: number;
    count: number;
    acted?: boolean;
  }>;
  moderator: boolean;
  admin: boolean;
  staff: boolean;
  user_id: number;
  hidden: boolean;
  trust_level: number;
  deleted_at: string | null;
  user_deleted: boolean;
  edit_reason: string | null;
  can_view_edit_history: boolean;
  wiki: boolean;
  like_count?: number;
}

export interface DiscoursePost {
  id: number;
  name: string;
  username: string;
  avatar_template: string;
  created_at: string;
  cooked: string;
  raw?: string;
  post_number: number;
  post_type: number;
  updated_at: string;
  reply_count: number;
  reply_to_post_number: number | null;
  topic_id: number;
  topic_slug: string;
  topic_title: string;
  topic_html_title: string;
  category_id: number;
  user_id: number;
  like_count?: number;
}

export interface DiscourseUserResponse {
  user: DiscourseUser;
}

export interface DiscourseUser {
  id: number;
  username: string;
  name: string;
  avatar_template: string;
  title: string | null;
  last_posted_at: string;
  last_seen_at: string;
  created_at: string;
  trust_level: number;
  moderator: boolean;
  admin: boolean;
  post_count: number;
  posts_read_count: number;
  days_visited: number;
  badge_count: number;
  time_read: number;
  recent_time_read: number;
  primary_group_id: number | null;
  primary_group_name: string | null;
  flair_name: string | null;
  flair_url: string | null;
  flair_bg_color: string | null;
  flair_color: string | null;
  bio_raw?: string;
  bio_cooked?: string;
  website?: string;
  website_name?: string;
  location?: string;
  profile_view_count?: number;
  invited_by?: {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
  };
  groups?: Array<{
    id: number;
    automatic: boolean;
    name: string;
    display_name: string;
    user_count: number;
    mentionable_level: number;
    messageable_level: number;
    visibility_level: number;
    primary_group: boolean;
    title: string | null;
    grant_trust_level: number | null;
    incoming_email: string | null;
    has_messages: boolean;
    flair_url: string | null;
    flair_bg_color: string | null;
    flair_color: string | null;
    bio_raw: string | null;
    bio_cooked: string | null;
    public_admission: boolean;
    public_exit: boolean;
    allow_membership_requests: boolean;
    full_name: string | null;
  }>;
  user_fields?: Record<string, string>;
}

export interface DiscourseCategoriesResponse {
  category_list: {
    can_create_category: boolean;
    can_create_topic: boolean;
    categories: DiscourseCategory[];
  };
}

export interface DiscourseCategory {
  id: number;
  name: string;
  color: string;
  text_color: string;
  slug: string;
  topic_count: number;
  post_count: number;
  position: number;
  description: string;
  description_text: string;
  topic_url: string;
  read_restricted: boolean;
  permission: number;
  notification_level: number;
  can_edit: boolean;
  topic_template: string | null;
  has_children: boolean;
  sort_order: string | null;
  sort_ascending: boolean | null;
  show_subcategory_list: boolean;
  num_featured_topics: number;
  default_view: string | null;
  subcategory_list_style: string;
  default_top_period: string;
  default_list_filter: string;
  minimum_required_tags: number;
  navigate_to_first_post_after_read: boolean;
  topics_day: number;
  topics_week: number;
  topics_month: number;
  topics_year: number;
  topics_all_time: number;
  is_uncategorized: boolean;
  subcategory_ids?: number[];
  uploaded_logo?: {
    id: number;
    url: string;
    width: number;
    height: number;
  };
  uploaded_background?: {
    id: number;
    url: string;
    width: number;
    height: number;
  };
}

export interface DiscourseTopicListResponse {
  users?: DiscourseSearchUser[];
  primary_groups?: unknown[];
  flair_groups?: unknown[];
  topic_list: {
    can_create_topic: boolean;
    more_topics_url?: string;
    per_page: number;
    top_tags?: string[];
    topics: DiscourseTopicListItem[];
  };
}

export interface DiscourseTopicListItem {
  id: number;
  title: string;
  fancy_title: string;
  slug: string;
  posts_count: number;
  reply_count: number;
  highest_post_number: number;
  image_url: string | null;
  created_at: string;
  last_posted_at: string;
  bumped: boolean;
  bumped_at: string;
  archetype: string;
  unseen: boolean;
  last_read_post_number?: number;
  unread?: number;
  new_posts?: number;
  unread_posts?: number;
  pinned: boolean;
  unpinned: boolean | null;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  notification_level?: number;
  bookmarked?: boolean;
  liked?: boolean;
  tags?: string[];
  views: number;
  like_count: number;
  has_summary: boolean;
  last_poster_username: string;
  category_id: number;
  pinned_globally: boolean;
  featured_link: string | null;
  has_accepted_answer?: boolean;
  posters: Array<{
    extras: string | null;
    description: string;
    user_id: number;
    primary_group_id: number | null;
    flair_group_id: number | null;
  }>;
}

// Export singleton instance for VEX Forum
export const vexForumClient = new DiscourseClient("https://www.vexforum.com");
