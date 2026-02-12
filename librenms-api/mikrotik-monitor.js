#!/usr/bin/env node
/**
 * mikrotik-monitor.js
 * แสดงข้อมูลครบถ้วนของ MikroTik Router
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
 * Get device information
 */
async function getDeviceInfo() {
  try {
    const response = await axios.get(
      `${API_URL}/devices/${DEVICE_IP}`,
      { headers }
    );
    return response.data.devices[0];
  } catch (error) {
    console.error('❌ Error fetching device info:', error.message);
    return null;
  }
}

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
    return [];
  }
}

/**
 * Display device information
 */
function displayDeviceInfo(device) {
  console.log('\n' + '='.repeat(80));
  console.log('🖥️  MikroTik Device Information');
  console.log('='.repeat(80));
  console.log(`Hostname:       ${device.hostname}`);
  console.log(`Display Name:   ${device.display || 'N/A'}`);
  console.log(`Device ID:      ${device.device_id}`);
  console.log(`OS:             ${device.os}`);
  console.log(`Version:        ${device.version || 'N/A'}`);
  console.log(`Hardware:       ${device.hardware || 'N/A'}`);
  console.log(`Status:         ${device.status === 1 ? '✅ UP' : '❌ DOWN'}`);
  console.log(`Uptime:         ${formatUptime(device.uptime)}`);
  console.log(`Location:       ${device.location || 'N/A'}`);
  console.log(`Contact:        ${device.sysContact || 'N/A'}`);
  console.log('='.repeat(80));
}

/**
 * Display all ports status
 */
function displayPorts(ports) {
  console.log('\n' + '='.repeat(80));
  console.log('🔌 All Ports Status');
  console.log('='.repeat(80));
  console.log(
    'Port'.padEnd(12) +
    'Description'.padEnd(20) +
    'Status'.padEnd(12) +
    'Admin'.padEnd(12) +
    'Speed'.padEnd(15) +
    'MTU'
  );
  console.log('-'.repeat(80));

  ports.forEach(port => {
    const status = port.ifOperStatus === 'up' ? '✅ UP' : '❌ DOWN';
    const admin = port.ifAdminStatus === 'up' ? 'UP' : 'DOWN';
    const speed = port.ifSpeed ? `${(port.ifSpeed / 1000000).toFixed(0)} Mbps` : 'N/A';

    console.log(
      port.ifName.padEnd(12) +
      (port.ifDescr || 'N/A').substring(0, 19).padEnd(20) +
      status.padEnd(12) +
      admin.padEnd(12) +
      speed.padEnd(15) +
      port.ifMtu
    );
  });

  console.log('='.repeat(80));
  console.log(`Total ports: ${ports.length}`);
  console.log(`Up: ${ports.filter(p => p.ifOperStatus === 'up').length}`);
  console.log(`Down: ${ports.filter(p => p.ifOperStatus !== 'up').length}`);
}

/**
 * Display detailed information for a specific port
 */
function displayPortDetails(port) {
  console.log('\n' + '='.repeat(80));
  console.log(`📡 ${port.ifName} Detailed Information`);
  console.log('='.repeat(80));
  console.log(`Interface:       ${port.ifName}`);
  console.log(`Description:     ${port.ifDescr || 'N/A'}`);
  console.log(`Alias:           ${port.ifAlias || 'N/A'}`);
  console.log(`Type:            ${port.ifType}`);
  console.log(`Status:          ${port.ifOperStatus.toUpperCase()} ${port.ifOperStatus === 'up' ? '✅' : '❌'}`);
  console.log(`Admin Status:    ${port.ifAdminStatus}`);
  console.log(`Speed:           ${(port.ifSpeed / 1000000).toFixed(0)} Mbps`);
  console.log(`MTU:             ${port.ifMtu}`);
  console.log(`MAC Address:     ${port.ifPhysAddress || 'N/A'}`);

  console.log('\n📊 Traffic Statistics:');
  console.log('-'.repeat(80));
  console.log(`In Octets:       ${formatBytes(port.ifInOctets || 0)}`);
  console.log(`Out Octets:      ${formatBytes(port.ifOutOctets || 0)}`);
  console.log(`In Packets:      ${(port.ifInUcastPkts || 0).toLocaleString()}`);
  console.log(`Out Packets:     ${(port.ifOutUcastPkts || 0).toLocaleString()}`);
  console.log(`In Errors:       ${port.ifInErrors || 0}`);
  console.log(`Out Errors:      ${port.ifOutErrors || 0}`);
  console.log(`In Discards:     ${port.ifInDiscards || 0}`);
  console.log(`Out Discards:    ${port.ifOutDiscards || 0}`);
  console.log('='.repeat(80));
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

/**
 * Format uptime seconds to human-readable format
 */
function formatUptime(seconds) {
  if (!seconds || seconds < 0) return 'N/A';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

/**
 * Main monitoring function
 */
async function monitor() {
  console.log('🚀 Starting MikroTik Monitor...\n');

  // Get device info
  const device = await getDeviceInfo();
  if (!device) {
    console.error('Failed to get device information');
    process.exit(1);
  }

  displayDeviceInfo(device);

  // Get all ports
  const ports = await getPorts();
  if (ports.length === 0) {
    console.error('No ports found');
    process.exit(1);
  }

  displayPorts(ports);

  // Display ether1 details
  const ether1 = ports.find(p => p.ifName === 'ether1');
  if (ether1) {
    displayPortDetails(ether1);
  }

  console.log('\n✅ Monitoring completed successfully\n');
}

// Run the monitor
monitor().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
