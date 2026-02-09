# 🔄 Node-RED + MQTT Integration

คู่มือการติดตั้ง Node-RED และตั้งค่า Flow-based Programming เพื่อดึงข้อมูลจาก LibreNMS API และส่งต่อผ่าน MQTT Broker ที่รันภายใน Node-RED

---

## 📋 สารบัญ

- [ภาพรวม](#ภาพรวม)
- [Architecture](#architecture)
- [ติดตั้ง Node-RED](#ติดตั้ง-node-red)
- [ตั้งค่า MQTT Broker](#ตั้งค่า-mqtt-broker)
- [ตั้งค่า Flow](#ตั้งค่า-flow)
- [ทดสอบระบบ](#ทดสอบระบบ)
- [MQTT Topics](#mqtt-topics)
- [Troubleshooting](#troubleshooting)

---

## 🎯 ภาพรวม

### สิ่งที่จะได้เรียนรู้

- ✅ ติดตั้ง Node-RED ด้วย Docker
- ✅ ตั้งค่า MQTT Broker ใน Node-RED (ไม่ต้อง container แยก)
- ✅ สร้าง Flow สำหรับดึงข้อมูล API
- ✅ ตั้งค่า Inject node ให้ทำงานทุก 1 นาที
- ✅ ส่งข้อมูลผ่าน MQTT protocol

### Use Case

**Scenario:** ระบบ IoT ที่ต้องการข้อมูล network monitoring แบบ real-time

```
LibreNMS API → Node-RED → MQTT Broker (Aedes) → IoT Devices/Applications
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
│  ┌──────────────┐      ┌────────────────────────────────┐  │
│  │  LibreNMS    │      │       Node-RED                 │  │
│  │  (API)       │◄─────┤  ┌──────────┐  ┌───────────┐  │  │
│  │  :8000       │ HTTP │  │ Flow     │  │   Aedes   │  │  │
│  └──────────────┘      │  │ Logic    │─►│   MQTT    │  │  │
│         │              │  └──────────┘  │  Broker   │  │  │
│         │              │                 └───────────┘  │  │
│         │              │      :1880           :1883     │  │
└─────────┼──────────────┴──────────┬────────────┬────────┴──┘
          │                         │            │
          ▼                         ▼            ▼
    API Requests             Web Interface  MQTT Clients
```

**หมายเหตุ:** MQTT Broker รันภายใน Node-RED container เดียวกัน ไม่ต้องรัน Mosquitto แยก

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
[Aedes MQTT Broker]
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

## 🚀 ติดตั้ง Node-RED

### Step 1: เตรียม Environment

```bash
# เข้าโฟลเดอร์
cd nodered

# สร้าง directory สำหรับ Node-RED data
mkdir -p nodered_data
```

### Step 2: สร้าง Docker Network (ถ้ายังไม่มี)

```bash
# สร้าง Docker network เดียวกับ LibreNMS
docker network create monitoring_network

# หรือถ้ามีอยู่แล้ว ให้ LibreNMS join network นี้
docker network connect monitoring_network librenms
```

### Step 3: Start Node-RED

```bash
# Start Node-RED container
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

**Expected Output:**
```
NAME        IMAGE                      STATUS      PORTS
nodered     nodered/node-red:latest    Up          0.0.0.0:1880->1880/tcp, 0.0.0.0:1883->1883/tcp
```

### Step 4: เข้าใช้งาน Node-RED

เปิดเว็บเบราว์เซอร์:
```
http://localhost:1880
```

คุณจะเห็น Node-RED Editor interface!

---

## 🔧 ตั้งค่า MQTT Broker

ใช้ **Aedes MQTT Broker** ซึ่งรันภายใน Node-RED โดยไม่ต้อง container แยก

### Step 1: ติดตั้ง Aedes Node

1. ใน Node-RED คลิก **Menu (≡)** → **Manage palette**
2. ไปที่แท็บ **Install**
3. ค้นหา `node-red-contrib-aedes`
4. คลิก **Install**
5. คลิก **Install** อีกครั้งเพื่อยืนยัน
6. รอจนการติดตั้งเสร็จ (ประมาณ 30 วินาที)

### Step 2: เพิ่ม Aedes Broker Node

1. หลังจากติดตั้งเสร็จ ใน **Node Palette** (ซ้ายมือ) จะเห็น node ใหม่ชื่อ **aedes broker**
2. ลาก **aedes broker** node มาวางใน workspace
3. Double-click เพื่อตั้งค่า:
   - **Name:** `MQTT Broker`
   - **Port:** `1883`
   - **Options:**
     - ✅ เปิด **Publish persistent**
   - คลิก **Done**

### Step 3: Deploy MQTT Broker

1. คลิกปุ่ม **Deploy** (มุมบนขวา)
2. MQTT Broker จะเริ่มทำงานทันที

**หมายเหตุ:** Aedes broker node ไม่ต้องต่อกับ node อื่น สามารถวางไว้แยกในมุมของ workspace ได้

**✅ ตอนนี้คุณมี MQTT Broker ที่รันใน Node-RED แล้ว!**

---

## 🔄 ตั้งค่า Flow

### Flow Overview

Flow ที่จะสร้างประกอบด้วย:
1. **Inject Node** - Trigger ทุก 1 นาที
2. **HTTP Request Node** - เรียก LibreNMS API
3. **Function Node** - ประมวลผล JSON
4. **MQTT Output Node** - ส่งข้อมูลไปยัง MQTT broker
5. **Debug Node** - แสดงผลใน Debug panel

### Step 1: เพิ่ม Inject Node

1. ลาก **inject** node จาก palette มาวาง
2. Double-click เพื่อตั้งค่า:
   - **Name:** `Every 1 minute`
   - **Repeat:** `interval`
   - **Every:** `1` `minutes`
   - คลิก **Done**

### Step 2: เพิ่ม HTTP Request Node

1. ลาก **http request** node มาวาง
2. Double-click เพื่อตั้งค่า:
   - **Name:** `Get ether1 status`
   - **Method:** `GET`
   - **URL:** `http://librenms:8000/api/v0/devices/192.168.56.10/ports`
   - **Headers:** คลิก **+ add** เพื่อเพิ่ม header
     - **Name:** `X-Auth-Token`
     - **Value:** `your-api-token-here` (ใส่ API Token จริง)
   - **Return:** `a parsed JSON object`
   - คลิก **Done**

**หมายเหตุ:** ใช้ `librenms` แทน `localhost` เพราะอยู่ใน Docker network เดียวกัน

### Step 3: เพิ่ม Function Node

1. ลาก **function** node มาวาง
2. Double-click เพื่อตั้งค่า:
   - **Name:** `Extract ether1 data`
   - **Function:** ใส่ code นี้:

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

### Step 4: เพิ่ม MQTT Output Node

1. ลาก **mqtt out** node มาวาง
2. Double-click เพื่อตั้งค่า:
   - **Server:** คลิก pencil icon เพื่อเพิ่ม broker
     - **Server:** `localhost` (เพราะ Aedes broker รันใน container เดียวกัน)
     - **Port:** `1883`
     - **Client ID:** ปล่อยว่าง (auto-generate)
     - คลิก **Add**
   - **Topic:** ปล่อยว่าง (ใช้จาก msg.topic)
   - **QoS:** `0`
   - **Retain:** ✅ เปิดเพื่อเก็บ last message
   - **Name:** `Publish to MQTT`
   - คลิก **Done**

### Step 5: เพิ่ม Debug Node (Optional)

1. ลาก **debug** node มาวาง
2. ต่อจาก Function node (ก่อน MQTT out)
3. Double-click:
   - **Output:** `complete msg object`
   - **Name:** `Debug output`
   - คลิก **Done**

### Step 6: เชื่อมต่อ Nodes

เชื่อมต่อ nodes ตามลำดับ:

```
[Inject] → [HTTP Request] → [Function] → [MQTT Out]
                                   ↓
                              [Debug]
```

1. คลิกที่ output port (จุดขวา) ของ Inject node
2. ลากไปที่ input port (จุดซ้าย) ของ HTTP Request node
3. ทำแบบเดียวกันสำหรับ nodes อื่นๆ

### Step 7: Deploy Flow

1. คลิกปุ่ม **Deploy** (มุมบนขวา)
2. เลือก **Full** (deploy ทั้งหมด)
3. คลิก **Deploy**

**ถ้าสำเร็จ:** จะเห็นข้อความ "Successfully deployed"

---

## 🧪 ทดสอบระบบ

### 1. ทดสอบ Flow

1. คลิกที่ปุ่ม (square) ทางซ้ายของ Inject node เพื่อทดสอบทันที
2. ดูผลลัพธ์ใน **Debug** panel (ด้านขวา - คลิก bug icon)

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
    "inPackets": 10000,
    "outPackets": 8000,
    "inErrors": 0,
    "outErrors": 0
  }
}
```

### 2. ทดสอบ MQTT Broker

#### วิธีที่ 1: ใช้ MQTT In Node ใน Node-RED

1. ลาก **mqtt in** node มาวาง
2. Double-click:
   - **Server:** เลือก broker เดียวกับที่ตั้งไว้ (`localhost:1883`)
   - **Topic:** `mikrotik/ether1/status`
   - **QoS:** `0`
   - คลิก **Done**
3. ลาก **debug** node มาต่อ
4. Deploy
5. คลิกปุ่มทดสอบที่ Inject node
6. ดู debug output จาก mqtt in node

#### วิธีที่ 2: ใช้ mosquitto-clients ภายนอก

```bash
# Subscribe to topic (จาก host machine)
mosquitto_sub -h localhost -t "mikrotik/ether1/status" -v

# คลิกปุ่มทดสอบใน Node-RED
# ควรเห็นข้อมูลปรากฏใน terminal
```

**Expected Output:**
```
mikrotik/ether1/status {"timestamp":"2026-02-09T15:30:00.000Z","interface":"ether1",...}
```

### 3. ทดสอบ Auto-Trigger

รอ 1 นาที และตรวจสอบว่า Flow ทำงานอัตโนมัติ:

```bash
# Monitor MQTT messages
mosquitto_sub -h localhost -t "mikrotik/#" -v

# ควรเห็นข้อมูลเข้ามาทุก 1 นาที
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

---

## 🔄 Advanced Flows

### Flow 1: Alert when ether1 is down

เพิ่ม **switch** node หลัง Function node:

```javascript
// Switch node condition
if (msg.payload.status === 'down') {
    return [msg, null]; // Output 1: Alert
} else {
    return [null, msg]; // Output 2: Normal
}
```

จากนั้นต่อ output 1 ไป MQTT node ที่ส่งไป topic `mikrotik/alerts/ether1`

### Flow 2: Calculate bandwidth usage

```javascript
// Function node
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

3. Restart Node-RED:
   ```bash
   docker-compose restart
   ```

### ปัญหา: Aedes broker ไม่ทำงาน

**อาการ:**
- MQTT out node แสดง status "disconnected"
- ไม่สามารถ publish message ได้

**แก้ไข:**
1. ตรวจสอบว่า Aedes broker node ถูก deploy แล้ว
2. ตรวจสอบ port 1883 ไม่ถูกใช้งานโดยโปรแกรมอื่น:
   ```bash
   # Windows
   netstat -ano | findstr :1883

   # Linux/Mac
   lsof -i :1883
   ```
3. ตรวจสอบ MQTT out node config:
   - Server: `localhost`
   - Port: `1883`
4. Restart Node-RED container:
   ```bash
   docker-compose restart
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
- สร้าง Token ใหม่ใน LibreNMS:
  ```bash
  docker exec librenms lnms user:add-token admin
  ```

### ปัญหา: No data in MQTT

**แก้ไข:**
1. ตรวจสอบ Debug node output
2. ตรวจสอบ Function node ทำงานถูกต้อง (คลิก debug ที่ Function node)
3. ตรวจสอบ Aedes broker status (ควรแสดง "connected")
4. ใช้ mqtt in node เพื่อ subscribe และดูว่ามีข้อมูลหรือไม่

### ปัญหา: Cannot subscribe from external client

**อาการ:**
```bash
mosquitto_sub -h localhost -t "test" -v
# Connection refused
```

**แก้ไข:**
1. ตรวจสอบว่า port 1883 exposed ใน docker-compose.yml:
   ```yaml
   ports:
     - "1883:1883"
   ```
2. Restart Node-RED:
   ```bash
   docker-compose restart
   ```
3. ตรวจสอบ firewall:
   ```bash
   # Allow port 1883
   sudo ufw allow 1883/tcp
   ```

---

## 📚 Export/Import Flow

### Export Flow

1. เลือก nodes ที่ต้องการ (Ctrl+A เพื่อเลือกทั้งหมด)
2. **Menu (≡)** → **Export**
3. เลือก **Selected nodes** หรือ **Current flow**
4. คลิก **Copy to clipboard** หรือ **Download**

### Import Flow

1. **Menu (≡)** → **Import**
2. Paste JSON หรือเลือกไฟล์
3. คลิก **Import**

### Example Flow JSON

ดูไฟล์ `flow-example.json` ในโฟลเดอร์นี้

---

## 🎯 Best Practices

### 1. Security

**✅ DO:**
- ใช้ API Token แทน username/password
- จำกัด network access (ใช้ Docker network)
- เปลี่ยน API token เป็นระยะ
- ใช้ TLS/SSL ใน production

**❌ DON'T:**
- Hard-code credentials ใน Flow
- เปิด MQTT port ออก Internet โดยไม่มี authentication
- ใช้ `allow_anonymous` ใน production

### 2. Performance

- ใช้ QoS 0 สำหรับ non-critical messages
- Enable MQTT retain สำหรับ status messages
- Monitor Node-RED memory usage
- ใช้ context storage สำหรับ state management

### 3. Monitoring

- เปิด Debug nodes ในระหว่างพัฒนา
- ปิด Debug nodes ใน production
- Monitor container logs:
  ```bash
  docker-compose logs -f nodered
  ```
- ตั้งค่า alerts สำหรับ Flow errors

---

## 📖 Resources

### Official Documentation
- [Node-RED Docs](https://nodered.org/docs/)
- [Aedes MQTT Broker](https://github.com/moscajs/aedes)
- [MQTT Protocol](https://mqtt.org/)
- [LibreNMS API](https://docs.librenms.org/API/)

### Node-RED Flows
- [Node-RED Flow Library](https://flows.nodered.org/)
- [Aedes Examples](https://flows.nodered.org/?term=aedes)

### Tools
- [MQTT Explorer](http://mqtt-explorer.com/) - GUI MQTT client
- [MQTTX](https://mqttx.app/) - Modern MQTT client

---

## 📝 Summary

คุณได้เรียนรู้:
- ✅ ติดตั้ง Node-RED ด้วย Docker
- ✅ ตั้งค่า MQTT Broker ใน Node-RED (Aedes)
- ✅ สร้าง Flow สำหรับดึงข้อมูล API
- ✅ ตั้งค่า Timer ให้ทำงานทุก 1 นาที
- ✅ ส่งข้อมูลผ่าน MQTT protocol
- ✅ Subscribe และรับข้อมูลจาก MQTT
- ✅ Troubleshooting และ best practices

**ข้อดี:**
- 🎯 ใช้ container เดียว (ง่ายต่อการจัดการ)
- ⚡ Performance ดีกว่า (ไม่ต้องข้าม network)
- 💾 ใช้ resource น้อยกว่า (ไม่มี Mosquitto container)

ตอนนี้คุณสามารถสร้าง IoT integration และ automation workflows ได้แล้ว! 🚀

---

**Happy Flow-based Programming! 🔄**

*Last Updated: 2026-02-09*
