#!/usr/bin/env node

/**
 * MCP Client Test Script for VEX Robotics Server
 * This script creates a simple MCP client to test our server directly
 * Usage: ROBOTEVENTS_TOKEN=your_token node test_mcp_client.mjs
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class MCPTestClient {
    constructor() {
        this.client = null;
        this.transport = null;
        this.serverProcess = null;
    }

    async startServer() {
        console.log('🚀 Starting VEX MCP Server...');
        
        const token = process.env.ROBOTEVENTS_TOKEN;
        if (!token || token === 'YOUR_TOKEN_HERE') {
            console.log('⚠️  Warning: No valid ROBOTEVENTS_TOKEN set');
            console.log('   Some tests may fail due to authentication');
        }

        // Start the server process
        this.serverProcess = spawn('node', ['build/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env, 
                ROBOTEVENTS_TOKEN: token || 'test-token',
                NODE_ENV: 'development'
            },
            cwd: process.cwd(),
            shell: false
        });

        // Handle server errors
        this.serverProcess.on('error', (error) => {
            console.error('❌ Failed to start server:', error.message);
            process.exit(1);
        });

        this.serverProcess.stderr.on('data', (data) => {
            const message = data.toString();
            // Only show our debug messages, filter out noise
            if (message.includes('[DEBUG]') || message.includes('[ERROR]') || message.includes('VEX MCP server')) {
                console.log('📋 Server:', message.trim());
            }
        });

        // Give server time to start
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Server started successfully');
    }

    async connectClient() {
        console.log('🔗 Connecting MCP client...');
        
        this.transport = new StdioClientTransport({
            reader: this.serverProcess.stdout,
            writer: this.serverProcess.stdin
        });

        this.client = new Client({
            name: "vex-mcp-test-client",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        await this.client.connect(this.transport);
        console.log('✅ Client connected successfully\\n');
    }

    async listTools() {
        console.log('📋 Listing available tools...');
        try {
            const tools = await this.client.listTools();
            console.log(`Found ${tools.tools.length} tools:`);
            tools.tools.forEach((tool, index) => {
                console.log(`${index + 1}. ${tool.name}: ${tool.description}`);
            });
            console.log('');
            return tools.tools;
        } catch (error) {
            console.error('❌ Failed to list tools:', error.message);
            return [];
        }
    }

    async testTool(toolName, args = {}) {
        console.log(`🧪 Testing tool: ${toolName}`);
        console.log(`   Arguments: ${JSON.stringify(args)}`);
        
        try {
            const startTime = Date.now();
            const result = await this.client.callTool({ name: toolName, arguments: args });
            const duration = Date.now() - startTime;
            
            console.log(`✅ Success (${duration}ms)`);
            console.log('📄 Result:');
            
            if (result.content && result.content.length > 0) {
                result.content.forEach((item, index) => {
                    if (item.type === 'text') {
                        const text = item.text.length > 200 ? 
                            item.text.substring(0, 200) + '...' : 
                            item.text;
                        console.log(`   Content ${index + 1}: ${text}`);
                    }
                });
            } else {
                console.log('   No content returned');
            }
            
            return { success: true, result, duration };
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async runTestSuite() {
        console.log('🎯 Running comprehensive test suite...\\n');
        
        const testResults = [];
        
        // Test 1: List tools
        console.log('='.repeat(60));
        const tools = await this.listTools();
        
        // Test 2: Search events (no parameters)
        console.log('='.repeat(60));
        const test1 = await this.testTool('search-events', {});
        testResults.push({ name: 'search-events (no params)', ...test1 });
        
        // Test 3: Search events with name
        console.log('\\n' + '='.repeat(60));
        const test2 = await this.testTool('search-events', { name: 'State' });
        testResults.push({ name: 'search-events (with name)', ...test2 });
        
        // Test 4: Search events with program
        console.log('\\n' + '='.repeat(60));
        const test3 = await this.testTool('search-events', { program: 'VRC' });
        testResults.push({ name: 'search-events (with program)', ...test3 });
        
        // Test 5: Search events with location
        console.log('\\n' + '='.repeat(60));
        const test4 = await this.testTool('search-events', { location: 'California' });
        testResults.push({ name: 'search-events (with location)', ...test4 });
        
        // Test 6: Search teams (no parameters)
        console.log('\\n' + '='.repeat(60));
        const test5 = await this.testTool('search-teams', {});
        testResults.push({ name: 'search-teams (no params)', ...test5 });
        
        // Test 7: Search teams with number
        console.log('\\n' + '='.repeat(60));
        const test6 = await this.testTool('search-teams', { number: '123A' });
        testResults.push({ name: 'search-teams (with number)', ...test6 });
        
        // Test 8: Get team info by number
        console.log('\\n' + '='.repeat(60));
        const test7 = await this.testTool('get-team-info', { team_number: '123A' });
        testResults.push({ name: 'get-team-info (by number)', ...test7 });
        
        // Print summary
        console.log('\\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        
        let passed = 0;
        let failed = 0;
        
        testResults.forEach(test => {
            const status = test.success ? '✅ PASS' : '❌ FAIL';
            const duration = test.duration ? `(${test.duration}ms)` : '';
            console.log(`${status} ${test.name} ${duration}`);
            if (!test.success && test.error) {
                console.log(`     Error: ${test.error}`);
            }
            test.success ? passed++ : failed++;
        });
        
        console.log('\\n' + '='.repeat(60));
        console.log(`🎯 Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(60));
        
        return testResults;
    }

    async interactiveMode() {
        console.log('\\n🎮 Entering interactive mode...');
        console.log('Available commands:');
        console.log('  list - List all tools');
        console.log('  test <tool-name> [args] - Test a specific tool');
        console.log('  suite - Run full test suite');
        console.log('  quit - Exit');
        console.log('');
        
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const askQuestion = (question) => {
            return new Promise((resolve) => {
                rl.question(question, resolve);
            });
        };
        
        while (true) {
            try {
                const input = await askQuestion('mcp-test> ');
                const [command, ...args] = input.trim().split(' ');
                
                switch (command) {
                    case 'quit':
                    case 'exit':
                        rl.close();
                        return;
                    
                    case 'list':
                        await this.listTools();
                        break;
                    
                    case 'suite':
                        await this.runTestSuite();
                        break;
                    
                    case 'test':
                        if (args.length === 0) {
                            console.log('Usage: test <tool-name> [json-args]');
                            break;
                        }
                        const toolName = args[0];
                        let testArgs = {};
                        if (args.length > 1) {
                            try {
                                testArgs = JSON.parse(args.slice(1).join(' '));
                            } catch {
                                console.log('Invalid JSON arguments');
                                break;
                            }
                        }
                        await this.testTool(toolName, testArgs);
                        break;
                    
                    default:
                        console.log('Unknown command. Type "quit" to exit.');
                }
            } catch (error) {
                console.error('Error:', error.message);
            }
        }
    }

    async cleanup() {
        console.log('\\n🧹 Cleaning up...');
        if (this.client) {
            await this.client.close();
        }
        if (this.serverProcess) {
            this.serverProcess.kill();
        }
        console.log('✅ Cleanup complete');
    }
}

// Main execution
async function main() {
    const testClient = new MCPTestClient();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await testClient.cleanup();
        process.exit(0);
    });
    
    try {
        await testClient.startServer();
        await testClient.connectClient();
        
        // Check command line arguments
        const args = process.argv.slice(2);
        if (args.includes('--suite')) {
            await testClient.runTestSuite();
        } else if (args.includes('--interactive')) {
            await testClient.interactiveMode();
        } else {
            // Default: run test suite then interactive mode
            await testClient.runTestSuite();
            await testClient.interactiveMode();
        }
        
    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    } finally {
        await testClient.cleanup();
    }
}

main();