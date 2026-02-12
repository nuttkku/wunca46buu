# 🔧 MikroTik RouterOS Setup Guide

คู่มือการติดตั้งและตั้งค่า MikroTik RouterOS (.ova) บน VirtualBox เพื่อใช้งานร่วมกับ LibreNMS

---

## 📋 สารบัญ

- [ข้อกำหนดเบื้องต้น](#ข้อกำหนดเบื้องต้น)
- [ดาวน์โหลด RouterOS](#ดาวน์โหลด-routeros)
- [Import OVA ไฟล์บน VirtualBox](#import-ova-ไฟล์บน-virtualbox)
- [ตั้งค่า Network Interfaces](#ตั้งค่า-network-interfaces)
- [การเข้าสู่ระบบ RouterOS](#การเข้าสู่ระบบ-routeros)
- [ตั้งค่า SNMP v2c](#ตั้งค่า-snmp-v2c)
- [เพิ่มอุปกรณ์บน LibreNMS](#เพิ่มอุปกรณ์บน-librenms)
- [ตรวจสอบและแก้ไขปัญหา](#ตรวจสอบและแก้ไขปัญหา)

---

## ✅ ข้อกำหนดเบื้องต้น

### Software Requirements

- [VirtualBox](https://www.virtualbox.org/wiki/Downloads) 6.0 หรือสูงกว่า
- MikroTik RouterOS OVA file
- LibreNMS ที่ติดตั้งและพร้อมใช้งานแล้ว

### System Requirements

**Minimum:**
- CPU: 1 core
- RAM: 128 MB
- Disk: 128 MB

**Recommended:**
- CPU: 2 cores
- RAM: 256 MB
- Disk: 256 MB

---

## 📥 ดาวน์โหลด RouterOS

### 1. ไปยังเว็บไซต์ MikroTik

เข้าไปที่: [https://mikrotik.com/download](https://mikrotik.com/download)

### 2. เลือก Version และ Architecture

1. เลือก **RouterOS** (ไม่ใช่ Cloud Hosted Router)
2. เลือก Architecture: **x86** หรือ **x86_64** (แนะนำ x86_64)
3. เลือกไฟล์ **OVA** (Open Virtualization Appliance)

### 3. ดาวน์โหลด

- คลิก Download ไฟล์ `.ova`
- ตัวอย่างชื่อไฟล์: `chr-7.12.ova` หรือ `routeros-7.12.ova`

**หมายเหตุ:** CHR (Cloud Hosted Router) เป็น RouterOS สำหรับ virtualization โดยเฉพาะ

---

## 📦 Import OVA ไฟล์บน VirtualBox

### Step 1: เปิด VirtualBox

เปิดโปรแกรม **Oracle VM VirtualBox Manager**

### Step 2: Import Appliance

1. ไปที่เมนู **File** → **Import Appliance...**
   - หรือกด `Ctrl+I` (Windows/Linux)
   - หรือกด `Cmd+I` (macOS)

2. เลือกไฟล์ OVA:
   - คลิก **Browse** (ไอคอนโฟลเดอร์)
   - เลือกไฟล์ `.ova` ที่ดาวน์โหลดมา
   - คลิก **Next**

### Step 3: Appliance Settings

หน้าจอจะแสดง configuration ของ VM:

```
Name:              RouterOS
Guest OS Type:     Linux 2.6 / 3.x / 4.x (64-bit)
CPU:               1
RAM:               128 MB
Disk:              128 MB
Network Adapter:   NAT
```

**ปรับแต่ง Settings (แนะนำ):**
- **Name:** เปลี่ยนเป็นชื่อที่ต้องการ (เช่น `MikroTik-Router`)
- **RAM:** เพิ่มเป็น **256 MB** หรือมากกว่า
- **CPU:** เพิ่มเป็น **2 cores** (ถ้าต้องการ performance ดี)

### Step 4: Import

1. คลิก **Import**
2. รอให้ VirtualBox import เสร็จ (ประมาณ 30-60 วินาที)
3. เมื่อเสร็จจะเห็น VM ปรากฏในรายการด้านซ้าย

---

## 🌐 ตั้งค่า Network Interfaces

RouterOS ต้องการ 4 network interfaces ตามที่กำหนด

### Architecture Overview

```
┌─────────────────────────────────────────┐
│         MikroTik RouterOS VM            │
├─────────────────────────────────────────┤
│  ether1 → Host-Only (Management)        │
│  ether2 → NAT (Internet)                │
│  ether3 → Internal Network              │
│  ether4 → Internal Network              │
└─────────────────────────────────────────┘
          │         │         │        │
          ▼         ▼         ▼        ▼
      Host-Only   NAT    Internal  Internal
      (LibreNMS)
```

### Step 1: เข้าสู่ VM Settings

1. คลิกขวาที่ VM **MikroTik-Router**
2. เลือก **Settings...**
3. ไปที่หัวข้อ **Network**

### Step 2: ตั้งค่า Adapter 1 (ether1) - Host-Only

**จุดประสงค์:** สำหรับ management และเชื่อมต่อกับ LibreNMS

1. **Adapter 1** (ether1):
   - ✅ เปิด **Enable Network Adapter**
   - **Attached to:** `Host-only Adapter`
   - **Name:** เลือก Host-only network ที่มีอยู่
     - Windows: `VirtualBox Host-Only Ethernet Adapter`
     - macOS/Linux: `vboxnet0`

**สร้าง Host-Only Network (ถ้ายังไม่มี):**

1. ไปที่ **File** → **Host Network Manager** (หรือ **Tools** → **Network**)
2. คลิก **Create** เพื่อสร้าง Host-only network ใหม่
3. ตั้งค่า IPv4:
   - IPv4 Address: `192.168.56.1`
   - IPv4 Network Mask: `255.255.255.0`
4. เปิด **DHCP Server** (ถ้าต้องการ auto IP)

### Step 3: ตั้งค่า Adapter 2 (ether2) - NAT

**จุดประสงค์:** สำหรับเชื่อมต่อ Internet

1. **Adapter 2** (ether2):
   - ✅ เปิด **Enable Network Adapter**
   - **Attached to:** `NAT`

### Step 4: ตั้งค่า Adapter 3 (ether3) - Internal Network

**จุดประสงค์:** สำหรับ LAN ภายใน

1. **Adapter 3** (ether3):
   - ✅ เปิด **Enable Network Adapter**
   - **Attached to:** `Internal Network`
   - **Name:** `intnet1` (ตั้งชื่อได้ตามต้องการ)

### Step 5: ตั้งค่า Adapter 4 (ether4) - Internal Network

**จุดประสงค์:** สำหรับ LAN ภายในเพิ่มเติม

1. **Adapter 4** (ether4):
   - ✅ เปิด **Enable Network Adapter**
   - **Attached to:** `Internal Network`
   - **Name:** `intnet2` (หรือใช้ `intnet1` ร่วมกับ ether3)

### Step 6: บันทึกการตั้งค่า

คลิก **OK** เพื่อบันทึก

### สรุป Network Configuration

| Interface | Type | Network | Purpose |
|-----------|------|---------|---------|
| **ether1** | Host-Only | 192.168.56.0/24 | Management, LibreNMS |
| **ether2** | NAT | Auto | Internet Access |
| **ether3** | Internal | intnet1 | Internal LAN 1 |
| **ether4** | Internal | intnet2 | Internal LAN 2 |

---

## 🔐 การเข้าสู่ระบบ RouterOS

### Step 1: Start VM

1. คลิกขวาที่ VM → **Start** → **Normal Start**
2. หรือเลือก VM แล้วกด **Start**

### Step 2: รอให้ Boot เสร็จ

RouterOS จะ boot ประมาณ 10-30 วินาที

จะเห็น login prompt:
```
MikroTik RouterOS 7.12 (c)
MikroTik

Login:
```

### Step 3: Login ครั้งแรก

**Default Credentials:**
```
Login: admin
Password: [กด Enter - ไม่มีรหัสผ่าน]
```

### Step 4: เปลี่ยนรหัสผ่าน (แนะนำ)

หลังจาก login ครั้งแรก ให้ตั้งรหัสผ่านใหม่:

```bash
[admin@MikroTik] > /password
old password: [กด Enter]
new password: YourNewPassword123!
retype new password: YourNewPassword123!
```

### Step 5: ตรวจสอบ Interfaces

```bash
[admin@MikroTik] > /interface print
```

**Output ตัวอย่าง:**
```
Flags: D - dynamic, X - disabled, R - running, S - slave
 #     NAME                                TYPE       ACTUAL-MTU L2MTU
 0  R  ether1                              ether            1500  1600
 1  R  ether2                              ether            1500  1600
 2  R  ether3                              ether            1500  1600
 3  R  ether4                              ether            1500  1600
```

### Step 6: ตั้งค่า IP Address สำหรับ ether1 (Host-Only)

```bash
# ตั้ง IP สำหรับ management interface
[admin@MikroTik] > /ip address add address=192.168.56.10/24 interface=ether1

# ตรวจสอบ
[admin@MikroTik] > /ip address print
```

**Output:**
```
Flags: X - disabled, I - invalid, D - dynamic
 #   ADDRESS            NETWORK         INTERFACE
 0   192.168.56.10/24   192.168.56.0    ether1
```

### Step 7: ตั้งค่า Gateway (Optional)

```bash
# ตั้ง default gateway ผ่าน ether2 (NAT)
[admin@MikroTik] > /ip dhcp-client add interface=ether2 disabled=no

# หรือตั้ง static route
[admin@MikroTik] > /ip route add dst-address=0.0.0.0/0 gateway=ether2
```

### Step 8: ทดสอบการเชื่อมต่อจาก Host

เปิด Command Prompt/Terminal บนเครื่อง host:

```bash
# Windows / macOS / Linux
ping 192.168.56.10
```

**Output ที่ถูกต้อง:**
```
Reply from 192.168.56.10: bytes=32 time<1ms TTL=64
```

### Step 9: เข้าถึงผ่าน SSH (แนะนำ)

```bash
# จากเครื่อง host
ssh admin@192.168.56.10
```

หรือใช้ WinBox (GUI Management Tool):
- ดาวน์โหลด: [https://mikrotik.com/download](https://mikrotik.com/download)
- เชื่อมต่อไปที่ `192.168.56.10`

---

## 🔊 ตั้งค่า SNMP v2c

SNMP (Simple Network Management Protocol) ใช้สำหรับให้ LibreNMS ดึงข้อมูลจาก RouterOS

### วิธีที่ 1: ใช้ CLI (แนะนำ - รวดเร็ว)

#### Step 1: เปิด SNMP Service

```bash
# Login เข้า RouterOS
ssh admin@192.168.56.10

# เปิด SNMP
[admin@MikroTik] > /snmp set enabled=yes
```

#### Step 2: ตั้งค่า SNMP Community

```bash
# ตั้ง community string (default: public)
[admin@MikroTik] > /snmp set contact="admin@example.com" location="Bangkok, Thailand"

# ตั้ง community (ใช้ค่า default: public)
[admin@MikroTik] > /snmp community print
```

**Output:**
```
Flags: X - disabled
 0   name="public" addresses=0.0.0.0/0 security=none read-access=yes
     write-access=no
```

**Community "public" มีอยู่แล้วโดย default** ดังนั้นไม่ต้องสร้างใหม่

#### Step 3: ตั้งค่า SNMP (รายละเอียดเพิ่มเติม)

```bash
# ดูการตั้งค่า SNMP ทั้งหมด
[admin@MikroTik] > /snmp print

# Output ตัวอย่าง:
# enabled: yes
# contact: admin@example.com
# location: Bangkok, Thailand
# engine-id:
# trap-community: public
# trap-generators:
# trap-version: 1
```

#### Step 4: เพิ่ม Community ใหม่ (Optional - สำหรับความปลอดภัย)

```bash
# สร้าง community ใหม่ (แทนที่ public)
[admin@MikroTik] > /snmp community add name=librenms addresses=192.168.56.0/24 read-access=yes write-access=no

# ลบ community public (ถ้าต้องการ)
[admin@MikroTik] > /snmp community remove [find name="public"]

# ตรวจสอบ
[admin@MikroTik] > /snmp community print
```

### วิธีที่ 2: ใช้ WinBox (GUI)

#### Step 1: เชื่อมต่อด้วย WinBox

1. เปิด WinBox
2. เชื่อมต่อไปที่ `192.168.56.10`
3. Login ด้วย username และ password

#### Step 2: เปิด SNMP

1. ไปที่ **IP** → **SNMP**
2. เปิด tab **SNMP**
3. ✅ เปิด **Enabled**
4. กรอก **Contact:** `admin@example.com`
5. กรอก **Location:** `Bangkok, Thailand`
6. คลิก **Apply** และ **OK**

#### Step 3: ตั้งค่า Community

1. ใน window SNMP ไปที่ tab **Communities**
2. จะเห็น community "public" อยู่แล้ว
3. (Optional) สร้าง community ใหม่:
   - คลิก **Add New** (+)
   - **Name:** `librenms`
   - **Addresses:** `192.168.56.0/24`
   - **Read Access:** ✅ Yes
   - **Write Access:** ❌ No
   - คลิก **OK**

### ตรวจสอบ SNMP ทำงานหรือไม่

จากเครื่อง host (Linux/macOS) หรือ LibreNMS container:

```bash
# ติดตั้ง snmp tools (ถ้ายังไม่มี)
# Ubuntu/Debian
sudo apt-get install snmp

# Test SNMP
snmpwalk -v 2c -c public 192.168.56.10 system

# หรือจาก LibreNMS container
docker exec librenms snmpwalk -v 2c -c public 192.168.56.10 system
```

**Output ที่ถูกต้อง:**
```
SNMPv2-MIB::sysDescr.0 = STRING: RouterOS CHR
SNMPv2-MIB::sysObjectID.0 = OID: SNMPv2-SMI::enterprises.14988.1
SNMPv2-MIB::sysUpTime.0 = Timeticks: (123456) 0:20:34.56
SNMPv2-MIB::sysContact.0 = STRING: admin@example.com
SNMPv2-MIB::sysName.0 = STRING: MikroTik
SNMPv2-MIB::sysLocation.0 = STRING: Bangkok, Thailand
```

### คำสั่ง SNMP ที่มีประโยชน์

```bash
# ดูการตั้งค่า SNMP ทั้งหมด
/snmp print

# ดู communities ทั้งหมด
/snmp community print

# แก้ไข community
/snmp community set [find name="public"] addresses=192.168.56.0/24

# ปิด SNMP (ถ้าต้องการ)
/snmp set enabled=no

# เปิด SNMP logging (debug)
/system logging add topics=snmp action=memory
```

---

## 📊 เพิ่มอุปกรณ์บน LibreNMS

ตอนนี้ RouterOS พร้อมแล้ว มาเพิ่มเข้าสู่ LibreNMS กันเลย

### วิธีที่ 1: ใช้ Web Interface (แนะนำ)

#### Step 1: เข้าสู่ LibreNMS

เปิดเว็บเบราว์เซอร์:
```
http://localhost:8000
```

Login ด้วย admin credentials

#### Step 2: เพิ่มอุปกรณ์ใหม่

1. ไปที่ **Devices** → **Add Device**
   - หรือคลิก **+** ที่มุมบนขวา → **Add Device**

#### Step 3: กรอกข้อมูล

**Device Information:**
- **Hostname or IP:** `192.168.56.10`
- **SNMP Version:** `v2c`
- **Community:** `public` (หรือ community ที่ตั้งไว้)
- **Port:** `161` (default SNMP port)

**Device Settings (Optional):**
- **Display Name:** `MikroTik-Router` (ชื่อที่จะแสดงในระบบ)
- **Hardware:** ปล่อยว่าง (จะ auto-detect)
- **OS:** ปล่อยว่าง (จะ auto-detect)

**Other Settings:**
- **Force add:** ❌ ไม่ต้องเลือก (ใช้เมื่อ SNMP มีปัญหา)
- **ICMP Ping:** ✅ เปิด (แนะนำ)

#### Step 4: เพิ่มอุปกรณ์

1. คลิก **Add Device**
2. LibreNMS จะทำการ:
   - ตรวจสอบการเชื่อมต่อ SNMP
   - Discover device type และ OS
   - Poll ข้อมูลครั้งแรก
   - สร้าง RRD files สำหรับเก็บ metrics

#### Step 5: ตรวจสอบผลลัพธ์

**ถ้าสำเร็จ:**
```
Device added successfully!
Device: MikroTik-Router (192.168.56.10)
OS: RouterOS
Hardware: CHR
```

คลิก **View Device** เพื่อดูรายละเอียด

**ถ้าไม่สำเร็จ:**
- ตรวจสอบ SNMP configuration บน RouterOS
- ตรวจสอบ connectivity: `ping 192.168.56.10`
- ตรวจสอบ firewall rules
- ดู [Troubleshooting](#ตรวจสอบและแก้ไขปัญหา)

### วิธีที่ 2: ใช้ Command Line

```bash
# จากเครื่อง host
docker exec librenms lnms device:add 192.168.56.10 --community public

# Output:
# Device added: MikroTik-Router (192.168.56.10)
```

**ตัวเลือกเพิ่มเติม:**
```bash
# เพิ่มพร้อม force (ข้าม validation)
docker exec librenms lnms device:add 192.168.56.10 --community public --force

# เพิ่มพร้อมระบุ SNMP version
docker exec librenms lnms device:add 192.168.56.10 -c public -v v2c

# เพิ่มพร้อม display name
docker exec librenms lnms device:add 192.168.56.10 -c public --display "MikroTik Router"
```

### วิธีที่ 3: ใช้ Auto-Discovery

LibreNMS สามารถค้นหาอุปกรณ์อัตโนมัติได้

#### เปิด Auto-Discovery

1. ไปที่ **Settings** → **Discovery**
2. เปิด **Network Discovery**
3. ตั้งค่า Discovery modules:
   - ✅ **Discovery: ARP**
   - ✅ **Discovery: SNMP Scan**
4. ตั้งค่า Networks ที่จะ scan:
   - เพิ่ม `192.168.56.0/24`

#### รัน Discovery

```bash
# Manual discovery
docker exec librenms lnms device:discover 192.168.56.10

# Auto-discovery ทั้งหมด
docker exec librenms lnms discovery:run
```

---

## 🎨 ดูข้อมูลบน LibreNMS

### Device Overview

1. ไปที่ **Devices** → เลือก **MikroTik-Router**
2. จะเห็น:
   - **Status:** Up/Down
   - **Uptime:** เวลาที่ระบบทำงาน
   - **Location:** Bangkok, Thailand
   - **Hardware:** CHR
   - **Version:** RouterOS 7.12

### Dashboard Widgets

คุณจะเห็นข้อมูลต่างๆ:

#### 1. Health

- CPU Usage
- Memory Usage
- Disk Usage
- Uptime

#### 2. Ports

- Interface status (ether1-4)
- Traffic In/Out
- Errors และ Discards

#### 3. Graphs

- **Traffic:** Bandwidth usage
- **CPU:** CPU utilization
- **Memory:** Memory usage
- **Wireless:** ถ้ามี wireless interfaces

#### 4. Alerts

- Interface down
- High CPU usage
- High memory usage
- SNMP unreachable

### Useful Views

```
Devices → MikroTik-Router
├── Overview        # ภาพรวม
├── Health          # CPU, Memory, Disk
├── Ports           # Interfaces
├── Graphs          # กราฟต่างๆ
├── Logs            # Event logs
├── Alerts          # Alert history
└── Settings        # ตั้งค่าอุปกรณ์
```

---

## 🔍 ตรวจสอบและแก้ไขปัญหา

### ปัญหา: Cannot add device - SNMP timeout

**อาการ:**
```
Error: SNMP timeout
Could not connect to 192.168.56.10
```

**วิธีแก้:**

1. **ตรวจสอบ connectivity:**
```bash
# จาก host
ping 192.168.56.10

# จาก LibreNMS container
docker exec librenms ping -c 3 192.168.56.10
```

2. **ตรวจสอบ SNMP service บน RouterOS:**
```bash
ssh admin@192.168.56.10

[admin@MikroTik] > /snmp print
# ต้อง enabled: yes
```

3. **ทดสอบ SNMP:**
```bash
# จาก LibreNMS container
docker exec librenms snmpwalk -v 2c -c public 192.168.56.10 system
```

4. **ตรวจสอบ community string:**
```bash
[admin@MikroTik] > /snmp community print
# ต้องมี community ที่ตั้งไว้
```

---

### ปัญหา: Device added but no data

**อาการ:**
- อุปกรณ์ถูกเพิ่มแล้ว แต่ไม่มีข้อมูล/กราฟ
- Status แสดง "Unknown"

**วิธีแก้:**

1. **รัน discovery manually:**
```bash
docker exec librenms lnms device:discover 192.168.56.10 -vvv
```

2. **รัน poll manually:**
```bash
docker exec librenms lnms device:poll 192.168.56.10 -vvv
```

3. **ตรวจสอบ logs:**
```bash
docker exec librenms tail -f /data/logs/librenms.log
```

4. **ตรวจสอบ dispatcher:**
```bash
docker-compose logs -f dispatcher
```

---

### ปัญหา: Cannot connect to RouterOS via SSH

**อาการ:**
```
ssh: connect to host 192.168.56.10 port 22: Connection refused
```

**วิธีแก้:**

1. **ตรวจสอบว่า RouterOS boot เสร็จหรือยัง:**
   - ดูจาก VirtualBox console
   - รอ 30 วินาทีหลังจาก start VM

2. **ตรวจสอบ IP address:**
```bash
# จาก VirtualBox console
[admin@MikroTik] > /ip address print
```

3. **ตรวจสอบ SSH service:**
```bash
[admin@MikroTik] > /ip service print
# SSH ต้อง enabled
```

4. **เปิด SSH (ถ้าปิดอยู่):**
```bash
[admin@MikroTik] > /ip service enable ssh
```

---

### ปัญหา: VirtualBox Host-Only network ไม่มี

**วิธีแก้:**

**Windows:**
1. **File** → **Host Network Manager**
2. คลิก **Create**
3. ตั้งค่า:
   - IPv4 Address: `192.168.56.1`
   - IPv4 Network Mask: `255.255.255.0`
   - DHCP Server: Enable (optional)

**macOS/Linux:**
```bash
# สร้าง host-only network
VBoxManage hostonlyif create

# ตั้ง IP
VBoxManage hostonlyif ipconfig vboxnet0 --ip 192.168.56.1 --netmask 255.255.255.0

# ตรวจสอบ
VBoxManage list hostonlyifs
```

---

### ปัญหา: Interface ไม่ขึ้นบน RouterOS

**อาการ:**
```
[admin@MikroTik] > /interface print
# Interface แสดง X (disabled)
```

**วิธีแก้:**

1. **Enable interface:**
```bash
[admin@MikroTik] > /interface enable ether1
[admin@MikroTik] > /interface enable ether2
[admin@MikroTik] > /interface enable ether3
[admin@MikroTik] > /interface enable ether4
```

2. **หรือ enable ทั้งหมดพร้อมกัน:**
```bash
[admin@MikroTik] > /interface enable [find]
```

3. **ตรวจสอบสถานะ:**
```bash
[admin@MikroTik] > /interface print
# ต้องมี flag "R" (running)
```

---

### ปัญหา: SNMP community ไม่ตรงกัน

**อาการ:**
```
SNMP authentication failed
Invalid community string
```

**วิธีแก้:**

1. **ตรวจสอบ community บน RouterOS:**
```bash
[admin@MikroTik] > /snmp community print
```

2. **ตรวจสอบ community บน LibreNMS:**
   - Devices → Edit Device → SNMP Configuration
   - ต้องตรงกับที่ตั้งบน RouterOS

3. **ทดสอบ SNMP ด้วย community ต่างๆ:**
```bash
docker exec librenms snmpwalk -v 2c -c public 192.168.56.10 system
docker exec librenms snmpwalk -v 2c -c librenms 192.168.56.10 system
```

---

## 📚 คำสั่งที่มีประโยชน์

### RouterOS Commands

```bash
# ดูข้อมูลระบบ
/system resource print

# ดู IP addresses
/ip address print

# ดู interfaces
/interface print detail

# ดู routing table
/ip route print

# ดู SNMP config
/snmp print
/snmp community print

# Backup configuration
/export file=backup

# ดู logs
/log print

# รีบูตระบบ
/system reboot

# Shutdown ระบบ
/system shutdown
```

### LibreNMS Commands

```bash
# เพิ่มอุปกรณ์
docker exec librenms lnms device:add <ip> -c <community>

# ลบอุปกรณ์
docker exec librenms lnms device:remove <hostname>

# ดูรายการอุปกรณ์
docker exec librenms lnms device:list

# Poll อุปกรณ์ทันที
docker exec librenms lnms device:poll <hostname> -vvv

# Discovery อุปกรณ์ใหม่
docker exec librenms lnms device:discover <hostname> -vvv

# Validate configuration
docker exec librenms lnms validate
```

### VirtualBox Commands

```bash
# List VMs
VBoxManage list vms

# Start VM (headless)
VBoxManage startvm "MikroTik-Router" --type headless

# Stop VM
VBoxManage controlvm "MikroTik-Router" poweroff

# Reset VM
VBoxManage controlvm "MikroTik-Router" reset

# Show VM info
VBoxManage showvminfo "MikroTik-Router"

# Export OVA
VBoxManage export "MikroTik-Router" -o backup.ova
```

---

## 🎯 Best Practices

### Security

1. **เปลี่ยนรหัสผ่าน default**
   ```bash
   /password
   ```

2. **ใช้ SNMP community ที่ซับซ้อน**
   ```bash
   /snmp community set [find name="public"] name="MySecureComm123!"
   ```

3. **จำกัด SNMP access**
   ```bash
   /snmp community set [find] addresses=192.168.56.0/24
   ```

4. **ปิด services ที่ไม่ใช้**
   ```bash
   /ip service disable telnet,ftp,www
   ```

5. **ตั้ง firewall rules**
   ```bash
   /ip firewall filter add chain=input protocol=udp dst-port=161 src-address=192.168.56.0/24 action=accept
   /ip firewall filter add chain=input protocol=udp dst-port=161 action=drop
   ```

### Performance

1. **ตั้ง polling interval ที่เหมาะสม**
   - Default: 5 นาที
   - สำหรับอุปกรณ์สำคัญ: 1-2 นาที

2. **เปิดเฉพาะ SNMP modules ที่จำเป็น**
   - Device → Edit → Modules

3. **ใช้ SNMP v3 สำหรับ security (advanced)**

### Monitoring

1. **ตั้งค่า Alerts**
   - Alert Rules → Create rule
   - ตัวอย่าง: Interface down, High CPU

2. **สร้าง Custom Dashboards**
   - Dashboard → Create dashboard
   - เพิ่ม widgets ที่ต้องการ

3. **ตั้งค่า Notifications**
   - Alert Transports → Email, Slack, Discord

---

## 📖 Resources

### Official Documentation

- [MikroTik Wiki](https://wiki.mikrotik.com/)
- [MikroTik SNMP](https://wiki.mikrotik.com/wiki/Manual:SNMP)
- [RouterOS Manual](https://help.mikrotik.com/docs/)
- [LibreNMS Docs](https://docs.librenms.org/)

### Community

- [MikroTik Forum](https://forum.mikrotik.com/)
- [LibreNMS Community](https://community.librenms.org/)

### Video Tutorials

- [MikroTik YouTube Channel](https://www.youtube.com/c/MikroTikRouterOS)

---

## 📝 สรุป

คุณได้เรียนรู้:
- ✅ วิธี import RouterOS OVA บน VirtualBox
- ✅ การตั้งค่า 4 network interfaces
- ✅ การเข้าถึงและตั้งค่า RouterOS
- ✅ การเปิด SNMP v2c
- ✅ การเพิ่มอุปกรณ์บน LibreNMS
- ✅ การแก้ไขปัญหาพื้นฐาน

ตอนนี้คุณสามารถ monitor MikroTik RouterOS ด้วย LibreNMS ได้แล้ว! 🎉

---

**Happy Networking! 🚀**

*Last Updated: 2026-02-09*
