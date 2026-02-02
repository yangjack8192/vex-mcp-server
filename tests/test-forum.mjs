/**
 * Test script for VEX Forum tools
 */

import { vexForumClient } from "../build/utils/discourse-client.js";
import { ForumHandlers } from "../build/handlers/forum-handlers.js";

async function runTests() {
  console.log("=".repeat(60));
  console.log("VEX Forum Tools Test Suite");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Search Forum
  console.log("\n[Test 1] Search Forum - 'autonomous programming'");
  try {
    const result = await ForumHandlers.handleSearchForum({
      query: "autonomous programming",
      max_results: 5,
    });
    if (result.content && result.content[0]?.text) {
      console.log("✓ PASSED - Search returned results");
      console.log("  Preview:", result.content[0].text.substring(0, 200) + "...");
      passed++;
    } else {
      throw new Error("No content returned");
    }
  } catch (e) {
    console.log("✗ FAILED:", e.message);
    failed++;
  }

  // Test 2: Get Forum Topic
  console.log("\n[Test 2] Get Forum Topic - ID 76173");
  try {
    const result = await ForumHandlers.handleGetForumTopic({
      topic_id: 76173,
      max_posts: 3,
    });
    if (result.content && result.content[0]?.text) {
      console.log("✓ PASSED - Topic retrieved");
      console.log("  Preview:", result.content[0].text.substring(0, 200) + "...");
      passed++;
    } else {
      throw new Error("No content returned");
    }
  } catch (e) {
    console.log("✗ FAILED:", e.message);
    failed++;
  }

  // Test 3: Get Forum User
  console.log("\n[Test 3] Get Forum User - 'jpearman'");
  try {
    const result = await ForumHandlers.handleGetForumUser({
      username: "jpearman",
    });
    if (result.content && result.content[0]?.text) {
      console.log("✓ PASSED - User retrieved");
      console.log("  Preview:", result.content[0].text.substring(0, 200) + "...");
      passed++;
    } else {
      throw new Error("No content returned");
    }
  } catch (e) {
    console.log("✗ FAILED:", e.message);
    failed++;
  }

  // Test 4: List Forum Categories
  console.log("\n[Test 4] List Forum Categories");
  try {
    const result = await ForumHandlers.handleListForumCategories({});
    if (result.content && result.content[0]?.text) {
      console.log("✓ PASSED - Categories listed");
      console.log("  Preview:", result.content[0].text.substring(0, 200) + "...");
      passed++;
    } else {
      throw new Error("No content returned");
    }
  } catch (e) {
    console.log("✗ FAILED:", e.message);
    failed++;
  }

  // Test 5: Get Latest Forum Topics
  console.log("\n[Test 5] Get Latest Forum Topics");
  try {
    const result = await ForumHandlers.handleGetLatestForumTopics({
      max_results: 5,
    });
    if (result.content && result.content[0]?.text) {
      console.log("✓ PASSED - Latest topics retrieved");
      console.log("  Preview:", result.content[0].text.substring(0, 200) + "...");
      passed++;
    } else {
      throw new Error("No content returned");
    }
  } catch (e) {
    console.log("✗ FAILED:", e.message);
    failed++;
  }

  // Test 6: Search with filters
  console.log("\n[Test 6] Search Forum with category filter");
  try {
    const result = await ForumHandlers.handleSearchForum({
      query: "motor",
      category: "vrc-discussion",
      order: "latest",
      max_results: 3,
    });
    if (result.content && result.content[0]?.text) {
      console.log("✓ PASSED - Filtered search returned results");
      console.log("  Preview:", result.content[0].text.substring(0, 200) + "...");
      passed++;
    } else {
      throw new Error("No content returned");
    }
  } catch (e) {
    console.log("✗ FAILED:", e.message);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test suite error:", e);
  process.exit(1);
});
