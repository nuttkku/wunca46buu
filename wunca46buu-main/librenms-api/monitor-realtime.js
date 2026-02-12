#!/usr/bin/env node
/**
 * monitor-realtime.js
 * Monitor ether1 แบบ real-time (ทุกๆ N วินาที)
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from .env
const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;
const DEVICE_IP = process.env.DEVICE_IP;

// Monitoring settings
const INTERVAL = 5; // seconds
const DURATION = 60; // seconds (0 = infinite)

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
 * Get ether1 port information
 */
async function getEther1() {
  try {
    const response = await axios.get(
      `${API_URL}/devices/${DEVICE_IP}/ports`,
      { headers }
    );
    const ports = response.data.ports;
    return ports.find(port => port.ifName === 'ether1');
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

/**
 * Format bytes to MB
 */
function toMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

/**
 * Get current timestamp
 */
function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
}

/**
 * Monitor ether1 in real-time
 */
async function monitorRealtime() {
  console.log('🚀 Starting Real-time Monitor');
  console.log('='.repeat(80));
  console.log(`Device:   ${DEVICE_IP}`);
  console.log(`Port:     ether1`);
  console.log(`Interval: ${INTERVAL} seconds`);
  console.log(`Duration: ${DURATION > 0 ? DURATION + ' seconds' : 'Infinite (Ctrl+C to stop)'}`);
  console.log('='.repeat(80));
  console.log('');
  console.log(
    'Time'.padEnd(12) +
    'Status'.padEnd(10) +
    'In (MB)'.padEnd(15) +
    'Out (MB)'.padEnd(15) +
    'Errors'.padEnd(10) +
    'Speed'
  );
  console.log('-'.repeat(80));

  const startTime = Date.now();
  let running = true;

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    running = false;
    console.log('\n\n⏹️  Monitoring stopped by user');
    process.exit(0);
  });

  while (running) {
    const ether1 = await getEther1();

    if (ether1) {
      const timestamp = getTimestamp();
      const status = ether1.ifOperStatus === 'up' ? '✅ UP' : '❌ DOWN';
      const inMB = toMB(ether1.ifInOctets || 0);
      const outMB = toMB(ether1.ifOutOctets || 0);
      const errors = (ether1.ifInErrors || 0) + (ether1.ifOutErrors || 0);
      const speed = `${(ether1.ifSpeed / 1000000).toFixed(0)} Mbps`;

      console.log(
        timestamp.padEnd(12) +
        status.padEnd(10) +
        inMB.padEnd(15) +
        outMB.padEnd(15) +
        errors.toString().padEnd(10) +
        speed
      );
    } else {
      console.log(`${getTimestamp().padEnd(12)}❌ Error fetching data`);
    }

    // Check if duration exceeded
    if (DURATION > 0 && (Date.now() - startTime) >= (DURATION * 1000)) {
      running = false;
      console.log('\n✅ Monitoring completed (duration reached)');
      break;
    }

    // Wait for next interval
    if (running) {
      await new Promise(resolve => setTimeout(resolve, INTERVAL * 1000));
    }
  }
}

// Run the monitor
console.log('\n📊 LibreNMS Real-time Monitor\n');
monitorRealtime().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
