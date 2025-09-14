// Test script for RobotEvents API
// Usage: ROBOTEVENTS_TOKEN=your_token node test_api.mjs
// Or modify the token directly in this file

import * as robotevents from 'robotevents';

async function testRobotEventsAPI() {
    console.log('🚀 Testing RobotEvents API...\n');
    
    // Set your token here or use environment variable
    const token = process.env.ROBOTEVENTS_TOKEN || 'YOUR_TOKEN_HERE';
    
    if (token === 'YOUR_TOKEN_HERE') {
        console.log('⚠️  Please set ROBOTEVENTS_TOKEN environment variable or modify this script');
        console.log('   Example: ROBOTEVENTS_TOKEN=your_token node test_api.mjs\n');
    }
    
    try {
        robotevents.authentication.setBearer(token);
        console.log('✅ Authentication set successfully\n');
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        return;
    }
    
    // Test 1: Basic search with no parameters
    console.log('📝 Test 1: Basic events search (no parameters)');
    try {
        const events = await robotevents.events.search({});
        console.log(`✅ Success: Found ${events.length} events`);
        if (events.length > 0) {
            console.log('📋 Sample event structure:', JSON.stringify(events[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Failed:', error.message);
        console.error('📋 Full error:', error);
    }
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Search with program parameter (different formats)
    console.log('📝 Test 2: Program parameter testing');
    const programFormats = [
        { program: [1] },           // Array format
        { program: 1 },             // Single value
        { 'program[]': [1] },       // Array notation
    ];
    
    for (let i = 0; i < programFormats.length; i++) {
        try {
            console.log(`   Testing format ${i + 1}: ${JSON.stringify(programFormats[i])}`);
            const events = await robotevents.events.search(programFormats[i]);
            console.log(`   ✅ Success: Found ${events.length} events`);
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
    }
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Search with SKU parameter (different formats)
    console.log('📝 Test 3: SKU parameter testing');
    const skuFormats = [
        { sku: ['RE-VRC-24-0001'] },    // Array format (likely invalid SKU)
        { sku: 'RE-VRC-24-0001' },      // String format
        { 'sku[]': ['RE-VRC-24-0001'] }, // Array notation
    ];
    
    for (let i = 0; i < skuFormats.length; i++) {
        try {
            console.log(`   Testing format ${i + 1}: ${JSON.stringify(skuFormats[i])}`);
            const events = await robotevents.events.search(skuFormats[i]);
            console.log(`   ✅ Success: Found ${events.length} events`);
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
    }
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Location parameter testing
    console.log('📝 Test 4: Location parameter testing');
    const locationFormats = [
        { 'location.city': 'California' },          // Dot notation
        { location: { city: 'California' } },       // Object notation
        { city: 'California' },                     // Direct field
    ];
    
    for (let i = 0; i < locationFormats.length; i++) {
        try {
            console.log(`   Testing format ${i + 1}: ${JSON.stringify(locationFormats[i])}`);
            const events = await robotevents.events.search(locationFormats[i]);
            console.log(`   ✅ Success: Found ${events.length} events`);
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
    }
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 5: Season parameter testing
    console.log('📝 Test 5: Season parameter testing');
    const seasonFormats = [
        { season: [181] },              // Array format (2023-2024 season)
        { season: 181 },                // Single value
        { 'season[]': [181] },          // Array notation
    ];
    
    for (let i = 0; i < seasonFormats.length; i++) {
        try {
            console.log(`   Testing format ${i + 1}: ${JSON.stringify(seasonFormats[i])}`);
            const events = await robotevents.events.search(seasonFormats[i]);
            console.log(`   ✅ Success: Found ${events.length} events`);
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
    }
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 6: Name search
    console.log('📝 Test 6: Event name search testing');
    try {
        const events = await robotevents.events.search({ name: 'State' });
        console.log(`✅ Success: Found ${events.length} events with 'State' in name`);
        if (events.length > 0) {
            console.log('📋 First few events:');
            events.slice(0, 3).forEach((event, i) => {
                console.log(`   ${i + 1}. ${event.name} (${event.sku})`);
            });
        }
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 7: Combined parameters
    console.log('📝 Test 7: Combined parameters testing');
    try {
        const params = {
            program: [1],  // VRC
            name: 'Championship'
        };
        console.log(`   Testing: ${JSON.stringify(params)}`);
        const events = await robotevents.events.search(params);
        console.log(`✅ Success: Found ${events.length} VRC Championship events`);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    
    console.log('\n🏁 API testing complete!');
    console.log('\n💡 Use the successful parameter formats in your MCP server implementation.');
}

// Run the test
testRobotEventsAPI().catch(console.error);