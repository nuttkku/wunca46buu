<div align="center">
  <img src="picture/wunca46.jpg" alt="WUNCA46 Banner" width="100%" style="max-width: 1200px; border-radius: 10px;">
</div>

<br>

# 🧪 Network Monitoring Lab: LibreNMS + MikroTik RouterOS

> 📚 Workshop: สร้างระบบ Network Monitoring ด้วย LibreNMS และ MikroTik RouterOS

---

## 🎯 Lab Overview

ในแล็ปนี้คุณจะได้เรียนรู้การสร้างระบบ Network Monitoring แบบ end-to-end:

1. **ติดตั้ง LibreNMS** บน Docker สำหรับเป็น Monitoring System
2. **สร้าง MikroTik RouterOS VM** บน VirtualBox พร้อม configuration
3. **Monitor MikroTik** ด้วย LibreNMS ผ่าน SNMP protocol

### 🎓 สิ่งที่จะได้เรียนรู้

- ✅ Docker Compose orchestration
- ✅ Network Monitoring concepts (SNMP, Polling, Metrics)
- ✅ VirtualBox networking (Host-Only, NAT, Internal)
- ✅ MikroTik RouterOS configuration
- ✅ SNMP v2c setup และ troubleshooting
- ✅ Real-time monitoring และ alerting

### ⏱️ ระยะเวลา

- **Lab 1:** 15-20 นาที (Setup LibreNMS)
- **Lab 2:** 20-30 นาที (Setup MikroTik)
- **Lab 3:** 10-15 นาที (Integration & Monitoring)
- **Lab 4:** 15-20 นาที (API Integration - Optional)
- **Lab 5:** 15-20 นาที (Node-RED + MQTT - Optional)
- **รวม:** ~45-105 นาที

### 📋 Prerequisites

