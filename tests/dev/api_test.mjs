#!/usr/bin/env node

/**
 * Quick API-only test to verify token and direct API functionality
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🚀 API Test - Testing Direct RobotEvents API Calls');
console.log('='.repeat(60));

// Read token from .env file
let token;
try {
    const envContent = readFileSync('.env', 'utf8');
    const tokenMatch = envContent.match(/ROBOTEVENTS_TOKEN\s*=\s*(.+)/);
    if (tokenMatch) {
        token = tokenMatch[1].trim();
        console.log('✅ Token loaded from .env file (length:', token.length, 'chars)');
    }
} catch (error) {
    console.log('❌ Could not read .env file:', error.message);
    process.exit(1);
}

if (!token || token === 'your_token_here_please_replace') {
    console.log('❌ Token not properly set');
    process.exit(1);
}

console.log('\n📋 Testing direct API search only...\n');

// Test direct API search (bypass web search)
const request = {
    "jsonrpc": "2.0", 
    "id": 1, 
    "method": "tools/call",
    "params": {
        "name": "search-events", 
        "arguments": {
            "program": "VRC",
            "season": 175  // Current season
        }
    }
};

const serverProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
        ...process.env,
        ROBOTEVENTS_TOKEN: token
    }
});

let output = '';
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
    output += data.toString();
});

serverProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    
    // Show API-related debug output
    if (text.includes('[DEBUG]') && (
        text.includes('API') || 
        text.includes('SUCCESS') ||
        text.includes('FAILED') ||
        text.includes('authentication')
    )) {
        console.log('🐛', text.trim());
    }
});

serverProcess.on('close', (code) => {
    console.log('\n📊 Final Response:');
    if (output.trim()) {
        try {
            const response = JSON.parse(output.trim());
            if (response.result && response.result.content) {
                const text = response.result.content[0].text;
                if (text.includes('📊 Found') && text.includes('direct API')) {
                    console.log('🎯 SUCCESS: Direct API search worked!');
                    console.log('Found events via API:', text.split('Found ')[1].split(' events')[0]);
                    console.log('Preview:', text.substring(0, 300) + '...');
                } else if (text.includes('🔍 Found') && text.includes('web search')) {
                    console.log('🔄 HYBRID: Web search + API worked!');
                    console.log('Found events via hybrid approach:', text.split('Found ')[1].split(' events')[0]);
                } else {
                    console.log('⚠️ NO RESULTS: Search completed but no events found');
                    console.log('Response:', text.substring(0, 200) + '...');
                }
            } else if (response.error) {
                console.log('❌ ERROR:', response.error.message);
            }
        } catch (parseError) {
            console.log('❌ JSON PARSE ERROR:', parseError.message);
            console.log('Raw output:', output.trim());
        }
    }
    
    console.log('\n🎯 API Test completed with exit code:', code);
});

// Send the request
serverProcess.stdin.write(JSON.stringify(request) + '\n');
serverProcess.stdin.end();

// Longer timeout for API calls
setTimeout(() => {
    console.log('\n⏰ Test timeout after 60s - killing process');
    serverProcess.kill();
}, 60000);