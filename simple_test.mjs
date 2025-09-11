#!/usr/bin/env node

/**
 * Simple test to verify search-events fix
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testSearchEventsFix() {
    console.log('🔧 Testing search-events fix...\n');
    
    // Start server
    const serverProcess = spawn('node', ['build/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
            ...process.env,
            ROBOTEVENTS_TOKEN: process.env.ROBOTEVENTS_TOKEN || 'test-token'
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
        name: "test-client",
        version: "1.0.0"
    }, { capabilities: {} });
    
    try {
        await client.connect(transport);
        console.log('✅ Client connected');
        
        // Test 1: search-events with no parameters (this was crashing before)
        console.log('\n🧪 Test 1: search-events (no parameters)');
        try {
            const result = await client.callTool({ 
                name: 'search-events', 
                arguments: {} 
            });
            console.log('✅ SUCCESS: No crash!');
            console.log('📄 Response type:', typeof result);
            if (result.content && result.content[0]) {
                const text = result.content[0].text;
                if (text.includes('❌ Error')) {
                    console.log('📋 Expected API error:', text.split('\n')[0]);
                } else {
                    console.log('📋 Data received:', text.substring(0, 100) + '...');
                }
            }
        } catch (error) {
            console.error('❌ FAILED:', error.message);
        }
        
        // Test 2: search-events with parameters
        console.log('\n🧪 Test 2: search-events (with name parameter)');
        try {
            const result = await client.callTool({ 
                name: 'search-events', 
                arguments: { name: 'State' } 
            });
            console.log('✅ SUCCESS: With parameters!');
            if (result.content && result.content[0]) {
                const text = result.content[0].text;
                console.log('📋 Response:', text.substring(0, 100) + '...');
            }
        } catch (error) {
            console.error('❌ FAILED:', error.message);
        }
        
        // Test 3: List tools
        console.log('\n🧪 Test 3: List available tools');
        try {
            const tools = await client.listTools();
            console.log('✅ SUCCESS: Listed tools');
            console.log('📋 Available tools:', tools.tools.map(t => t.name).join(', '));
        } catch (error) {
            console.error('❌ FAILED:', error.message);
        }
        
    } finally {
        await client.close();
        serverProcess.kill();
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('The main fix was preventing "Cannot read properties of undefined (reading \'sku\')" crash');
    console.log('If no crashes occurred above, the fix is successful! ✅');
}

// Run test
testSearchEventsFix().catch(console.error);