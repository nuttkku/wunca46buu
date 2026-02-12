#!/usr/bin/env node
/**
 * check-ether1.js
 * ดึงและแสดงสถานะพอร์ต ether1 จาก MikroTik Router
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from .env
const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;
const DEVICE_IP = process.env.DEVICE_IP;

// Validate environment variables
if (!API_URL || !API_TOKEN || !DEVICE_IP) {
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
 * Get all ports from device
 */
async function getPorts() {
  try {
    const response = await axios.get(
      `${API_URL}/devices/${DEVICE_IP}/ports`,
      { headers }
    );
    return response.data.ports;
  } catch (error) {
    console.error('❌ Error fetching ports:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Find and display ether1 status
 */
async function checkEther1() {
  console.log('🔍 Checking ether1 status...\n');

  const ports = await getPorts();
  const ether1 = ports.find(port => port.ifName === 'ether1');

  if (!ether1) {
    console.error('❌ ether1 not found!');
    process.exit(1);
  }

  // Display ether1 information
  console.log('=' .repeat(50));
  console.log('📡 MikroTik ether1 Status');
  console.log('='.repeat(50));
  console.log(`Interface:      ${ether1.ifName}`);
  console.log(`Description:    ${ether1.ifDescr || 'N/A'}`);
  console.log(`Alias:          ${ether1.ifAlias || 'N/A'}`);
  console.log(`Type:           ${ether1.ifType}`);
  console.log(`Status:         ${ether1.ifOperStatus.toUpperCase()} ${ether1.ifOperStatus === 'up' ? '✅' : '❌'}`);
  console.log(`Admin Status:   ${ether1.ifAdminStatus}`);
  console.log(`Speed:          ${(ether1.ifSpeed / 1000000).toFixed(0)} Mbps`);
  console.log(`MTU:            ${ether1.ifMtu}`);
  console.log(`MAC Address:    ${ether1.ifPhysAddress || 'N/A'}`);
  console.log('='.repeat(50));

  // Display traffic statistics if available
  if (ether1.ifInOctets !== undefined) {
    console.log('\n📊 Traffic Statistics:');
    console.log('-'.repeat(50));
    console.log(`In Octets:      ${formatBytes(ether1.ifInOctets || 0)}`);
    console.log(`Out Octets:     ${formatBytes(ether1.ifOutOctets || 0)}`);
    console.log(`In Packets:     ${(ether1.ifInUcastPkts || 0).toLocaleString()}`);
    console.log(`Out Packets:    ${(ether1.ifOutUcastPkts || 0).toLocaleString()}`);
    console.log(`In Errors:      ${ether1.ifInErrors || 0}`);
    console.log(`Out Errors:     ${ether1.ifOutErrors || 0}`);
    console.log('-'.repeat(50));
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

// Run the check
checkEther1()
  .then(() => {
    console.log('\n✅ Check completed successfully');
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
