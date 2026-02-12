# 🔌 LibreNMS API Guide

คู่มือการใช้งาน LibreNMS API สำหรับดึงข้อมูล monitoring แบบ programmatic

---

## 📋 สารบัญ

- [ภาพรวม API](#ภาพรวม-api)
- [สร้าง API Token](#สร้าง-api-token)
- [การเชื่อมต่อ API](#การเชื่อมต่อ-api)
- [API Endpoints พื้นฐาน](#api-endpoints-พื้นฐาน)
- [ดึงข้อมูลจาก MikroTik](#ดึงข้อมูลจาก-mikrotik)
- [ตัวอย่าง Code](#ตัวอย่าง-code)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## 📖 ภาพรวม API

LibreNMS API เป็น RESTful API ที่ช่วยให้คุณสามารถ:
- ✅ ดึงข้อมูลอุปกรณ์และ metrics
- ✅ จัดการอุปกรณ์ (เพิ่ม, ลบ, อัปเดต)
- ✅ ดู alerts และ event logs
- ✅ ดึงข้อมูล ports, graphs, และ statistics
- ✅ Automate monitoring workflows

### API Information

| Item | Value |
|------|-------|
| **Base URL** | `http://localhost:8000/api/v0` |
| **Authentication** | API Token (Header-based) |
| **Format** | JSON |
| **Methods** | GET, POST, PUT, DELETE, PATCH |
| **Rate Limit** | ไม่จำกัด (default) |

### API Architecture

```
┌──────────────┐      HTTPS/HTTP       ┌─────────────────┐
│   Client     │─────────────────────► │   LibreNMS      │
│  (Your App)  │  X-Auth-Token: xxx    │   API Server    │
└──────────────┘  ◄─────────────────── └─────────────────┘
                      JSON Response              │
                                                  │
                                          ┌───────▼───────┐
                                          │   Database    │
                                          │  (MariaDB)    │
                                          └───────────────┘
```

---

## 🔑 สร้าง API Token

API Token จำเป็นสำหรับการ authenticate กับ LibreNMS API

### วิธีที่ 1: ผ่าน Web Interface (แนะนำ)

#### Step 1: Login เข้า LibreNMS

1. เปิดเว็บเบราว์เซอร์: `http://localhost:8000`
2. Login ด้วย admin credentials

#### Step 2: เข้าสู่หน้า API Settings

1. คลิกที่ **Username** (มุมบนขวา) → **My Settings**
2. เลือกแท็บ **API Settings**
3. หรือไปที่ URL โดยตรง: `http://localhost:8000/api-access`

#### Step 3: สร้าง API Token ใหม่

1. ในส่วน **API Tokens** คลิก **Create API Token**
2. กรอกข้อมูล:
   - **Description:** `My API Token` (หรือชื่อที่ต้องการ)
   - **Disabled:** ❌ ไม่เลือก
3. คลิก **Create Token**

#### Step 4: Copy Token

**⚠️ สำคัญมาก:** Token จะแสดงเพียงครั้งเดียว!

```
Your API Token:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**💾 เก็บ token ไว้ในที่ปลอดภัย** - คุณจะไม่สามารถดูได้อีก!

#### Step 5: ทดสอบ Token

```bash
# Linux/macOS
curl -H "X-Auth-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  http://localhost:8000/api/v0/devices

# Windows PowerShell
curl.exe -H "X-Auth-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" http://localhost:8000/api/v0/devices
```

**Expected Response:**
```json
{
  "status": "ok",
  "devices": [
    {
      "device_id": 1,
      "hostname": "192.168.56.10",
      "display": "MikroTik-Lab-Router",
      "os": "routeros",
      "status": 1,
      "uptime": 123456
    }
  ],
  "count": 1
}
```

### วิธีที่ 2: ผ่าน Command Line

```bash
# สร้าง API token ผ่าน CLI
docker exec librenms lnms user:api-token admin create "My API Token"
```

**Output:**
```
API Token created successfully:
Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### จัดการ API Tokens

```bash
# List tokens
docker exec librenms lnms user:api-token admin list

# Delete token
docker exec librenms lnms user:api-token admin delete <token-id>
```

---

## 🔒 Security Setup

> ⚠️ **สำคัญ:** ตัวอย่าง code ในคู่มือนี้ออกแบบมาสำหรับ Workshop/การเรียนรู้เท่านั้น
>
> **ปัญหาด้านความปลอดภัย:**
> - API Token อาจถูก hardcode ในโค้ด
> - ไม่มี HTTPS/SSL encryption
> - API Token ไม่มีการจำกัดสิทธิ์

### วิธีตั้งค่าที่ปลอดภัย

#### 1. ใช้ Environment Variables

```bash
# สร้างไฟล์ .env
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env
```

เพิ่มข้อมูล:

```bash
API_URL=http://localhost:8000/api/v0
API_TOKEN=<your-secure-api-token>
DEVICE_IP=192.168.56.10
```

**ในโค้ด:**

```javascript
require('dotenv').config();

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

// ไม่ hardcode!
```

#### 2. จำกัดสิทธิ์ API Token

เมื่อสร้าง API Token ใน LibreNMS:
- ใช้ User ที่มีสิทธิ์น้อยที่สุดที่จำเป็น
- สร้าง User แยกสำหรับ automation/integration
- ไม่ใช้ admin token สำหรับ application

```bash
# สร้าง user แยกสำหรับ API
docker exec librenms lnms user:add api_user -p SecurePassword --role normal

# สร้าง token สำหรับ user นี้
docker exec librenms lnms user:api-token api_user create
```

#### 3. ใช้ HTTPS/SSL (สำหรับ Production)

ถ้า LibreNMS อยู่บน Production:

```javascript
// เปลี่ยนจาก http เป็น https
const API_URL = "https://your-domain.com/api/v0";

// ถ้าใช้ self-signed certificate
const https = require('https');
const agent = new https.Agent({
    rejectUnauthorized: false  // ใช้เฉพาะ dev เท่านั้น!
});
```

#### 4. เพิ่ม Rate Limiting

```javascript
// ใช้ library เช่น bottleneck
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
    maxConcurrent: 5,      // max 5 requests พร้อมกัน
    minTime: 200           // รอ 200ms ระหว่าง request
});

// Wrap API calls
const getDevices = limiter.wrap(async () => {
    return axios.get(`${API_URL}/devices`, { headers });
});
```

#### 5. ปกป้อง .env File

```bash
# ตรวจสอบว่า .env ถูก ignore จาก git
cat .gitignore | grep .env

# ควรเห็น:
# .env
# *.env
```

**อย่าเผย .env file:**
- ไม่ commit เข้า git
- ไม่ส่งผ่าน email/chat
- ไม่เก็บใน public storage

### ✅ Security Checklist

ก่อนใช้งาน Production:

- [ ] ใช้ `.env` file สำหรับ credentials
- [ ] เพิ่ม `.env` เข้า `.gitignore`
- [ ] สร้าง API Token แยกสำหรับแต่ละ application
- [ ] จำกัดสิทธิ์ API Token ให้น้อยที่สุด
- [ ] ใช้ HTTPS แทน HTTP
- [ ] เพิ่ม error handling และ logging
- [ ] ตั้ง rate limiting
- [ ] เปลี่ยน API Token เป็นประจำ
- [ ] Monitor API usage

### 🎓 สำหรับ Workshop

**ไม่ต้องกังวล!** สำหรับการเรียนรู้:
1. Copy `.env.example` เป็น `.env`
2. ใส่ API Token ที่สร้างจาก LibreNMS
3. รันโค้ดตัวอย่างได้เลย

---

## 🔌 การเชื่อมต่อ API

### Base URL และ Authentication

**Base URL:**
```
http://localhost:8000/api/v0
```

**Authentication Header:**
```
X-Auth-Token: your-api-token-here
```

### ตัวอย่างการเรียกใช้

#### Using cURL

```bash
curl -H "X-Auth-Token: YOUR_TOKEN" \
  http://localhost:8000/api/v0/devices
```

#### Using Python (requests)

```python
import requests

API_URL = "http://localhost:8000/api/v0"
API_TOKEN = "your-api-token-here"

headers = {
    "X-Auth-Token": API_TOKEN,
    "Content-Type": "application/json"
}

response = requests.get(f"{API_URL}/devices", headers=headers)
data = response.json()
print(data)
```

#### Using JavaScript (fetch)

```javascript
const API_URL = "http://localhost:8000/api/v0";
const API_TOKEN = "your-api-token-here";

fetch(`${API_URL}/devices`, {
  headers: {
    "X-Auth-Token": API_TOKEN,
    "Content-Type": "application/json"
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));
```

#### Using PowerShell

```powershell
$apiToken = "your-api-token-here"
$headers = @{
    "X-Auth-Token" = $apiToken
}

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v0/devices" -Headers $headers
$response | ConvertTo-Json
```

---

## 📚 API Endpoints พื้นฐาน

### 1. System & Health

```bash
# Get system info
GET /api/v0/system

# Get system health
GET /api/v0/system/health
```

### 2. Devices

```bash
# List all devices
GET /api/v0/devices

# Get specific device
GET /api/v0/devices/{hostname}
GET /api/v0/devices/192.168.56.10

# Search devices
GET /api/v0/devices?type=network

# Add device
POST /api/v0/devices
{
  "hostname": "192.168.56.11",
  "community": "public",
  "snmpver": "v2c"
}

# Delete device
DELETE /api/v0/devices/{hostname}
```

### 3. Ports/Interfaces

```bash
# Get all ports
GET /api/v0/ports

# Get ports for specific device
GET /api/v0/devices/{hostname}/ports

# Get specific port
GET /api/v0/ports/{port_id}

# Search ports
GET /api/v0/ports?columns=ifName,ifOperStatus&ifName=ether1
```

### 4. Alerts

```bash
# Get all alerts
GET /api/v0/alerts

# Get alerts for device
GET /api/v0/devices/{hostname}/alerts

# Acknowledge alert
PUT /api/v0/alerts/{alert_id}
```

### 5. Graphs & Statistics

```bash
# Get port graphs
GET /api/v0/devices/{hostname}/graphs/port/{port_id}

# Get device graphs
GET /api/v0/devices/{hostname}/graphs
```

---

## 🔧 ดึงข้อมูลจาก MikroTik

ตัวอย่างการดึงข้อมูลจาก MikroTik Router ที่เพิ่มไว้ใน Lab

### ข้อมูลที่ต้องรู้

จาก Lab ของเรา:
- **Hostname/IP:** `192.168.56.10`
- **Display Name:** `MikroTik-Lab-Router`
- **Interface ที่สนใจ:** `ether1` (Host-Only network)

### 1. ดึงข้อมูลอุปกรณ์ MikroTik

#### cURL

```bash
curl -H "X-Auth-Token: YOUR_TOKEN" \
  "http://localhost:8000/api/v0/devices/192.168.56.10"
```

#### Python

```python
import requests
import json

API_URL = "http://localhost:8000/api/v0"
API_TOKEN = "your-api-token-here"

headers = {"X-Auth-Token": API_TOKEN}

# Get device info
response = requests.get(
    f"{API_URL}/devices/192.168.56.10",
    headers=headers
)

device = response.json()
print(json.dumps(device, indent=2))
```

**Response Example:**
```json
{
  "status": "ok",
  "devices": [
    {
      "device_id": 1,
      "hostname": "192.168.56.10",
      "display": "MikroTik-Lab-Router",
      "os": "routeros",
      "hardware": "CHR",
      "version": "7.12",
      "status": 1,
      "status_reason": "",
      "uptime": 123456,
      "location": "Lab Network",
      "sysContact": "admin@lab.local"
    }
  ]
}
```

### 2. ดึงรายการ Ports ทั้งหมด

#### cURL

```bash
curl -H "X-Auth-Token: YOUR_TOKEN" \
  "http://localhost:8000/api/v0/devices/192.168.56.10/ports"
```

#### Python

```python
# Get all ports
response = requests.get(
    f"{API_URL}/devices/192.168.56.10/ports",
    headers=headers
)

ports = response.json()

# แสดงเฉพาะชื่อและสถานะ
for port in ports['ports']:
    print(f"{port['ifName']}: {port['ifOperStatus']}")
```

**Response Example:**
```json
{
  "status": "ok",
  "ports": [
    {
      "port_id": 1,
      "device_id": 1,
      "ifIndex": 1,
      "ifName": "ether1",
      "ifDescr": "ether1",
      "ifAlias": "",
      "ifType": "ethernetCsmacd",
      "ifOperStatus": "up",
      "ifAdminStatus": "up",
      "ifSpeed": 1000000000,
      "ifMtu": 1500,
      "ifPhysAddress": "0011223344aa"
    },
    {
      "port_id": 2,
      "ifName": "ether2",
      "ifOperStatus": "up"
    },
    {
      "port_id": 3,
      "ifName": "ether3",
      "ifOperStatus": "up"
    },
    {
      "port_id": 4,
      "ifName": "ether4",
      "ifOperStatus": "up"
    }
  ],
  "count": 4
}
```

### 3. ดึงสถานะพอร์ต ether1 โดยเฉพาะ

#### Method 1: Filter by ifName

```bash
curl -H "X-Auth-Token: YOUR_TOKEN" \
  "http://localhost:8000/api/v0/ports?hostname=192.168.56.10&ifName=ether1"
```

#### Method 2: Get all ports then filter

**Python Example:**

```python
import requests

API_URL = "http://localhost:8000/api/v0"
API_TOKEN = "your-api-token-here"

headers = {"X-Auth-Token": API_TOKEN}

def get_ether1_status():
    """ดึงสถานะพอร์ต ether1 จาก MikroTik"""

    # Get all ports from device
    response = requests.get(
        f"{API_URL}/devices/192.168.56.10/ports",
        headers=headers
    )

    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None

    data = response.json()

    # Find ether1
    for port in data['ports']:
        if port['ifName'] == 'ether1':
            return port

    return None

# Get ether1 status
ether1 = get_ether1_status()

if ether1:
    print("=" * 50)
    print("MikroTik ether1 Status")
    print("=" * 50)
    print(f"Interface:     {ether1['ifName']}")
    print(f"Description:   {ether1['ifDescr']}")
    print(f"Status:        {ether1['ifOperStatus'].upper()}")
    print(f"Admin Status:  {ether1['ifAdminStatus']}")
    print(f"Speed:         {ether1['ifSpeed'] / 1000000} Mbps")
    print(f"MTU:           {ether1['ifMtu']}")
    print(f"MAC Address:   {ether1['ifPhysAddress']}")
    print("=" * 50)
else:
    print("ether1 not found!")
```

**Output:**
```
==================================================
MikroTik ether1 Status
==================================================
Interface:     ether1
Description:   ether1
Status:        UP
Admin Status:  up
Speed:         1000.0 Mbps
MTU:           1500
MAC Address:   0011223344aa
==================================================
```

### 4. ดึง Traffic Statistics ของ ether1

```python
def get_ether1_traffic():
    """ดึงข้อมูล traffic ของ ether1"""

    response = requests.get(
        f"{API_URL}/devices/192.168.56.10/ports",
        headers=headers
    )

    data = response.json()

    for port in data['ports']:
        if port['ifName'] == 'ether1':
            print("=" * 50)
            print("ether1 Traffic Statistics")
            print("=" * 50)
            print(f"In Octets:     {port.get('ifInOctets', 0):,} bytes")
            print(f"Out Octets:    {port.get('ifOutOctets', 0):,} bytes")
            print(f"In Errors:     {port.get('ifInErrors', 0)}")
            print(f"Out Errors:    {port.get('ifOutErrors', 0)}")
            print(f"In Unicast:    {port.get('ifInUcastPkts', 0):,} packets")
            print(f"Out Unicast:   {port.get('ifOutUcastPkts', 0):,} packets")
            print("=" * 50)
            return port

    return None

get_ether1_traffic()
```

### 5. Monitor ether1 แบบ Real-time

```python
import time

def monitor_ether1(interval=5):
    """Monitor ether1 status ทุกๆ N วินาที"""

    print("Starting ether1 monitor...")
    print("Press Ctrl+C to stop\n")

    try:
        while True:
            response = requests.get(
                f"{API_URL}/devices/192.168.56.10/ports",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()

                for port in data['ports']:
                    if port['ifName'] == 'ether1':
                        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                        status = port['ifOperStatus'].upper()
                        in_octets = port.get('ifInOctets', 0)
                        out_octets = port.get('ifOutOctets', 0)

                        print(f"[{timestamp}] ether1: {status} | "
                              f"IN: {in_octets:,} | OUT: {out_octets:,}")
                        break

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")

# Monitor every 5 seconds
monitor_ether1(interval=5)
```

**Output:**
```
Starting ether1 monitor...
Press Ctrl+C to stop

[2026-02-09 15:30:01] ether1: UP | IN: 1,234,567 | OUT: 987,654
[2026-02-09 15:30:06] ether1: UP | IN: 1,235,890 | OUT: 988,123
[2026-02-09 15:30:11] ether1: UP | IN: 1,237,234 | OUT: 988,567
^C
Monitoring stopped.
```

---

## 💻 ตัวอย่าง Code ครบชุด

### Python Script: mikrotik_monitor.py

สร้างไฟล์ `mikrotik_monitor.py`:

```python
#!/usr/bin/env python3
"""
MikroTik Port Monitor using LibreNMS API
ติดตามสถานะและ traffic ของ ports บน MikroTik Router
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000/api/v0"
API_TOKEN = "your-api-token-here"  # เปลี่ยนเป็น token จริง
DEVICE_IP = "192.168.56.10"

headers = {
    "X-Auth-Token": API_TOKEN,
    "Content-Type": "application/json"
}

def get_device_info():
    """ดึงข้อมูลอุปกรณ์ MikroTik"""
    try:
        response = requests.get(
            f"{API_URL}/devices/{DEVICE_IP}",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        return response.json()['devices'][0]
    except Exception as e:
        print(f"Error getting device info: {e}")
        return None

def get_all_ports():
    """ดึงข้อมูล ports ทั้งหมด"""
    try:
        response = requests.get(
            f"{API_URL}/devices/{DEVICE_IP}/ports",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        return response.json()['ports']
    except Exception as e:
        print(f"Error getting ports: {e}")
        return []

def get_port_by_name(port_name):
    """ดึงข้อมูล port โดยระบุชื่อ"""
    ports = get_all_ports()
    for port in ports:
        if port['ifName'] == port_name:
            return port
    return None

def format_bytes(bytes):
    """แปลง bytes เป็นหน่วยที่อ่านง่าย"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} PB"

def display_device_info():
    """แสดงข้อมูลอุปกรณ์"""
    print("\n" + "=" * 60)
    print("MikroTik Device Information")
    print("=" * 60)

    device = get_device_info()
    if device:
        print(f"Hostname:      {device['hostname']}")
        print(f"Display Name:  {device.get('display', 'N/A')}")
        print(f"OS:            {device['os']}")
        print(f"Version:       {device.get('version', 'N/A')}")
        print(f"Hardware:      {device.get('hardware', 'N/A')}")
        print(f"Status:        {'UP' if device['status'] == 1 else 'DOWN'}")
        print(f"Uptime:        {device.get('uptime', 0)} seconds")
        print(f"Location:      {device.get('location', 'N/A')}")
    else:
        print("Failed to get device info")

    print("=" * 60)

def display_all_ports():
    """แสดงสถานะ ports ทั้งหมด"""
    print("\n" + "=" * 60)
    print("All Ports Status")
    print("=" * 60)
    print(f"{'Port':<10} {'Status':<10} {'Admin':<10} {'Speed':<15}")
    print("-" * 60)

    ports = get_all_ports()
    for port in ports:
        status = port['ifOperStatus'].upper()
        admin = port['ifAdminStatus']
        speed = f"{port['ifSpeed'] / 1000000:.0f} Mbps" if port['ifSpeed'] else "N/A"
        print(f"{port['ifName']:<10} {status:<10} {admin:<10} {speed:<15}")

    print("=" * 60)

def display_ether1_details():
    """แสดงรายละเอียด ether1"""
    print("\n" + "=" * 60)
    print("ether1 Detailed Information")
    print("=" * 60)

    port = get_port_by_name('ether1')
    if port:
        print(f"Interface:        {port['ifName']}")
        print(f"Description:      {port['ifDescr']}")
        print(f"Alias:            {port.get('ifAlias', 'N/A')}")
        print(f"Type:             {port['ifType']}")
        print(f"Status:           {port['ifOperStatus'].upper()}")
        print(f"Admin Status:     {port['ifAdminStatus']}")
        print(f"Speed:            {port['ifSpeed'] / 1000000:.0f} Mbps")
        print(f"MTU:              {port['ifMtu']}")
        print(f"MAC Address:      {port.get('ifPhysAddress', 'N/A')}")
        print()
        print("Traffic Statistics:")
        print(f"  In Octets:      {format_bytes(port.get('ifInOctets', 0))}")
        print(f"  Out Octets:     {format_bytes(port.get('ifOutOctets', 0))}")
        print(f"  In Packets:     {port.get('ifInUcastPkts', 0):,}")
        print(f"  Out Packets:    {port.get('ifOutUcastPkts', 0):,}")
        print(f"  In Errors:      {port.get('ifInErrors', 0)}")
        print(f"  Out Errors:     {port.get('ifOutErrors', 0)}")
    else:
        print("ether1 not found!")

    print("=" * 60)

def monitor_ether1(interval=5, duration=60):
    """Monitor ether1 แบบ real-time"""
    print("\n" + "=" * 60)
    print(f"Monitoring ether1 (every {interval}s for {duration}s)")
    print("=" * 60)
    print(f"{'Time':<20} {'Status':<10} {'In (MB)':<15} {'Out (MB)':<15}")
    print("-" * 60)

    start_time = time.time()

    try:
        while (time.time() - start_time) < duration:
            port = get_port_by_name('ether1')
            if port:
                timestamp = datetime.now().strftime("%H:%M:%S")
                status = port['ifOperStatus'].upper()
                in_mb = port.get('ifInOctets', 0) / (1024 * 1024)
                out_mb = port.get('ifOutOctets', 0) / (1024 * 1024)

                print(f"{timestamp:<20} {status:<10} {in_mb:<15.2f} {out_mb:<15.2f}")

            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user")

    print("=" * 60)

def main():
    """Main function"""
    print("\n" + "=" * 60)
    print("LibreNMS API - MikroTik Monitor")
    print("=" * 60)

    # 1. แสดงข้อมูลอุปกรณ์
    display_device_info()

    # 2. แสดงสถานะ ports ทั้งหมด
    display_all_ports()

    # 3. แสดงรายละเอียด ether1
    display_ether1_details()

    # 4. Monitor ether1 (30 seconds)
    monitor_ether1(interval=5, duration=30)

    print("\nDone!")

if __name__ == "__main__":
    main()
```

### วิธีใช้งาน

```bash
# 1. แก้ไข API_TOKEN ในไฟล์
nano mikrotik_monitor.py

# 2. รันสคริปต์
python3 mikrotik_monitor.py
```

### JavaScript/Node.js Example

สร้างไฟล์ `mikrotik-monitor.js`:

```javascript
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:8000/api/v0';
const API_TOKEN = 'your-api-token-here';
const DEVICE_IP = '192.168.56.10';

const headers = {
  'X-Auth-Token': API_TOKEN,
  'Content-Type': 'application/json'
};

// Get device info
async function getDeviceInfo() {
  try {
    const response = await axios.get(
      `${API_URL}/devices/${DEVICE_IP}`,
      { headers }
    );
    return response.data.devices[0];
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Get all ports
async function getAllPorts() {
  try {
    const response = await axios.get(
      `${API_URL}/devices/${DEVICE_IP}/ports`,
      { headers }
    );
    return response.data.ports;
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

// Get ether1 status
async function getEther1Status() {
  const ports = await getAllPorts();
  const ether1 = ports.find(port => port.ifName === 'ether1');

  if (ether1) {
    console.log('='.repeat(50));
    console.log('ether1 Status');
    console.log('='.repeat(50));
    console.log(`Interface:    ${ether1.ifName}`);
    console.log(`Status:       ${ether1.ifOperStatus.toUpperCase()}`);
    console.log(`Admin Status: ${ether1.ifAdminStatus}`);
    console.log(`Speed:        ${ether1.ifSpeed / 1000000} Mbps`);
    console.log(`MTU:          ${ether1.ifMtu}`);
    console.log('='.repeat(50));
  } else {
    console.log('ether1 not found!');
  }
}

// Main
async function main() {
  console.log('LibreNMS API - MikroTik Monitor\n');

  const device = await getDeviceInfo();
  if (device) {
    console.log(`Device: ${device.display} (${device.hostname})`);
    console.log(`Status: ${device.status === 1 ? 'UP' : 'DOWN'}\n`);
  }

  await getEther1Status();
}

main();
```

---

## ⚠️ Error Handling

### Common Errors

#### 1. Authentication Failed (401)

```json
{
  "status": "error",
  "message": "Unauthenticated"
}
```

**แก้ไข:**
- ตรวจสอบ API Token ถูกต้องหรือไม่
- ตรวจสอบ Header: `X-Auth-Token`
- Token อาจหมดอายุ - สร้างใหม่

#### 2. Device Not Found (404)

```json
{
  "status": "error",
  "message": "Device not found"
}
```

**แก้ไข:**
- ตรวจสอบ hostname/IP ถูกต้อง
- ตรวจสอบอุปกรณ์ถูกเพิ่มใน LibreNMS แล้ว

#### 3. Rate Limit (429)

```json
{
  "status": "error",
  "message": "Too many requests"
}
```

**แก้ไข:**
- รอสักครู่แล้วลองใหม่
- ลด request rate
- ใช้ caching

### Python Error Handling Example

```python
import requests
from requests.exceptions import RequestException, Timeout

def safe_api_call(endpoint):
    """API call พร้อม error handling"""
    try:
        response = requests.get(
            f"{API_URL}/{endpoint}",
            headers=headers,
            timeout=10
        )

        # Check HTTP status
        response.raise_for_status()

        # Parse JSON
        data = response.json()

        # Check API status
        if data.get('status') != 'ok':
            print(f"API Error: {data.get('message', 'Unknown error')}")
            return None

        return data

    except Timeout:
        print("Request timeout - LibreNMS not responding")
        return None
    except RequestException as e:
        print(f"Network error: {e}")
        return None
    except ValueError as e:
        print(f"JSON decode error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

# Usage
data = safe_api_call("devices/192.168.56.10")
if data:
    print("Success!")
else:
    print("Failed to get data")
```

---

## 🎯 Best Practices

### 1. Security

**✅ DO:**
- เก็บ API Token ใน environment variables
- ใช้ HTTPS ใน production
- จำกัด IP ที่สามารถใช้ API (ถ้าเป็นไปได้)
- Rotate tokens เป็นประจำ

**❌ DON'T:**
- Hard-code token ในโค้ด
- Share token ในที่สาธารณะ
- Commit token เข้า git

**Environment Variable Example:**

```python
import os

API_TOKEN = os.environ.get('LIBRENMS_API_TOKEN')
if not API_TOKEN:
    raise ValueError("LIBRENMS_API_TOKEN not set")
```

```bash
# Set environment variable
export LIBRENMS_API_TOKEN="your-token-here"

# Run script
python3 mikrotik_monitor.py
```

### 2. Performance

**Use Caching:**

```python
from functools import lru_cache
from datetime import datetime, timedelta

@lru_cache(maxsize=128)
def get_device_info_cached(device_ip, cache_time):
    """Cache device info for 5 minutes"""
    return get_device_info(device_ip)

# Use with cache key that changes every 5 minutes
cache_key = datetime.now().replace(second=0, microsecond=0)
cache_key = cache_key - timedelta(minutes=cache_key.minute % 5)

device = get_device_info_cached(DEVICE_IP, cache_key)
```

**Batch Requests:**

```python
# ❌ Bad - Multiple requests
for device in devices:
    get_device_info(device)

# ✅ Good - Single request
all_devices = get_all_devices()
```

### 3. Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def get_port_by_name(port_name):
    logger.info(f"Getting port: {port_name}")
    try:
        # ... code ...
        logger.info(f"Port {port_name} found")
        return port
    except Exception as e:
        logger.error(f"Error getting port: {e}")
        return None
```

### 4. Rate Limiting

```python
import time

class RateLimiter:
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = []

    def __call__(self, func):
        def wrapper(*args, **kwargs):
            now = time.time()
            self.calls = [c for c in self.calls if c > now - self.period]

            if len(self.calls) >= self.max_calls:
                sleep_time = self.calls[0] - (now - self.period)
                time.sleep(sleep_time)

            self.calls.append(time.time())
            return func(*args, **kwargs)
        return wrapper

# Max 10 calls per second
@RateLimiter(max_calls=10, period=1)
def api_call(endpoint):
    return requests.get(f"{API_URL}/{endpoint}", headers=headers)
```

---

## 📖 API Documentation

### Official Docs

- [LibreNMS API Documentation](https://docs.librenms.org/API/)
- [API Endpoints Reference](https://docs.librenms.org/API/Devices/)

### Interactive API Explorer

LibreNMS มี API explorer built-in:

```
http://localhost:8000/api/v0/api-docs
```

### Postman Collection

สามารถ import LibreNMS API collection ใน Postman:

1. เปิด Postman
2. Import → Link
3. URL: `http://localhost:8000/api/v0/api-docs`

---

## 🎓 ตัวอย่างการใช้งานจริง

### Use Case 1: Dashboard Alert

สร้าง dashboard ที่แจ้งเตือนเมื่อ port down:

```python
def check_port_status():
    ports = get_all_ports()
    down_ports = [p for p in ports if p['ifOperStatus'] != 'up']

    if down_ports:
        print("⚠️ WARNING: Ports are down!")
        for port in down_ports:
            print(f"  - {port['ifName']}: {port['ifOperStatus']}")
        return False
    else:
        print("✅ All ports are up!")
        return True
```

### Use Case 2: Traffic Report

สร้างรายงาน traffic รายวัน:

```python
def generate_traffic_report():
    ports = get_all_ports()

    print("Daily Traffic Report")
    print("=" * 60)

    for port in ports:
        in_gb = port.get('ifInOctets', 0) / (1024**3)
        out_gb = port.get('ifOutOctets', 0) / (1024**3)
        print(f"{port['ifName']:<10} IN: {in_gb:>8.2f} GB  OUT: {out_gb:>8.2f} GB")

    print("=" * 60)
```

### Use Case 3: Automated Response

ตรวจสอบและทำ action อัตโนมัติ:

```python
def auto_response():
    """ตรวจสอบและแจ้งเตือนถ้า bandwidth เกิน threshold"""

    THRESHOLD_MBPS = 800  # 800 Mbps

    port = get_port_by_name('ether1')
    if port:
        # คำนวณ bandwidth utilization
        speed_bps = port['ifSpeed']
        in_bps = port.get('ifInOctets', 0) * 8  # bytes to bits

        utilization = (in_bps / speed_bps) * 100

        if utilization > 80:  # 80% threshold
            send_alert(f"ether1 utilization: {utilization:.1f}%")
```

---

## 🔗 Resources

### Documentation
- [LibreNMS API Docs](https://docs.librenms.org/API/)
- [Python Requests Library](https://requests.readthedocs.io/)
- [Axios (Node.js)](https://axios-http.com/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [HTTPie](https://httpie.io/) - CLI HTTP client
- [jq](https://stedolan.github.io/jq/) - JSON processor

---

## 📝 Summary

คุณได้เรียนรู้:
- ✅ วิธีสร้างและใช้งาน API Token
- ✅ การเชื่อมต่อ LibreNMS API
- ✅ API Endpoints สำคัญ
- ✅ วิธีดึงข้อมูลจาก MikroTik
- ✅ การดึงสถานะพอร์ต ether1
- ✅ ตัวอย่าง code ภาษาต่างๆ
- ✅ Error handling และ best practices

ตอนนี้คุณสามารถใช้ LibreNMS API เพื่อสร้าง custom monitoring solutions ได้แล้ว! 🚀

---

**Happy API Coding! 🎉**

*Last Updated: 2026-02-09*
