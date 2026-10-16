#!/usr/bin/env node
/**
 * ANS Music Partner API Sandbox Smoke Test
 * Tests credentials, scopes, release listing, channel listing, and environment status.
 */
const https = require('https');
const path = require('path');
const fs = require('fs');

// Zero-dependency .env parser
const envPath = path.resolve(__dirname, '../api/.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value.trim();
    }
  });
}

const API_KEY = process.env.ANS_MUSIC_API_KEY || 'ans_test_4cfc31c23807b5010539a68f2bd57c0e8d807337458cd40e';
const BASE_URL = process.env.ANS_MUSIC_API_URL || 'https://server.ansmusic.io/partner';

console.log('🎵 [ANS Music Smoke Test] Initializing live test against upstream provider...');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🔑 Key prefix: ${API_KEY.substring(0, 12)}... (len: ${API_KEY.length})`);

function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  try {
    // 1. Partner Profile & Identity Check
    console.log('\n--- 1. Testing GET /partner/me ---');
    const me = await request('/me');
    if (me.status !== 200) {
      throw new Error(`Failed /me test with status ${me.status}: ${JSON.stringify(me.data || me.raw)}`);
    }
    console.log('✅ Identity Verified:');
    console.log(`   - Company:      ${me.data.data.company}`);
    console.log(`   - Environment:  ${me.data.data.environment}`);
    console.log(`   - Scopes:       ${me.data.data.scopes.join(', ')}`);
    console.log(`   - Linked User:  ${me.data.data.linkedAccount.name} (${me.data.data.linkedAccount.id})`);
    console.log(`   - Webhook URL:  ${me.data.data.webhookUrl || 'Not configured yet (configured via RMIT central)'}`);

    // 2. Releases Query Check
    console.log('\n--- 2. Testing GET /partner/releases ---');
    const releases = await request('/releases');
    if (releases.status !== 200) {
      throw new Error(`Failed /releases test with status ${releases.status}: ${JSON.stringify(releases.data || releases.raw)}`);
    }
    console.log('✅ Releases Endpoint Active:');
    console.log(`   - Total Releases: ${releases.data.data.total}`);
    console.log(`   - Page / Limit:   ${releases.data.data.page} / ${releases.data.data.limit}`);

    // 3. Channels Query Check
    console.log('\n--- 3. Testing GET /partner/channels ---');
    const channels = await request('/channels');
    if (channels.status !== 200) {
      throw new Error(`Failed /channels test with status ${channels.status}: ${JSON.stringify(channels.data || channels.raw)}`);
    }
    console.log('✅ Channels Endpoint Active:');
    console.log(`   - Active VEVO/YouTube Channels: ${channels.data.data.channels.length}`);

    console.log('\n🎉 [ANS Music Smoke Test] ALL CHECKS PASSED SUCCESSFULLY (3/3 Endpoints Operational)!');
  } catch (error) {
    console.error('❌ [ANS Music Smoke Test Failed]:', error.message);
    process.exit(1);
  }
}

run();
