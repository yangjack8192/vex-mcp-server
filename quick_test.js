#!/usr/bin/env node

/**
 * Quick test script for VEX MCP Server debugging
 * This script uses the built-in echo mechanism to test the server directly
 */

import { spawn } from 'child_process';

async function quickTest() {
    console.log('🔧 Quick Test for VEX MCP Server Improvements');
    console.log('============================================\n');
    
    // Test cases
    const testCases = [
        {
            name: 'World Championship Search',
            params: { name: 'World Championship' }
        },
        {
            name: 'Chinese Event Search', 
            params: { name: '明德启智', location: '中国' }
        },
        {
            name: 'State Championship Search',
            params: { name: 'State Championship', location: 'California', program: 'VRC' }
        },
        {
            name: 'Empty Parameters Test',
            params: {}
        }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n📋 Test ${i + 1}: ${testCase.name}`);
        console.log(`Parameters: ${JSON.stringify(testCase.params)}`);
        console.log('---');
        
        // Create the JSON-RPC request
        const request = {
            "jsonrpc": "2.0",
            "id": i + 1,
            "method": "tools/call",
            "params": {
                "name": "search-events",
                "arguments": testCase.params
            }
        };
        
        try {
            // Run the server with this request
            const result = await runServerTest(JSON.stringify(request));
            
            // Parse and analyze the result
            const lines = result.split('\n');
            const jsonLine = lines.find(line => line.startsWith('{"'));
            
            if (jsonLine) {
                try {
                    const response = JSON.parse(jsonLine);
                    if (response.result && response.result.content) {
                        const text = response.result.content[0].text;
                        console.log('✅ SUCCESS: Got response');
                        
                        // Analyze the response type
                        if (text.includes('🔍 Found') && text.includes('web search')) {
                            console.log('🎯 HYBRID SEARCH SUCCESS: Found events via web search + API');
                        } else if (text.includes('📊 Found') && text.includes('direct API')) {
                            console.log('🎯 API SEARCH SUCCESS: Found events via direct API');
                        } else if (text.includes('❌ Unable to find')) {
                            console.log('⚠️  NO RESULTS: Both search approaches failed (expected for some tests)');
                        } else {
                            console.log('🤔 UNKNOWN: Got unexpected response format');
                        }
                        
                        // Show first 150 chars of response
                        console.log(`📄 Response preview: ${text.substring(0, 150)}...`);
                    } else if (response.error) {
                        console.log('❌ ERROR:', response.error.message);
                    }
                } catch (parseError) {
                    console.log('❌ JSON PARSE ERROR:', parseError.message);
                }
            } else {
                console.log('❌ NO JSON RESPONSE FOUND');
            }
            
        } catch (error) {
            console.log('❌ TEST FAILED:', error.message);
        }
        
        // Brief pause between tests
        if (i < testCases.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n🎯 Quick Test Complete!');
    console.log('\nKey improvements implemented:');
    console.log('• Enhanced debug logging for step-by-step tracing');
    console.log('• Multiple search engine strategies (DuckDuckGo, Bing, Google)');
    console.log('• Improved URL extraction with 10+ regex patterns');
    console.log('• Advanced Event ID extraction with validation');
    console.log('• API retry mechanisms and timeout handling');
    console.log('• Better error classification and handling');
}

function runServerTest(jsonRequest) {
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('node', ['build/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env,
                ROBOTEVENTS_TOKEN: process.env.ROBOTEVENTS_TOKEN || 'test-token'
            }
        });
        
        let output = '';
        let errorOutput = '';
        
        serverProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        serverProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        serverProcess.on('error', reject);
        
        serverProcess.on('close', () => {
            // Print debug output for analysis
            if (errorOutput.includes('[DEBUG]')) {
                console.log('🐛 Debug trace available (showing key points):');
                const debugLines = errorOutput.split('\n')
                    .filter(line => line.includes('[DEBUG]') && 
                           (line.includes('SUCCESS') || line.includes('FAILED') || 
                            line.includes('COMPLETED') || line.includes('STARTING')))
                    .slice(0, 8); // Show max 8 key debug lines
                
                debugLines.forEach(line => {
                    console.log(`   ${line.trim()}`);
                });
                
                if (debugLines.length === 8) {
                    console.log('   ... (truncated, see full output for details)');
                }
            }
            
            resolve(output + '\n' + errorOutput);
        });
        
        // Send the JSON request
        serverProcess.stdin.write(jsonRequest + '\n');
        serverProcess.stdin.end();
        
        // Set timeout
        setTimeout(() => {
            serverProcess.kill();
            reject(new Error('Test timeout'));
        }, 30000); // 30s timeout per test
    });
}

// Run the quick test
quickTest().catch(console.error);