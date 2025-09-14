#!/usr/bin/env node

/**
 * Test script to explore robotevents rankings and skills API
 */

import * as robotevents from 'robotevents';

async function testRankingsAPI() {
  console.log('🔍 Testing RobotEvents Rankings and Skills API');
  console.log('='.repeat(60));

  try {
    // Test 1: Get event object
    console.log('\n📋 Test 1: Getting Event 60374 (明德启智杯 VRC高中组)');
    const event = await robotevents.events.get(60374);
    
    if (!event) {
      console.log('❌ Event not found');
      return;
    }
    
    console.log('✅ Event found:', event.name);
    console.log('Divisions:', event.divisions.map(d => `${d.id}: ${d.name}`));
    
    // Test 2: Get rankings for first division
    if (event.divisions.length > 0) {
      const divisionId = event.divisions[0].id;
      console.log(`\n📊 Test 2: Getting rankings for division ${divisionId}`);
      
      try {
        const rankings = await event.rankings(divisionId);
        console.log('✅ Rankings retrieved, count:', rankings.length);
        
        // Show first few rankings
        for (let i = 0; i < Math.min(3, rankings.length); i++) {
          const rank = rankings[i];
          console.log(`  ${rank.rank}. Team ${rank.team.name} - WP:${rank.wp} AP:${rank.ap} SP:${rank.sp}`);
        }
      } catch (error) {
        console.log('❌ Rankings error:', error.message);
      }
    }
    
    // Test 3: Get skills data
    console.log(`\n🎯 Test 3: Getting skills data for event`);
    try {
      const skills = await event.skills();
      console.log('✅ Skills retrieved, count:', skills.length);
      
      // Show first few skills
      for (let i = 0; i < Math.min(3, skills.length); i++) {
        const skill = skills[i];
        console.log(`  Rank ${skill.rank}: Team ${skill.team.name} - ${skill.type}: ${skill.score}`);
      }
    } catch (error) {
      console.log('❌ Skills error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Main error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test if token is available
if (process.env.ROBOTEVENTS_TOKEN) {
  testRankingsAPI();
} else {
  console.log('❌ ROBOTEVENTS_TOKEN not set. Please set it as an environment variable.');
}