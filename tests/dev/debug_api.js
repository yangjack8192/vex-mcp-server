// Debug script to test robotevents API directly
const robotevents = require('robotevents');

async function testAPI() {
    console.log('Testing RobotEvents API...');
    
    // Test authentication first
    const token = process.env.ROBOTEVENTS_TOKEN;
    if (!token) {
        console.error('❌ No ROBOTEVENTS_TOKEN environment variable found');
        return;
    }
    
    try {
        robotevents.authentication.setBearer(token);
        console.log('✅ Authentication set successfully');
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        return;
    }
    
    // Test basic events search with no parameters
    console.log('\n🔍 Testing basic events search...');
    try {
        const events = await robotevents.events.search({});
        console.log(`✅ Basic search successful: Found ${events.length} events`);
        if (events.length > 0) {
            console.log('First event structure:', JSON.stringify(events[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Basic search failed:', error.message);
        console.error('Full error:', error);
    }
    
    // Test search with different parameter formats
    console.log('\n🔍 Testing search with program parameter (array format)...');
    try {
        const events = await robotevents.events.search({ program: [1] }); // VRC
        console.log(`✅ Program array search successful: Found ${events.length} VRC events`);
    } catch (error) {
        console.error('❌ Program array search failed:', error.message);
    }
    
    console.log('\n🔍 Testing search with sku parameter (array format)...');
    try {
        const events = await robotevents.events.search({ sku: ['RE-VRC-24-0001'] }); // Example SKU
        console.log(`✅ SKU array search successful: Found ${events.length} events`);
    } catch (error) {
        console.error('❌ SKU array search failed:', error.message);
        console.error('This is expected if the SKU doesn\'t exist');
    }
    
    // Test location search formats
    console.log('\n🔍 Testing location search formats...');
    try {
        // Try different location parameter formats
        const locationFormats = [
            { 'location.city': 'California' },
            { location: { city: 'California' } },
            { city: 'California' },
        ];
        
        for (let i = 0; i < locationFormats.length; i++) {
            try {
                const events = await robotevents.events.search(locationFormats[i]);
                console.log(`✅ Location format ${i + 1} successful: Found ${events.length} events`);
                console.log(`   Format: ${JSON.stringify(locationFormats[i])}`);
            } catch (error) {
                console.log(`❌ Location format ${i + 1} failed: ${error.message}`);
            }
        }
    } catch (error) {
        console.error('❌ Location search test failed:', error.message);
    }
    
    // Check available search options
    console.log('\n📋 Checking available methods...');
    console.log('robotevents.events methods:', Object.keys(robotevents.events));
    console.log('robotevents.teams methods:', Object.keys(robotevents.teams));
    
    console.log('\n✅ API debugging complete');
}

testAPI().catch(console.error);