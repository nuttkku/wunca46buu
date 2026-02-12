#!/usr/bin/env node
/**
 * list-devices.js
 * แสดงรายการอุปกรณ์ทั้งหมดที่ monitor บน LibreNMS
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from .env
const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

// Validate environment variables
if (!API_URL || !API_TOKEN) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please copy .env.example to .env and fill in your values');
  process.exit(1);
}

// HTTP headers
const headers = {
  'X-Auth-Token': API_TOKEN,
  'Content-Type': 'application/json'
};

/**
 * Get all devices
 */
async function getDevices() {
  try {
    const response = await axios.get(
      `${API_URL}/devices`,
      { headers }
    );
    return response.data.devices;
  } catch (error) {
    console.error('❌ Error fetching devices:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Display devices in a table format
 */
async function listDevices() {
  console.log('🔍 Fetching devices from LibreNMS...\n');

  const devices = await getDevices();

  if (devices.length === 0) {
    console.log('No devices found.');
    return;
  }

  console.log('=' .repeat(100));
  console.log('📋 LibreNMS Devices List');
  console.log('='.repeat(100));
  console.log(
    'ID'.padEnd(6) +
    'Hostname'.padEnd(20) +
    'Display Name'.padEnd(25) +
    'OS'.padEnd(15) +
    'Status'.padEnd(10) +
    'Uptime'
  );
  console.log('-'.repeat(100));

  devices.forEach(device => {
    const status = device.status === 1 ? '✅ UP' : '❌ DOWN';
    const uptime = formatUptime(device.uptime);

    console.log(
      String(device.device_id).padEnd(6) +
      (device.hostname || 'N/A').padEnd(20) +
      (device.display || 'N/A').padEnd(25) +
      (device.os || 'N/A').padEnd(15) +
      status.padEnd(10) +
      uptime
    );
  });

  console.log('='.repeat(100));
  console.log(`\nTotal devices: ${devices.length}`);
  console.log(`Up: ${devices.filter(d => d.status === 1).length}`);
  console.log(`Down: ${devices.filter(d => d.status === 0).length}`);
}

/**
 * Format uptime seconds to human-readable format
 */
function formatUptime(seconds) {
  if (!seconds || seconds < 0) return 'N/A';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '< 1m';
}

// Run the list
listDevices()
  .then(() => {
    console.log('\n✅ List completed successfully');
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