**Software:**
- [Docker Desktop](https://docs.docker.com/get-docker/) 20.10+ (Windows/macOS/Linux)
- [VirtualBox](https://www.virtualbox.org/wiki/Downloads) 6.0+
- Terminal/PowerShell access
- Web Browser (Chrome, Firefox, Edge)

**Hardware:**
- CPU: 4 cores (recommended)
- RAM: 6 GB available
- Disk: 20 GB free space
- Internet connection

**Knowledge:**
- Basic Linux commands
- Basic networking concepts (IP, subnet, gateway)
- Docker basics (optional but helpful)

---

## 🏗️ Lab Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Host Machine                              │
│                                                                  │
│  ┌──────────────────────┐       ┌──────────────────────────┐   │
│  │  LibreNMS (Docker)   │       │  MikroTik RouterOS (VM)  │   │
│  │  ==================   │       │  ====================    │   │
│  │  • Port: 8000        │◄─────►│  • ether1: 192.168.56.10│   │
│  │  • MariaDB           │ SNMP  │  • ether2: NAT          │   │
│  │  • Redis             │ Poll  │  • ether3: Internal     │   │
│  │  • Dispatcher        │       │  • ether4: Internal     │   │
│  └──────────────────────┘       └──────────────────────────┘   │
│           │                               │                     │
│           └───────────────┬───────────────┘                     │
│                           │                                     │
│                   Host-Only Network                             │
│                   192.168.56.0/24                               │
└─────────────────────────────────────────────────────────────────┘
```

**Network Design:**
- **Host-Only Network (192.168.56.0/24):** สำหรับ management และ monitoring
- **LibreNMS:** Host เข้าถึงผ่าน `localhost:8000`
- **MikroTik:** IP `192.168.56.10` บน ether1
- **SNMP:** Port 161/UDP สำหรับ polling data

---

## 🧪 LAB 1: ติดตั้งและรัน LibreNMS

**🎯 วัตถุประสงค์:** ติดตั้ง LibreNMS Monitoring System ด้วย Docker Compose

**⏱️ เวลา:** 15-20 นาที

### Step 1.1: เตรียม Environment

```bash
# Clone repository
git clone <repository-url>
cd wunca46buu

# ตรวจสอบ Docker
docker --version
docker-compose --version
```

**Expected Output:**
```
Docker version 20.10.x or higher
Docker Compose version v2.x.x or higher
```

### Step 1.2: เข้าไปยัง LibreNMS Directory

```bash
cd librenms
ls -la
```

**ไฟล์ที่ควรเห็น:**
- `docker-compose.yml` - Configuration file
- `librenms.md` - คู่มือฉบับเต็ม

### Step 1.3: Start LibreNMS Containers

```bash
# Start ทุก services (MariaDB, Redis, LibreNMS, Dispatcher)
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

**Expected Output:**
```
NAME                   STATUS    PORTS
librenms_db            Up        3306/tcp
librenms_redis         Up        6379/tcp
librenms               Up        0.0.0.0:8000->8000/tcp
librenms_dispatcher    Up        -
```

✅ **All 4 containers ต้องมีสถานะ "Up"**

### Step 1.4: ดู Logs (Optional)

```bash
# ดู logs เพื่อตรวจสอบการทำงาน
docker-compose logs -f librenms
```

**รอจนเห็น:**
```
[OK] Database migrations completed
[OK] LibreNMS is ready
```

**กด `Ctrl+C` เพื่อออกจากโหมดดู logs**

### Step 1.5: สร้าง Admin User

```bash
# สร้าง admin user สำหรับ login
docker exec librenms lnms user:add admin -p Admin@123 --role admin
```

**Expected Output:**
```
User admin added successfully
```

💡 **จดข้อมูล Login:**
- Username: `admin`
- Password: `Admin@123`

### Step 1.6: เข้าถึง LibreNMS Web Interface

1. เปิด Web Browser
2. เข้าไปที่: **http://localhost:8000**
3. Login ด้วย username และ password ที่สร้างไว้

**✅ Success Criteria:**
- [ ] เห็นหน้า Login page
- [ ] Login สำเร็จ
- [ ] เห็น Dashboard (ยังไม่มีอุปกรณ์)

### 📸 Screenshot Lab 1

Dashboard ควรแสดง:
```
Devices: 0
Ports: 0
Services: 0
```

### 🎉 LAB 1 Complete!

คุณได้ติดตั้ง LibreNMS สำเร็จแล้ว ตอนนี้พร้อมที่จะเพิ่มอุปกรณ์เข้ามา monitor!

---

## 🧪 LAB 2: ติดตั้งและรัน MikroTik RouterOS

**🎯 วัตถุประสงค์:** สร้าง MikroTik RouterOS VM และตั้งค่า network interfaces

**⏱️ เวลา:** 20-30 นาที

**📖 คู่มือฉบับเต็ม:** [mikrotik/mikrotik.md](mikrotik/mikrotik.md) (มีรายละเอียดทุกขั้นตอน)

### Step 2.1: ดาวน์โหลด RouterOS

1. ไปที่: https://mikrotik.com/download
2. เลือก **Cloud Hosted Router (CHR)**
3. เลือก **OVA** image
4. ดาวน์โหลดไฟล์ `.ova`

### Step 2.2: Import OVA ใน VirtualBox

1. เปิด **VirtualBox**
2. **File** → **Import Appliance...**
3. เลือกไฟล์ `.ova` ที่ดาวน์โหลด
4. ปรับแต่ง settings:
   - **Name:** `MikroTik-Router`
   - **RAM:** `256 MB` (แนะนำ)
   - **CPU:** `2 cores` (optional)
5. คลิก **Import**

### Step 2.3: ตั้งค่า Network Interfaces

**สร้าง Host-Only Network (ถ้ายังไม่มี):**

1. **File** → **Host Network Manager**
2. คลิก **Create**
3. ตั้งค่า:
   - IPv4 Address: `192.168.56.1`
   - IPv4 Network Mask: `255.255.255.0`

**ตั้งค่า VM Adapters:**

1. คลิกขวาที่ VM → **Settings** → **Network**
2. ตั้งค่าแต่ละ adapter:

| Adapter | Attached to | Name/Network | Purpose |
|---------|-------------|--------------|---------|
| **Adapter 1** | Host-only Adapter | vboxnet0 | Management (LibreNMS) |
| **Adapter 2** | NAT | - | Internet Access |
| **Adapter 3** | Internal Network | intnet1 | LAN 1 |
| **Adapter 4** | Internal Network | intnet2 | LAN 2 |

3. คลิก **OK**

### Step 2.4: Start VM และ Login

1. Start VM: **Start** → **Normal Start**
2. รอจนเห็น login prompt (~30 วินาที)

```
MikroTik RouterOS 7.x
Login: admin
Password: [กด Enter - ไม่มีรหัสผ่าน]
```

3. Login สำเร็จ → เห็น prompt:
```
[admin@MikroTik] >
```

### Step 2.5: ตั้งค่า IP Address สำหรับ Management

```bash
# ตั้ง IP สำหรับ ether1 (Host-Only)
[admin@MikroTik] > /ip address add address=192.168.56.10/24 interface=ether1

# ตรวจสอบ
[admin@MikroTik] > /ip address print
```

**Expected Output:**
```
0   192.168.56.10/24   192.168.56.0    ether1
```

### Step 2.6: ทดสอบ Connectivity

จากเครื่อง host (Terminal/PowerShell):

```bash
ping 192.168.56.10
```

**Expected Output:**
```
Reply from 192.168.56.10: bytes=32 time<1ms TTL=64
```

✅ **ถ้า ping ได้ = network configuration ถูกต้อง!**

### Step 2.7: เปิด SNMP Service

```bash
# เปิด SNMP
[admin@MikroTik] > /snmp set enabled=yes

# ตั้งค่า contact และ location
[admin@MikroTik] > /snmp set contact="admin@lab.local" location="Lab Network"

# ตรวจสอบ
[admin@MikroTik] > /snmp print
```

**Expected Output:**
```
enabled: yes
contact: admin@lab.local
location: Lab Network
...
```

### Step 2.8: ตรวจสอบ SNMP Community

```bash
# ดู community (default มี "public" อยู่แล้ว)
[admin@MikroTik] > /snmp community print
```

**Expected Output:**
```
0   name="public" addresses=0.0.0.0/0 security=none read-access=yes
    write-access=no
```

💡 **Community "public" พร้อมใช้งาน ไม่ต้องสร้างเพิ่ม**

### Step 2.9: ทดสอบ SNMP

จากเครื่อง host หรือ LibreNMS container:

```bash
# จาก LibreNMS container
docker exec librenms snmpwalk -v 2c -c public 192.168.56.10 system
```

**Expected Output:**
```
SNMPv2-MIB::sysDescr.0 = STRING: RouterOS CHR
SNMPv2-MIB::sysObjectID.0 = OID: SNMPv2-SMI::enterprises.14988.1
SNMPv2-MIB::sysUpTime.0 = Timeticks: (123456) 0:20:34.56
SNMPv2-MIB::sysContact.0 = STRING: admin@lab.local
SNMPv2-MIB::sysName.0 = STRING: MikroTik
SNMPv2-MIB::sysLocation.0 = STRING: Lab Network
```

✅ **ถ้าเห็น output เหล่านี้ = SNMP ทำงานถูกต้อง!**

### 🎉 LAB 2 Complete!

MikroTik RouterOS พร้อมให้ LibreNMS เข้ามา monitor แล้ว!

**Summary:**
- ✅ VM running
- ✅ IP: 192.168.56.10
- ✅ Ping ได้จาก host
- ✅ SNMP enabled
- ✅ Community: public

---

## 🧪 LAB 3: Monitor MikroTik บน LibreNMS

**🎯 วัตถุประสงค์:** เพิ่ม MikroTik เข้าสู่ LibreNMS และดูข้อมูล monitoring

**⏱️ เวลา:** 10-15 นาที

### Step 3.1: เพิ่มอุปกรณ์ผ่าน Web Interface

1. เปิด LibreNMS: **http://localhost:8000**
2. Login ด้วย `admin` / `Admin@123`
3. ไปที่ **Devices** → **Add Device** (มุมบนขวา)

### Step 3.2: กรอกข้อมูลอุปกรณ์

**Device Information:**
```
Hostname or IP:     192.168.56.10
SNMP Version:       v2c
Community:          public
Port:               161
```

**Optional Settings:**
```
Display Name:       MikroTik-Lab-Router
Hardware:           [ปล่อยว่าง - auto-detect]
OS:                 [ปล่อยว่าง - auto-detect]
```

**Other Options:**
- ✅ เปิด **ICMP Ping**
- ❌ ไม่ต้องเลือก **Force add**

### Step 3.3: Add Device

1. คลิก **Add Device**
2. รอ LibreNMS ทำการ:
   - ✅ ตรวจสอบ SNMP connectivity
   - ✅ Detect device type และ OS
   - ✅ Discovery interfaces และ sensors
   - ✅ สร้าง RRD files

**Expected Result:**
```
✅ Device added successfully!
   Device: MikroTik-Lab-Router (192.168.56.10)
   OS: RouterOS
   Hardware: CHR
```

3. คลิก **View Device** เพื่อดูรายละเอียด

### Step 3.4: ดูข้อมูลอุปกรณ์

คุณจะเห็น:

**Overview Tab:**
- Device Status: **Up** (สีเขียว)
- Uptime: เวลาที่ RouterOS ทำงาน
- Location: Lab Network
- Contact: admin@lab.local
- Hardware: CHR
- Version: RouterOS 7.x

**Health Tab:**
- CPU Usage graph
- Memory Usage graph
- Disk Usage
- System Uptime

**Ports Tab:**
- ether1 (Host-Only) - Status: Up
- ether2 (NAT) - Status: Up
- ether3 (Internal) - Status: Up
- ether4 (Internal) - Status: Up

**Graphs Tab:**
- Traffic In/Out graphs (5 min, 1 hour, 1 day, 1 week)
- Packet rates
- Error rates

### Step 3.5: รอให้ Poller เก็บข้อมูล

```bash
# ตรวจสอบ polling status
docker exec librenms lnms device:poll 192.168.56.10 -vvv
```

**Poller จะทำงานทุก 5 นาที (default)** เพื่อเก็บ metrics

### Step 3.6: ดู Dashboard

1. กลับไปที่ **Dashboard** (หน้าหลัก)
2. ตอนนี้จะเห็น:

```
Devices: 1 (Up: 1, Down: 0)
Ports: 4 (Up: 4, Down: 0)
```

3. ดู widgets ต่างๆ:
   - **Device Summary**
   - **Recent Events**
   - **Alert Summary**
   - **Port Usage**

### Step 3.7: สร้าง Traffic บน MikroTik (Optional)

เพื่อดูกราฟที่มีข้อมูล:

```bash
# SSH เข้า MikroTik
ssh admin@192.168.56.10

# Ping ไปที่ Internet (generate traffic)
[admin@MikroTik] > /ping 8.8.8.8 count=100

# หรือ
[admin@MikroTik] > /tool fetch url="http://speedtest.tele2.net/10MB.zip"
```

### Step 3.8: ตรวจสอบกราฟ

1. กลับไปที่ LibreNMS
2. **Devices** → **MikroTik-Lab-Router** → **Graphs**
3. เลือก **ether2** (NAT interface)
4. ดูกราฟ Traffic In/Out

**✅ ควรเห็นกราฟมี spike ขึ้นมา!**

### 🎉 LAB 3 Complete!

ยินดีด้วย! คุณได้สร้างระบบ Network Monitoring แบบสมบูรณ์แล้ว!

**Achievement Unlocked:**
- ✅ LibreNMS monitoring system
- ✅ MikroTik RouterOS as monitored device
- ✅ SNMP polling active
- ✅ Real-time graphs และ metrics
- ✅ Full network visibility

---

## 🧪 LAB 4: ดึงข้อมูลผ่าน LibreNMS API (Optional)

**🎯 วัตถุประสงค์:** เรียนรู้การใช้ LibreNMS API เพื่อดึงข้อมูล monitoring แบบ programmatic

**⏱️ เวลา:** 15-20 นาที

**📖 คู่มือฉบับเต็ม:** [librenms-api/librenms-api.md](librenms-api/librenms-api.md) (มีตัวอย่าง code ครบถ้วน)

### Step 4.1: สร้าง API Token

1. Login เข้า LibreNMS: `http://localhost:8000`
2. คลิก **Username** (มุมบนขวา) → **My Settings**
3. เลือกแท็บ **API Settings**
4. คลิก **Create API Token**
5. ใส่ Description: `Lab API Token`
6. คลิก **Create Token**
7. **Copy token และเก็บไว้!** (จะแสดงครั้งเดียว)

```
Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Step 4.2: ทดสอบ API ด้วย cURL

```bash
# ดึงรายการอุปกรณ์ทั้งหมด
curl -H "X-Auth-Token: YOUR_TOKEN" \
  http://localhost:8000/api/v0/devices
```

**Expected Output:**
```json
{
  "status": "ok",
  "devices": [
    {
      "device_id": 1,
      "hostname": "192.168.56.10",
      "display": "MikroTik-Lab-Router",
      "os": "routeros",
      "status": 1
    }
  ]
}
```

### Step 4.3: ดึงข้อมูล MikroTik

```bash
# ดึงข้อมูลอุปกรณ์
curl -H "X-Auth-Token: YOUR_TOKEN" \
  http://localhost:8000/api/v0/devices/192.168.56.10

# ดึงข้อมูล ports
curl -H "X-Auth-Token: YOUR_TOKEN" \
  http://localhost:8000/api/v0/devices/192.168.56.10/ports
```

### Step 4.4: ดึงสถานะ ether1 ด้วย Python

สร้างไฟล์ `check_ether1.py`:

```python
import requests
import json

API_URL = "http://localhost:8000/api/v0"
API_TOKEN = "your-token-here"  # เปลี่ยนเป็น token จริง

headers = {"X-Auth-Token": API_TOKEN}

# Get all ports
response = requests.get(
    f"{API_URL}/devices/192.168.56.10/ports",
    headers=headers
)

ports = response.json()['ports']

# Find ether1
for port in ports:
    if port['ifName'] == 'ether1':
        print(f"Interface: {port['ifName']}")
        print(f"Status:    {port['ifOperStatus'].upper()}")
        print(f"Speed:     {port['ifSpeed'] / 1000000} Mbps")
        break
```

รันสคริปต์:

```bash
python3 check_ether1.py
```

**Output:**
```
Interface: ether1
Status:    UP
Speed:     1000.0 Mbps
```

### 🎉 LAB 4 Complete!

คุณได้เรียนรู้การใช้ LibreNMS API แล้ว!

**New Skills Unlocked:**
- ✅ API authentication with tokens
- ✅ RESTful API concepts
- ✅ Programmatic data retrieval
- ✅ Python API integration

---

## 🧪 LAB 5: Node-RED + MQTT Integration (Optional)

**🎯 วัตถุประสงค์:** ใช้ Node-RED เป็น Flow-based platform ดึงข้อมูลจาก LibreNMS API และส่งต่อผ่าน MQTT

**⏱️ เวลา:** 15-20 นาที

**📖 คู่มือฉบับเต็ม:** [nodered/nodered.md](nodered/nodered.md) (มี advanced flows และ troubleshooting)

### Step 5.1: เตรียม Environment

```bash
# เข้าโฟลเดอร์ Node-RED
cd nodered

# สร้าง directories สำหรับ Mosquitto MQTT Broker
mkdir -p mosquitto/config mosquitto/data mosquitto/log nodered_data

# สร้างไฟล์ config สำหรับ Mosquitto
cat > mosquitto/config/mosquitto.conf << 'EOF'
listener 1883
allow_anonymous true
listener 9001
protocol websockets
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
EOF
```

### Step 5.2: เชื่อมต่อ Docker Network

```bash
# สร้าง network (ถ้ายังไม่มี)
docker network create monitoring_network

# Connect LibreNMS container เข้า network
docker network connect monitoring_network librenms
```

### Step 5.3: Start Node-RED และ MQTT Broker

```bash
# Start services
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

**Expected Output:**
```
NAME        STATUS    PORTS
nodered     Up        0.0.0.0:1880->1880/tcp
mosquitto   Up        0.0.0.0:1883->1883/tcp, 0.0.0.0:9001->9001/tcp
```

### Step 5.4: เข้าถึง Node-RED

1. เปิด Web Browser
2. ไปที่: **http://localhost:1880**
3. คุณจะเห็น Node-RED Flow Editor

### Step 5.5: Import Flow Example

1. คลิก **Menu (≡)** มุมบนขวา
2. เลือก **Import**
3. คลิก **select a file to import**
4. เลือกไฟล์ `flow-example.json`
5. คลิก **Import**

**ควรเห็น Flow ที่มี 5 nodes:**
- 🔵 Inject (Every 1 minute)
- 🟦 HTTP Request (Get ether1 status)
- 🟨 Function (Extract ether1 data)
- 🟪 MQTT Out (Publish to MQTT)
- 🟩 Debug (Output)

### Step 5.6: แก้ไข API Token

1. **Double-click** ที่ node **"Get ether1 status"** (HTTP Request)
2. ในส่วน **Headers** → แก้ไข `X-Auth-Token`
3. ใส่ API Token จาก LAB 4
4. คลิก **Done**

### Step 5.7: Deploy Flow

1. คลิกปุ่ม **Deploy** มุมบนขวา
2. รอจนเห็นข้อความ **"Successfully deployed"**

### Step 5.8: ทดสอบ Flow

**วิธีที่ 1: คลิกปุ่มทดสอบ**

1. คลิกที่ปุ่มสีน้ำเงินซ้ายมือของ node **"Every 1 minute"**
2. ดูใน **Debug** tab ขวามือ
3. ควรเห็น JSON output พร้อมข้อมูล ether1

**Expected Output:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "interface": "ether1",
  "status": "up",
  "adminStatus": "up",
  "speed": 1000,
  "mtu": 1500,
  "macAddress": "XX:XX:XX:XX:XX:XX",
  "statistics": {
    "inOctets": 123456,
    "outOctets": 789012,
    "inPackets": 1234,
    "outPackets": 5678,
    "inErrors": 0,
    "outErrors": 0
  }
}
```

### Step 5.9: Subscribe to MQTT Messages

เปิด Terminal ใหม่:

```bash
# Subscribe to MQTT topic
docker run --rm --network monitoring_network eclipse-mosquitto:2.0 \
  mosquitto_sub -h mosquitto -t "mikrotik/ether1/status" -v
```

หรือใช้ mosquitto_sub บนเครื่อง host:

```bash
mosquitto_sub -h localhost -t "mikrotik/ether1/status" -v
```

**Expected Output:**
```
mikrotik/ether1/status {"timestamp":"2024-01-15T10:30:00.000Z","interface":"ether1","status":"up",...}
```

### Step 5.10: ทดสอบ Real-time Monitoring

1. Flow จะทำงานอัตโนมัติทุก **1 นาที**
2. คลิกปุ่มทดสอบอีกครั้ง เพื่อส่งข้อมูลทันที
3. ดูข้อมูลใน Terminal ที่รัน mosquitto_sub

**✅ ถ้าเห็นข้อมูลใน Terminal = MQTT working!**

### Step 5.11: ดู MQTT Broker Logs (Optional)

```bash
# ดู Mosquitto logs
docker-compose logs -f mosquitto

# ควรเห็น connection และ publish messages
```

### 🎉 LAB 5 Complete!

ยินดีด้วย! คุณได้สร้าง IoT Integration Pipeline แล้ว!

**Achievement Unlocked:**
- ✅ Node-RED flow-based programming
- ✅ MQTT broker setup (Mosquitto)
- ✅ LibreNMS API integration ผ่าน Node-RED
- ✅ Real-time data streaming via MQTT
- ✅ IoT-ready monitoring system

**MQTT Topic Structure:**
```
mikrotik/ether1/status  → สถานะ ether1
mikrotik/+/status       → สถานะทุก interface (wildcard)
mikrotik/#              → ทุก message จาก mikrotik
```

---

## 🎓 Lab Summary

### สิ่งที่คุณได้ทำใน Lab นี้

1. **LAB 1:** ติดตั้ง LibreNMS monitoring system ด้วย Docker Compose (4 containers)
2. **LAB 2:** สร้าง MikroTik RouterOS VM พร้อม 4 network interfaces และเปิด SNMP
3. **LAB 3:** เชื่อมต่อและ monitor MikroTik ผ่าน LibreNMS
4. **LAB 4:** ดึงข้อมูล monitoring ผ่าน API (Optional)
5. **LAB 5:** สร้าง IoT pipeline ด้วย Node-RED + MQTT (Optional)

### Metrics ที่ Monitor ได้

- ✅ Device uptime และ availability
- ✅ Interface status (Up/Down)
- ✅ Traffic In/Out (bandwidth usage)
- ✅ Packet rates (pps)
- ✅ Error และ discard counters
- ✅ CPU และ memory usage
- ✅ System information

### Network Protocols ที่ใช้

- **SNMP v2c:** สำหรับ polling metrics (UDP port 161)
- **ICMP:** สำหรับ ping monitoring
- **HTTP:** สำหรับ web interface (TCP port 8000)
- **SSH:** สำหรับ management (TCP port 22)
- **MQTT:** สำหรับ IoT messaging (TCP port 1883)

---

## 📚 คู่มือเพิ่มเติม

### 📖 [LibreNMS - คู่มือฉบับสมบูรณ์](librenms/librenms.md)

รายละเอียดครบถ้วนเกี่ยวกับ LibreNMS:
- 🏗️ Architecture diagrams (Mermaid)
- ⚙️ Configuration reference
- 🔧 Advanced commands
- 💾 Backup & restore
- 🔍 Troubleshooting (10+ ปัญหา)
- 🎯 Best practices

### 🔧 [MikroTik RouterOS - คู่มือฉบับสมบูรณ์](mikrotik/mikrotik.md)

รายละเอียดครบถ้วนเกี่ยวกับ MikroTik:
- 📦 Import & setup VirtualBox
- 🌐 Network configuration details
- 🔊 SNMP configuration (CLI + GUI)
- ➕ Device management
- 🔍 Troubleshooting (8+ ปัญหา)
- 🎯 Security best practices

### 🔌 [LibreNMS API - คู่มือฉบับสมบูรณ์](librenms-api/librenms-api.md)

รายละเอียดครบถ้วนเกี่ยวกับ LibreNMS API:
- 🔑 API Token creation และ management
- 🔌 Authentication และ connection
- 📡 API Endpoints reference
- 💻 ตัวอย่าง code (Python, JavaScript, cURL)
- 🎯 ดึงข้อมูล MikroTik ผ่าน API
- ⚠️ Error handling และ best practices
- 🔒 Security considerations

### 🔄 [Node-RED + MQTT - คู่มือฉบับสมบูรณ์](nodered/nodered.md)

รายละเอียดครบถ้วนเกี่ยวกับ Node-RED และ MQTT:
- 🏗️ Architecture overview (LibreNMS → Node-RED → MQTT)
- 🐳 Docker Compose setup (Node-RED + Mosquitto)
- 🔄 Flow-based programming concepts
- 📡 MQTT topics และ payload structure
- 💻 ตัวอย่าง Flows (basic + advanced)
- 🎯 Real-time monitoring และ alerts
- 🐛 Troubleshooting และ best practices

---

## 🔧 คำสั่งที่ใช้บ่อย

### LibreNMS (Docker)

```bash
# Start/Stop services
docker-compose up -d
docker-compose stop
docker-compose restart

# ดู logs
docker-compose logs -f librenms

# เข้า container shell
docker exec -it librenms bash

# เพิ่มอุปกรณ์
docker exec librenms lnms device:add <ip> -c <community>

# Poll ทันที
docker exec librenms lnms device:poll <ip> -vvv

# Validate configuration
docker exec librenms lnms validate
```

### MikroTik RouterOS

```bash
# SSH login
ssh admin@192.168.56.10

# ดู interfaces
/interface print

# ดู IP addresses
/ip address print

# ตรวจสอบ SNMP
/snmp print
/snmp community print

# ดู system resources
/system resource print

# Backup config
/export file=backup
```

### VirtualBox

```bash
# Start VM (headless)
VBoxManage startvm "MikroTik-Router" --type headless

# Stop VM
VBoxManage controlvm "MikroTik-Router" poweroff

# List VMs
VBoxManage list vms

# Show VM info
VBoxManage showvminfo "MikroTik-Router"
```

---

## 🆘 Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. LibreNMS ไม่สามารถ poll MikroTik

**ตรวจสอบ:**
```bash
# Test ping
docker exec librenms ping -c 3 192.168.56.10

# Test SNMP
docker exec librenms snmpwalk -v 2c -c public 192.168.56.10 system

# ดู poller logs
docker-compose logs -f dispatcher
```

**แก้ไข:**
- ตรวจสอบว่า MikroTik SNMP enabled: `/snmp print`
- ตรวจสอบ community string: `/snmp community print`
- ตรวจสอบ network connectivity

#### 2. MikroTik ไม่ได้รับ IP Address

**แก้ไข:**
```bash
# SSH เข้า MikroTik (ผ่าน VirtualBox console)
[admin@MikroTik] > /ip address add address=192.168.56.10/24 interface=ether1
[admin@MikroTik] > /ip address print
```

#### 3. Graphs ไม่แสดงข้อมูล

**รอ 5-10 นาที** เพื่อให้ poller เก็บข้อมูลพอ

```bash
# Force poll ทันที
docker exec librenms lnms device:poll 192.168.56.10 -vvv
```

**ดูคู่มือ Troubleshooting แบบละเอียดที่:**
- [LibreNMS Troubleshooting](librenms/librenms.md#การแก้ไขปัญหา)
- [MikroTik Troubleshooting](mikrotik/mikrotik.md#ตรวจสอบและแก้ไขปัญหา)

---

## 🎯 Next Steps

หลังจากจบ Lab แล้ว คุณสามารถ:

### 1. เพิ่มอุปกรณ์เพิ่มเติม
- สร้าง MikroTik VM ตัวที่ 2
- เพิ่ม Linux server
- เพิ่ม Windows machine (ถ้ามี SNMP)

### 2. ตั้งค่า Alerts
- Alert เมื่อ device down
- Alert เมื่อ bandwidth สูง
- Alert เมื่อ CPU/Memory สูง

### 3. สร้าง Custom Dashboards
- Dashboard สำหรับ overview
- Dashboard ต่อ team/location
- Widget ต่างๆ ตามต้องการ

### 4. Advanced Configuration
- ตั้งค่า SNMP v3 (secure)
- API integration
- External alerting (Email, Slack, Discord)
- Backup automation

---

## 📞 Resources

### Official Documentation
- [LibreNMS Docs](https://docs.librenms.org/)
- [MikroTik Wiki](https://wiki.mikrotik.com/)
- [Docker Docs](https://docs.docker.com/)
- [VirtualBox Manual](https://www.virtualbox.org/manual/)

### Community
- [LibreNMS Community](https://community.librenms.org/)
- [LibreNMS Discord](https://discord.gg/librenms)
- [MikroTik Forum](https://forum.mikrotik.com/)

---

## 📝 License

โปรเจคนี้ใช้งานสำหรับการศึกษาและพัฒนา

- LibreNMS: GPL v3.0
- MikroTik RouterOS: Commercial License

---

<div align="center">

## 🎉 Congratulations!

**คุณได้เรียนรู้การสร้างระบบ Network Monitoring แบบ Professional แล้ว!**

*ดูเอกสารเพิ่มเติม:*
- [📖 LibreNMS Full Guide](librenms/librenms.md)
- [🔧 MikroTik Full Guide](mikrotik/mikrotik.md)

**Happy Monitoring! 🚀**

</div>
