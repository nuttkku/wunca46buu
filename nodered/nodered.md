# 🔄 Node-RED + MQTT Integration Guide

คู่มือการติดตั้ง Node-RED และตั้งค่า Flow-based Programming เพื่อดึงข้อมูลจาก LibreNMS API และส่งต่อผ่าน MQTT

---

## 📋 สารบัญ

- [ภาพรวม](#ภาพรวม)
- [Architecture](#architecture)
- [ติดตั้ง Node-RED + MQTT](#ติดตั้ง-node-red--mqtt)
- [ตั้งค่า Flow](#ตั้งค่า-flow)
- [ทดสอบระบบ](#ทดสอบระบบ)
- [MQTT Topics](#mqtt-topics)
- [Troubleshooting](#troubleshooting)

---

## 🎯 ภาพรวม

### สิ่งที่จะได้เรียนรู้

- ✅ ติดตั้ง Node-RED และ Mosquitto MQTT broker
- ✅ สร้าง Flow สำหรับดึงข้อมูล API
- ✅ ตั้งค่า Inject node ให้ทำงานทุก 1 นาที
- ✅ ส่งข้อมูลผ่าน MQTT protocol
- ✅ Subscribe และดูข้อมูลจาก MQTT

### Use Case

**Scenario:** ระบบ IoT ที่ต้องการข้อมูล network monitoring แบบ real-time

```
LibreNMS API → Node-RED → MQTT Broker → IoT Devices/Applications
```

**ตัวอย่างการใช้งาน:**
- Dashboard แสดงสถานะ network
- Alert system ที่ทำงานผ่าน MQTT
- Integration กับระบบอื่นๆ
- Data logging และ analytics

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐│
│  │  LibreNMS    │      │  Node-RED    │    │  Mosquitto  ││
│  │  (API)       │◄─────┤  (Flow)      │───►│  (MQTT)     ││
│  │  :8000       │ HTTP │  :1880       │MQTT│  :1883      ││
│  └──────────────┘      └──────────────┘    └─────────────┘│
│         │                     │                    │        │
│         │                     │                    │        │
└─────────┼─────────────────────┼────────────────────┼────────┘
          │                     │                    │
          ▼                     ▼                    ▼
    API Requests         Web Interface        MQTT Clients
```

### Data Flow

```
[Timer: Every 1 min]
        │
        ▼
[HTTP Request Node]
   GET /api/v0/devices/192.168.56.10/ports
        │
        ▼
[Function Node]
   - Parse JSON
   - Extract ether1 data
   - Format message
        │
        ▼
[MQTT Output Node]
   Topic: mikrotik/ether1/status
   Payload: {"status": "up", "speed": 1000, ...}
        │
        ▼
[MQTT Broker]
   - Store & Forward
   - Publish to subscribers
        │
        ▼
[MQTT Subscribers]
   - IoT devices
   - Dashboards
   - Other applications
```

---

## 🚀 ติดตั้ง Node-RED + MQTT

### วิธีที่ 1: ใช้ Docker Compose (แนะนำ)

#### Step 1: สร้างไฟล์ docker-compose.yml

สร้างไฟล์ `nodered/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Mosquitto MQTT Broker
  mosquitto:
    image: eclipse-mosquitto:2.0
    container_name: mosquitto
    ports:
      - "1883:1883"      # MQTT
      - "9001:9001"      # WebSocket
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
    restart: unless-stopped

  # Node-RED
  nodered:
    image: nodered/node-red:latest
    container_name: nodered
    ports:
      - "1880:1880"
    volumes:
      - ./nodered_data:/data
    environment:
      - TZ=Asia/Bangkok
    depends_on:
      - mosquitto
    restart: unless-stopped

networks:
  default:
    name: monitoring_network
    external: true
```

#### Step 2: สร้าง Mosquitto Configuration

สร้างไฟล์ `mosquitto/config/mosquitto.conf`:

```conf
# Mosquitto Configuration
listener 1883
allow_anonymous true

# WebSocket support
listener 9001
protocol websockets

# Persistence
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_type all
log_timestamp true
```

#### Step 3: สร้าง Network (ถ้ายังไม่มี)

```bash
# สร้าง Docker network เดียวกับ LibreNMS
docker network create monitoring_network

# หรือถ้ามีอยู่แล้ว ให้ LibreNMS join network นี้
docker network connect monitoring_network librenms
```

#### Step 4: Start Services

```bash
# เข้าโฟลเดอร์
cd nodered

# สร้าง directories
mkdir -p mosquitto/config mosquitto/data mosquitto/log nodered_data

# สร้างไฟล์ config
cat > mosquitto/config/mosquitto.conf << 'EOF'
listener 1883
allow_anonymous true
listener 9001
protocol websockets
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
EOF

# Start containers
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

**Expected Output:**
```
NAME        IMAGE                      STATUS      PORTS
mosquitto   eclipse-mosquitto:2.0      Up          0.0.0.0:1883->1883/tcp, 0.0.0.0:9001->9001/tcp
nodered     nodered/node-red:latest    Up          0.0.0.0:1880->1880/tcp
```

#### Step 5: เข้าใช้งาน Node-RED

เปิดเว็บเบราว์เซอร์:
```
http://localhost:1880
```

คุณจะเห็น Node-RED Editor interface!

---

## 🔧 ตั้งค่า Flow

### Flow Overview

Flow ที่จะสร้างประกอบด้วย:
1. **Inject Node** - Trigger ทุก 1 นาที
2. **HTTP Request Node** - เรียก LibreNMS API
3. **Function Node** - ประมวลผล JSON
4. **MQTT Output Node** - ส่งข้อมูลไปยัง MQTT broker
5. **Debug Node** - แสดงผลใน Debug panel

### Step 1: ติดตั้ง Node ที่จำเป็น

Node-RED มี HTTP Request และ MQTT nodes built-in อยู่แล้ว ไม่ต้องติดตั้งเพิ่ม

### Step 2: สร้าง Flow

#### 1. เพิ่ม Inject Node

1. ลาก **inject** node จาก palette (ซ้าย) มาวางใน workspace
2. Double-click เพื่อตั้งค่า:
   - **Name:** `Every 1 minute`
   - **Repeat:** `interval`
   - **Every:** `1` `minutes`
   - คลิก **Done**

#### 2. เพิ่ม HTTP Request Node

1. ลาก **http request** node มาวาง
2. Double-click เพื่อตั้งค่า:
   - **Name:** `Get ether1 status`
   - **Method:** `GET`
   - **URL:** `http://librenms:8000/api/v0/devices/192.168.56.10/ports`
   - **Headers:**
     ```
     X-Auth-Token: your-api-token-here
     ```
     (คลิก + เพื่อเพิ่ม header)
   - **Return:** `a parsed JSON object`
   - คลิก **Done**

**หมายเหตุ:** ใช้ `librenms` แทน `localhost` เพราะอยู่ใน Docker network เดียวกัน

#### 3. เพิ่ม Function Node

1. ลาก **function** node มาวาง
2. Double-click เพื่อตั้งค่า:
   - **Name:** `Extract ether1 data`
   - **Function:**
     ```javascript
     // Extract ports from response
     const ports = msg.payload.ports;

     // Find ether1
     const ether1 = ports.find(p => p.ifName === 'ether1');

     if (!ether1) {
         node.error('ether1 not found', msg);
         return null;
     }

     // Create message for MQTT
     msg.payload = {
         timestamp: new Date().toISOString(),
         interface: ether1.ifName,
         status: ether1.ifOperStatus,
         adminStatus: ether1.ifAdminStatus,
         speed: ether1.ifSpeed / 1000000, // Convert to Mbps
         mtu: ether1.ifMtu,
         macAddress: ether1.ifPhysAddress,
         statistics: {
             inOctets: ether1.ifInOctets || 0,
             outOctets: ether1.ifOutOctets || 0,
             inPackets: ether1.ifInUcastPkts || 0,
             outPackets: ether1.ifOutUcastPkts || 0,
             inErrors: ether1.ifInErrors || 0,
             outErrors: ether1.ifOutErrors || 0
         }
     };

     // Set MQTT topic
     msg.topic = 'mikrotik/ether1/status';

     return msg;
     ```
   - คลิก **Done**

#### 4. เพิ่ม MQTT Output Node

1. ลาก **mqtt out** node มาวาง
2. Double-click เพื่อตั้งค่า:
   - **Server:** คลิก pencil icon เพื่อเพิ่ม broker
     - **Server:** `mosquitto` (ชื่อ container)
     - **Port:** `1883`
     - **Client ID:** ปล่อยว่าง (auto-generate)
     - คลิก **Add**
   - **Topic:** ปล่อยว่าง (ใช้จาก msg.topic)
   - **QoS:** `0`
   - **Retain:** เปิดเพื่อเก็บ last message
   - **Name:** `Publish to MQTT`
   - คลิก **Done**

#### 5. เพิ่ม Debug Node (Optional)

1. ลาก **debug** node มาวาง
2. ต่อจาก Function node (ก่อน MQTT out)
3. Double-click:
   - **Output:** `complete msg object`
   - **Name:** `Debug output`
   - คลิก **Done**

### Step 3: เชื่อมต่อ Nodes

เชื่อมต่อ nodes ตามลำดับ:

```
[Inject] → [HTTP Request] → [Function] → [MQTT Out]
                                   ↓
                              [Debug]
```

1. คลิกที่ output port (จุดขวา) ของ Inject node
2. ลากไปที่ input port (จุดซ้าย) ของ HTTP Request node
3. ทำแบบเดียวกันสำหรับ nodes อื่นๆ

### Step 4: Deploy Flow

1. คลิกปุ่ม **Deploy** (มุมบนขวา)
2. เลือก **Full** (deploy ทั้งหมด)
3. คลิก **Deploy**

**ถ้าสำเร็จ:** จะเห็นข้อความ "Successfully deployed"

### Step 5: ทดสอบ Flow

1. คลิกที่ปุ่ม (square) ทางซ้ายของ Inject node เพื่อทดสอบทันที
2. ดูผลลัพธ์ใน Debug panel (ด้านขวา)

**Expected Output:**
```json
{
  "timestamp": "2026-02-09T15:30:00.000Z",
  "interface": "ether1",
  "status": "up",
  "adminStatus": "up",
  "speed": 1000,
  "mtu": 1500,
  "macAddress": "00:11:22:33:44:aa",
  "statistics": {
    "inOctets": 1234567,
    "outOctets": 987654,
    ...
  }
}
```

---

## 📡 MQTT Topics

### Topic Structure

```
mikrotik/
├── ether1/
│   ├── status          # สถานะและข้อมูลทั้งหมด
│   ├── uptime          # (optional) uptime
│   └── alerts          # (optional) alerts
├── ether2/
│   └── status
└── device/
    └── info            # (optional) device information
```

### Topic: `mikrotik/ether1/status`

**Payload Format:**
```json
{
  "timestamp": "2026-02-09T15:30:00.000Z",
  "interface": "ether1",
  "status": "up",
  "adminStatus": "up",
  "speed": 1000,
  "mtu": 1500,
  "macAddress": "00:11:22:33:44:aa",
  "statistics": {
    "inOctets": 1234567,
    "outOctets": 987654,
    "inPackets": 10000,
    "outPackets": 8000,
    "inErrors": 0,
    "outErrors": 0
  }
}
```

### Subscribe ใน MQTT Client

```bash
# ติดตั้ง mosquitto-clients (ถ้ายังไม่มี)
# Ubuntu/Debian
sudo apt-get install mosquitto-clients

# macOS
brew install mosquitto

# Windows: Download from mosquitto.org

# Subscribe to topic
mosquitto_sub -h localhost -t "mikrotik/ether1/status" -v

# Subscribe to all mikrotik topics
mosquitto_sub -h localhost -t "mikrotik/#" -v
```

**Output:**
```
mikrotik/ether1/status {"timestamp":"2026-02-09T15:30:00.000Z","interface":"ether1",...}
```

---

## 🧪 ทดสอบระบบ

### 1. ทดสอบ MQTT Broker

```bash
# Terminal 1: Subscribe
docker exec -it mosquitto mosquitto_sub -t "test/topic" -v

# Terminal 2: Publish
docker exec -it mosquitto mosquitto_pub -t "test/topic" -m "Hello MQTT"
```

**ถ้าเห็น "Hello MQTT" ใน Terminal 1 = MQTT ทำงานถูกต้อง!**

### 2. ทดสอบ Node-RED Flow

1. เปิด Node-RED: `http://localhost:1880`
2. คลิกปุ่มทดสอบที่ Inject node
3. ดู Debug panel (ขวามือ)
4. ตรวจสอบว่ามีข้อมูลแสดงหรือไม่

### 3. ทดสอบ MQTT Output

```bash
# Subscribe to mikrotik topic
mosquitto_sub -h localhost -t "mikrotik/ether1/status" -v

# ใน Node-RED คลิกปุ่มทดสอบ Inject node
# ควรเห็นข้อมูลปรากฏใน terminal
```

### 4. ทดสอบ Auto-Trigger

รอ 1 นาที และตรวจสอบว่า Flow ทำงานอัตโนมัติหรือไม่

```bash
# Monitor MQTT messages
mosquitto_sub -h localhost -t "mikrotik/#" -v

# ควรเห็นข้อมูลเข้ามาทุก 1 นาที
```

---

## 📊 Dashboard (Optional)

### วิธีที่ 1: Node-RED Dashboard

#### ติดตั้ง Dashboard Nodes

1. ใน Node-RED คลิก **Menu** (≡) → **Manage palette**
2. ไปที่แท็บ **Install**
3. ค้นหา `node-red-dashboard`
4. คลิก **Install**

#### สร้าง Dashboard

1. เพิ่ม **gauge** node (จาก dashboard)
2. ต่อจาก Function node
3. ตั้งค่า:
   - **Label:** `ether1 Status`
   - **Value format:** `{{value}}`
   - **Units:** `Mbps`
   - **Range:** `0` to `1000`

4. เข้าดู Dashboard:
   ```
   http://localhost:1880/ui
   ```

### วิธีที่ 2: External Dashboard (Grafana, etc.)

สามารถใช้ MQTT client ใน Grafana หรือ dashboard อื่นๆ เพื่อ subscribe และแสดงผลข้อมูล

---

## 🔄 Advanced Flows

### Flow 1: Alert when ether1 is down

```javascript
// Function node
const ports = msg.payload.ports;
const ether1 = ports.find(p => p.ifName === 'ether1');

if (ether1 && ether1.ifOperStatus !== 'up') {
    msg.payload = {
        timestamp: new Date().toISOString(),
        alert: 'ether1 is DOWN',
        interface: 'ether1',
        status: ether1.ifOperStatus
    };
    msg.topic = 'mikrotik/alerts/ether1';
    return msg;
}

return null; // Don't send if status is up
```

### Flow 2: Calculate bandwidth usage

```javascript
// Store previous values in context
const prevOctets = context.get('prevOctets') || {};
const prevTime = context.get('prevTime') || Date.now();

const ports = msg.payload.ports;
const ether1 = ports.find(p => p.ifName === 'ether1');

if (!ether1) return null;

const currentTime = Date.now();
const timeDiff = (currentTime - prevTime) / 1000; // seconds

let bandwidth = null;

if (prevOctets.in !== undefined) {
    const inDiff = ether1.ifInOctets - prevOctets.in;
    const outDiff = ether1.ifOutOctets - prevOctets.out;

    bandwidth = {
        inMbps: (inDiff * 8 / timeDiff / 1000000).toFixed(2),
        outMbps: (outDiff * 8 / timeDiff / 1000000).toFixed(2)
    };
}

// Store current values
context.set('prevOctets', {
    in: ether1.ifInOctets,
    out: ether1.ifOutOctets
});
context.set('prevTime', currentTime);

if (bandwidth) {
    msg.payload = {
        timestamp: new Date().toISOString(),
        interface: 'ether1',
        bandwidth: bandwidth
    };
    msg.topic = 'mikrotik/ether1/bandwidth';
    return msg;
}

return null;
```

### Flow 3: Multiple devices monitoring

Loop ผ่านหลาย devices:

```javascript
// Function node
const devices = [
    { ip: '192.168.56.10', name: 'MikroTik-1' },
    { ip: '192.168.56.11', name: 'MikroTik-2' }
];

const messages = [];

devices.forEach(device => {
    messages.push({
        url: `http://librenms:8000/api/v0/devices/${device.ip}/ports`,
        headers: {
            'X-Auth-Token': 'your-token-here'
        },
        deviceName: device.name
    });
});

return [messages]; // Send array of messages
```

---

## 🐛 Troubleshooting

### ปัญหา: Node-RED ไม่สามารถเชื่อมต่อ LibreNMS

**อาการ:**
```
Error: getaddrinfo ENOTFOUND librenms
```

**แก้ไข:**
1. ตรวจสอบว่าทั้ง 2 containers อยู่ใน network เดียวกัน:
   ```bash
   docker network inspect monitoring_network
   ```

2. ถ้าไม่ได้อยู่ใน network เดียวกัน:
   ```bash
   docker network connect monitoring_network librenms
   docker network connect monitoring_network nodered
   ```

3. หรือใช้ IP address แทน hostname:
   ```
   http://172.18.0.2:8000/api/v0/...
   ```

### ปัญหา: MQTT connection failed

**อาการ:**
```
Error: connect ECONNREFUSED mosquitto:1883
```

**แก้ไข:**
1. ตรวจสอบว่า Mosquitto ทำงาน:
   ```bash
   docker-compose ps mosquitto
   ```

2. ทดสอบ connection:
   ```bash
   docker exec -it nodered nc -zv mosquitto 1883
   ```

3. Restart Mosquitto:
   ```bash
   docker-compose restart mosquitto
   ```

### ปัญหา: HTTP Request returns 401

**อาการ:**
```
Error: Unauthorized (401)
```

**แก้ไข:**
- ตรวจสอบ API Token ถูกต้องหรือไม่
- ตรวจสอบ Header format:
  ```
  X-Auth-Token: your-actual-token
  ```
- สร้าง Token ใหม่ใน LibreNMS

### ปัญหา: No data in MQTT

**แก้ไข:**
1. ตรวจสอบ Debug node output
2. ตรวจสอบ Function node ทำงานถูกต้อง
3. Subscribe to MQTT:
   ```bash
   mosquitto_sub -h localhost -t "#" -v
   ```
4. ตรวจสอบ Mosquitto logs:
   ```bash
   docker-compose logs mosquitto
   ```

---

## 📚 Export/Import Flow

### Export Flow

1. เลือก nodes ที่ต้องการ (หรือทั้งหมด)
2. **Menu** → **Export**
3. เลือก **Selected nodes** หรือ **Current flow**
4. คลิก **Download** เพื่อบันทึกเป็นไฟล์ JSON

### Import Flow

1. **Menu** → **Import**
2. เลือก **select a file to import**
3. เลือกไฟล์ JSON
4. คลิก **Import**

### Example Flow JSON

บันทึกเป็นไฟล์ `flow.json`:

```json
[
  {
    "id": "inject1",
    "type": "inject",
    "name": "Every 1 minute",
    "repeat": "60",
    "crontab": "",
    "once": false,
    "x": 150,
    "y": 100,
    "wires": [["http1"]]
  },
  {
    "id": "http1",
    "type": "http request",
    "name": "Get ether1 status",
    "method": "GET",
    "url": "http://librenms:8000/api/v0/devices/192.168.56.10/ports",
    "headers": [
      {"keyType": "other", "keyValue": "X-Auth-Token", "valueType": "other", "valueValue": "your-token"}
    ],
    "ret": "obj",
    "x": 350,
    "y": 100,
    "wires": [["function1"]]
  }
]
```

---

## 🎯 Best Practices

### 1. Security

**✅ DO:**
- เปลี่ยน Mosquitto config เพื่อใช้ authentication
- ใช้ TLS/SSL สำหรับ MQTT (production)
- จำกัด network access
- เปลี่ยน API token เป็นระยะ

**❌ DON'T:**
- Hard-code credentials ใน Flow
- เปิด MQTT port ออก Internet
- ใช้ `allow_anonymous true` ใน production

### 2. Performance

- ใช้ QoS 0 สำหรับ non-critical messages
- Enable MQTT retain สำหรับ status messages
- ใช้ compression สำหรับ payload ขนาดใหญ่
- Monitor Node-RED memory usage

### 3. Monitoring

- เปิด Debug nodes ในระหว่างพัฒนา
- ปิด Debug nodes ใน production
- Monitor MQTT broker metrics
- Log errors และ alerts

---

## 📖 Resources

### Official Documentation
- [Node-RED Docs](https://nodered.org/docs/)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [MQTT Protocol](https://mqtt.org/)
- [LibreNMS API](https://docs.librenms.org/API/)

### Node-RED Flows
- [Node-RED Flow Library](https://flows.nodered.org/)
- [MQTT Examples](https://flows.nodered.org/?term=mqtt)

### Tools
- [MQTT Explorer](http://mqtt-explorer.com/) - GUI MQTT client
- [MQTTX](https://mqttx.app/) - Modern MQTT client

---

## 📝 Summary

คุณได้เรียนรู้:
- ✅ ติดตั้ง Node-RED และ Mosquitto MQTT broker
- ✅ สร้าง Flow สำหรับดึงข้อมูล API
- ✅ ตั้งค่า Timer ให้ทำงานทุก 1 นาที
- ✅ ส่งข้อมูลผ่าน MQTT protocol
- ✅ Subscribe และรับข้อมูลจาก MQTT
- ✅ Troubleshooting และ best practices

ตอนนี้คุณสามารถสร้าง IoT integration และ automation workflows ได้แล้ว! 🚀

---

**Happy Flow-based Programming! 🔄**

*Last Updated: 2026-02-09*
