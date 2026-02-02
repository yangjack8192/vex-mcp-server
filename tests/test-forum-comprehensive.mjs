/**
 * Comprehensive test script for VEX Forum tools
 */

import { ForumHandlers } from "../build/handlers/forum-handlers.js";

// Helper to add delay between tests to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to check if response contains actual data (not error)
function isSuccessResponse(result) {
  const text = result?.content?.[0]?.text || "";
  return text && !text.startsWith("Error ");
}

async function runTests() {
  console.log("=".repeat(70));
  console.log("VEX Forum Tools - Comprehensive Test Suite");
  console.log("=".repeat(70));
  console.log("Testing all 6 forum tools with real API calls...\n");

  let passed = 0;
  let failed = 0;
  const results = [];

  // Test 1: Search Forum
  console.log("[1/6] search-forum");
  console.log("     Query: 'PID tuning'");
  try {
    const result = await ForumHandlers.handleSearchForum({
      query: "PID tuning",
      max_results: 5,
    });
    if (isSuccessResponse(result)) {
      console.log("     ✓ PASSED");
      console.log("     Response preview:");
      console.log("     " + result.content[0].text.split("\n").slice(0, 5).join("\n     "));
      passed++;
      results.push({ test: "search-forum", status: "passed" });
    } else {
      throw new Error(result.content[0]?.text || "No response");
    }
  } catch (e) {
    console.log("     ✗ FAILED:", e.message);
    failed++;
    results.push({ test: "search-forum", status: "failed", error: e.message });
  }

  await delay(2000); // Wait to avoid rate limiting

  // Test 2: Get Forum Topic
  console.log("\n[2/6] get-forum-topic");
  console.log("     Topic ID: 76173 (LCD screen autonomous code issue)");
  try {
    const result = await ForumHandlers.handleGetForumTopic({
      topic_id: 76173,
      max_posts: 3,
    });
    if (isSuccessResponse(result)) {
      console.log("     ✓ PASSED");
      console.log("     Response preview:");
      console.log("     " + result.content[0].text.split("\n").slice(0, 6).join("\n     "));
      passed++;
      results.push({ test: "get-forum-topic", status: "passed" });
    } else {
      throw new Error(result.content[0]?.text || "No response");
    }
  } catch (e) {
    console.log("     ✗ FAILED:", e.message);
    failed++;
    results.push({ test: "get-forum-topic", status: "failed", error: e.message });
  }

  await delay(2000);

  // Test 3: Get Forum Post
  console.log("\n[3/6] get-forum-post");
  console.log("     Post ID: 358147");
  try {
    const result = await ForumHandlers.handleGetForumPost({
      post_id: 358147,
    });
    if (isSuccessResponse(result)) {
      console.log("     ✓ PASSED");
      console.log("     Response preview:");
      console.log("     " + result.content[0].text.split("\n").slice(0, 6).join("\n     "));
      passed++;
      results.push({ test: "get-forum-post", status: "passed" });
    } else {
      throw new Error(result.content[0]?.text || "No response");
    }
  } catch (e) {
    console.log("     ✗ FAILED:", e.message);
    failed++;
    results.push({ test: "get-forum-post", status: "failed", error: e.message });
  }

  await delay(2000);

  // Test 4: Get Forum User
  console.log("\n[4/6] get-forum-user");
  console.log("     Username: jpearman (well-known community member)");
  try {
    const result = await ForumHandlers.handleGetForumUser({
      username: "jpearman",
    });
    if (isSuccessResponse(result)) {
      console.log("     ✓ PASSED");
      console.log("     Response preview:");
      console.log("     " + result.content[0].text.split("\n").slice(0, 8).join("\n     "));
      passed++;
      results.push({ test: "get-forum-user", status: "passed" });
    } else {
      throw new Error(result.content[0]?.text || "No response");
    }
  } catch (e) {
    console.log("     ✗ FAILED:", e.message);
    failed++;
    results.push({ test: "get-forum-user", status: "failed", error: e.message });
  }

  await delay(2000);

  // Test 5: List Forum Categories
  console.log("\n[5/6] list-forum-categories");
  try {
    const result = await ForumHandlers.handleListForumCategories({});
    if (isSuccessResponse(result)) {
      console.log("     ✓ PASSED");
      console.log("     Response preview:");
      console.log("     " + result.content[0].text.split("\n").slice(0, 8).join("\n     "));
      passed++;
      results.push({ test: "list-forum-categories", status: "passed" });
    } else {
      throw new Error(result.content[0]?.text || "No response");
    }
  } catch (e) {
    console.log("     ✗ FAILED:", e.message);
    failed++;
    results.push({ test: "list-forum-categories", status: "failed", error: e.message });
  }

  await delay(2000);

  // Test 6: Get Latest Forum Topics
  console.log("\n[6/6] get-latest-forum-topics");
  try {
    const result = await ForumHandlers.handleGetLatestForumTopics({
      max_results: 5,
    });
    if (isSuccessResponse(result)) {
      console.log("     ✓ PASSED");
      console.log("     Response preview:");
      console.log("     " + result.content[0].text.split("\n").slice(0, 6).join("\n     "));
      passed++;
      results.push({ test: "get-latest-forum-topics", status: "passed" });
    } else {
      throw new Error(result.content[0]?.text || "No response");
    }
  } catch (e) {
    console.log("     ✗ FAILED:", e.message);
    failed++;
    results.push({ test: "get-latest-forum-topics", status: "failed", error: e.message });
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("TEST RESULTS SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total: ${passed + failed} tests`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  console.log("");

  if (failed > 0) {
    console.log("Failed tests:");
    results.filter((r) => r.status === "failed").forEach((r) => {
      console.log(`  - ${r.test}: ${r.error}`);
    });
  }

  console.log("=".repeat(70));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("Test suite error:", e);
  process.exit(1);
});
