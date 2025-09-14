#!/usr/bin/env node

/**
 * Test script for hybrid search functionality
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testHybridSearch() {
    console.log('🧪 Testing Hybrid Search Implementation...\n');
    
    // Start server
    const serverProcess = spawn('node', ['build/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
            ...process.env,
            ROBOTEVENTS_TOKEN: process.env.ROBOTEVENTS_TOKEN || 'test-token'
        }
    });
    
    let serverOutput = '';
    serverProcess.stderr.on('data', (data) => {
        const message = data.toString();
        serverOutput += message;
        if (message.includes('[DEBUG]') || message.includes('[ERROR]')) {
            console.log('📋 Server:', message.trim());
        }
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Connect client
    const transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin
    });
    
    const client = new Client({
        name: "hybrid-search-test",
        version: "1.0.0"
    }, { capabilities: {} });
    
    try {
        await client.connect(transport);
        console.log('✅ Client connected\n');
        
        // Test case 1: Chinese event name + location
        console.log('🧪 Test 1: Chinese event name + location');
        console.log('Parameters: {name: "明德启智", location: "中国"}');
        try {
            const result = await client.callTool({ 
                name: 'search-events', 
                arguments: { name: '明德启智', location: '中国' } 
            });
            
            if (result.content && result.content[0]) {
                const text = result.content[0].text;
                console.log('✅ Result received:');
                console.log(text.substring(0, 200) + '...\n');
                
                // Check if it's using hybrid search
                if (text.includes('🔍 Found') && text.includes('web search')) {
                    console.log('🎯 SUCCESS: Hybrid web search working!');
                } else if (text.includes('📊 Found') && text.includes('direct API')) {
                    console.log('🔄 FALLBACK: Direct API search used');
                } else {
                    console.log('❌ No results or error occurred');
                }
            } else {
                console.log('❌ No content in response');
            }
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
        
        console.log('\n' + '='.repeat(50));
        
        // Test case 2: English search
        console.log('🧪 Test 2: English event search');
        console.log('Parameters: {name: "State Championship", location: "California"}');
        try {
            const result = await client.callTool({ 
                name: 'search-events', 
                arguments: { name: 'State Championship', location: 'California' } 
            });
            
            if (result.content && result.content[0]) {
                const text = result.content[0].text;
                console.log('✅ Result received:');
                console.log(text.substring(0, 200) + '...\n');
                
                if (text.includes('🔍 Found')) {
                    console.log('🎯 SUCCESS: Hybrid search found results!');
                } else if (text.includes('📊 Found')) {
                    console.log('🔄 FALLBACK: API search found results');
                } else {
                    console.log('❌ No results found');
                }
            }
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
        
        console.log('\n' + '='.repeat(50));
        
        // Test case 3: Empty parameters
        console.log('🧪 Test 3: Empty parameters (should not crash)');
        console.log('Parameters: {}');
        try {
            const result = await client.callTool({ 
                name: 'search-events', 
                arguments: {} 
            });
            
            if (result.content && result.content[0]) {
                console.log('✅ No crash - handled gracefully');
                console.log('Response type:', result.content[0].text.includes('❌') ? 'Error (expected)' : 'Success');
            }
        } catch (error) {
            console.error('❌ Crashed with empty params:', error.message);
        }
        
    } finally {
        await client.close();
        serverProcess.kill();
        
        // Show debug output summary
        console.log('\n📊 Debug Output Analysis:');
        if (serverOutput.includes('Web searching for:')) {
            console.log('✅ Web search attempted');
        } else {
            console.log('❌ No web search detected');
        }
        
        if (serverOutput.includes('Found') && serverOutput.includes('robotevents URLs')) {
            console.log('✅ URL extraction worked');
        } else {
            console.log('❌ URL extraction may have failed');
        }
        
        if (serverOutput.includes('Successfully retrieved event')) {
            console.log('✅ Event retrieval worked');
        } else {
            console.log('❌ Event retrieval may have failed');
        }
    }
    
    console.log('\n🎯 Hybrid Search Test Complete!');
    console.log('The new implementation should handle:');
    console.log('- Chinese/international event names ✓');
    console.log('- Fallback to direct API when web search fails ✓'); 
    console.log('- Graceful error handling ✓');
    console.log('- Detailed debugging information ✓');
}

testHybridSearch().catch(console.error);