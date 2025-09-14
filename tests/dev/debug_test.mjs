#!/usr/bin/env node

/**
 * Debug test script that reads from .env file
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Debug Test - Reading Token and Testing Search');
console.log('='.repeat(60));

// Read token from .env file or environment
let token = process.env.ROBOTEVENTS_TOKEN;

if (!token) {
    try {
        const envContent = readFileSync('.env', 'utf8');
        const tokenMatch = envContent.match(/ROBOTEVENTS_TOKEN\s*=\s*(.+)/);
        if (tokenMatch) {
            token = tokenMatch[1].trim();
            console.log('✅ Token loaded from .env file (length:', token.length, 'chars)');
        }
    } catch (error) {
        console.log('❌ Could not read .env file:', error.message);
    }
}

if (!token || token === 'your_token_here_please_replace') {
    console.log('❌ ROBOTEVENTS_TOKEN not found or not set properly');
    console.log('Please put your real token in the .env file');
    process.exit(1);
} else if (token.length < 10) {
    console.log('❌ Token seems too short (length:', token.length, ')');
    console.log('Please check your token in the .env file');
    process.exit(1);
} else {
    console.log('✅ ROBOTEVENTS_TOKEN is ready (length:', token.length, 'chars)');
}

console.log('\n📋 Testing simple VRC search...\n');

const request = {
    "jsonrpc": "2.0", 
    "id": 1, 
    "method": "tools/call",
    "params": {
        "name": "search-events", 
        "arguments": {"program": "VRC"}
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
    
    // Show real-time debug output
    if (text.includes('[DEBUG]') || text.includes('[ERROR]')) {
        console.log('🐛', text.trim());
    }
});

serverProcess.on('close', (code) => {
    console.log('\n📊 Final Response:');
    if (output.trim()) {
        try {
            const response = JSON.parse(output.trim());
            if (response.result && response.result.content) {
                console.log('✅ SUCCESS:', response.result.content[0].text.substring(0, 200) + '...');
            } else if (response.error) {
                console.log('❌ ERROR:', response.error.message);
            }
        } catch (e) {
            console.log('Raw output:', output.trim());
        }
    }
    
    console.log('\n🎯 Test completed with exit code:', code);
});

// Send the request
serverProcess.stdin.write(JSON.stringify(request) + '\n');
serverProcess.stdin.end();

// Timeout after 30 seconds
setTimeout(() => {
    console.log('\n⏰ Test timeout - killing process');
    serverProcess.kill();
}, 30000);