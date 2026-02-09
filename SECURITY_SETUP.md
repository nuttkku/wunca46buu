# 🔒 Security Setup Guide

## ⚠️ คำเตือนสำคัญ

**Configuration ในโปรเจกต์นี้ออกแบบมาเพื่อการเรียนรู้ (Workshop/Training) เท่านั้น**

🚫 **ห้ามนำไปใช้ใน Production โดยตรง!**

หากต้องการใช้งานจริงในสภาพแวดล้อม Production กรุณาปฏิบัติตามขั้นตอนด้านล่างเพื่อเพิ่มความปลอดภัย

---

## 📋 Security Checklist สำหรับ Production

### ✅ ขั้นตอนที่ 1: ตั้งค่า Environment Variables

#### 1.1 LibreNMS Environment

```bash
# ไปที่โฟลเดอร์ librenms
cd librenms

# Copy ไฟล์ .env.example เป็น .env
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env  # หรือใช้ text editor ที่คุณชอบ
```

**สิ่งที่ต้องเปลี่ยนใน `.env`:**

```bash
# 1. สร้าง MySQL Root Password ที่แข็งแรง
MYSQL_ROOT_PASSWORD=<สร้างรหัสผ่านที่แข็งแรง>

# 2. สร้าง MySQL User Password ที่แข็งแรง
MYSQL_PASSWORD=<สร้างรหัสผ่านที่แข็งแรง>
DB_PASSWORD=<ใช้รหัสผ่านเดียวกับด้านบน>

# 3. สร้าง APP_KEY (32 characters)
# วิธีสร้าง:
openssl rand -base64 32
APP_KEY=<paste ค่าที่ได้จากคำสั่งด้านบน>

# 4. สร้าง Redis Password
# วิธีสร้าง:
openssl rand -base64 16
REDIS_PASSWORD=<paste ค่าที่ได้>

# 5. เปลี่ยน SNMP Community String
# อย่าใช้ "public" เด็ดขาด!
LIBRENMS_SNMP_COMMUNITY=<สร้างคำที่ไม่มีใครเดาได้>

# 6. (Optional) จำกัดการเข้าถึงเฉพาะ localhost
LIBRENMS_PORT=127.0.0.1:8000
```

#### 1.2 Node-RED Environment

```bash
# ไปที่โฟลเดอร์ nodered
cd nodered

# Copy ไฟล์ .env.example เป็น .env
cp .env.example .env

# แก้ไขไฟล์ .env (ถ้าต้องการเปลี่ยน port)
nano .env
```

#### 1.3 LibreNMS API Environment

```bash
# ไปที่โฟลเดอร์ librenms-api
cd librenms-api

# Copy ไฟล์ .env.example เป็น .env
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env
```

**ใส่ค่าดังนี้:**
```bash
API_URL=http://localhost:8000/api/v0
API_TOKEN=<ดูวิธีสร้าง API Token ด้านล่าง>
DEVICE_IP=192.168.56.10
```

---

### ✅ ขั้นตอนที่ 2: สร้าง LibreNMS API Token

1. เปิดเว็บ LibreNMS: `http://localhost:8000`
2. Login ด้วย admin account
3. ไปที่ **Settings → API Settings**
4. Click **Create Token**
5. ใส่ชื่อ Token (เช่น "Node-RED Integration")
6. Copy Token ที่ได้ แล้วใส่ใน `.env` ของ `librenms-api/`

---

### ✅ ขั้นตอนที่ 3: เพิ่มความปลอดภัยให้ MQTT Broker

Node-RED Aedes ในการตั้งค่า Workshop **ไม่มี authentication**

**สำหรับ Production ให้ทำดังนี้:**

1. ติดตั้ง node-red-contrib-aedes ใน Node-RED
2. ตั้งค่า Authentication:
   - เปิด Node-RED UI: `http://localhost:1880`
   - เพิ่ม Aedes broker node
   - ตั้งค่า **Authenticate** tab
   - เพิ่ม username/password สำหรับ MQTT clients

3. (แนะนำ) ใช้ SSL/TLS:
   - สร้าง certificate:
     ```bash
     openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
     ```
   - Upload cert และ key ใน Aedes node settings
   - เปลี่ยน port เป็น 8883 (MQTTS)

---

### ✅ ขั้นตอนที่ 4: ตั้งค่า Firewall

```bash
# Linux (Ubuntu/Debian)
sudo ufw allow 8000/tcp    # LibreNMS (ถ้าต้องการเปิดให้ external)
sudo ufw allow 1880/tcp    # Node-RED (ถ้าต้องการเปิดให้ external)
sudo ufw allow 1883/tcp    # MQTT (ถ้าต้องการเปิดให้ external)

# หรือจำกัดเฉพาะ internal network
sudo ufw allow from 192.168.56.0/24 to any port 8000
sudo ufw allow from 192.168.56.0/24 to any port 1880
sudo ufw allow from 192.168.56.0/24 to any port 1883
```

---

### ✅ ขั้นตอนที่ 5: เปลี่ยน SNMP Community บน MikroTik

```bash
# เชื่อมต่อ MikroTik via SSH
ssh admin@192.168.56.10

# เปลี่ยน SNMP community (ใช้ค่าเดียวกับที่ตั้งใน .env)
/snmp community set 0 name="your-secure-community"

# หรือลบ community เก่าแล้วสร้างใหม่
/snmp community remove 0
/snmp community add name="your-secure-community" addresses=192.168.56.0/24
```

---

### ✅ ขั้นตอนที่ 6: ตั้งค่า Node-RED Admin Password

```bash
# ไปที่ nodered container
docker exec -it nodered bash

# สร้าง password hash
node-red admin hash-pw

# แก้ไข settings.js
nano /data/settings.js
```

เพิ่มในส่วน `adminAuth`:
```javascript
adminAuth: {
    type: "credentials",
    users: [{
        username: "admin",
        password: "<paste-hash-from-above>",
        permissions: "*"
    }]
}
```

Restart Node-RED:
```bash
docker restart nodered
```

---

### ✅ ขั้นตอนที่ 7: Backup และ Recovery

#### 7.1 สร้าง Backup Script

สร้างไฟล์ `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup Database
docker exec librenms_db mysqldump -u root -p$MYSQL_ROOT_PASSWORD librenms > "$BACKUP_DIR/librenms_db.sql"

# Backup LibreNMS data
tar -czf "$BACKUP_DIR/librenms_data.tar.gz" ./librenms/librenms

# Backup Node-RED flows
tar -czf "$BACKUP_DIR/nodered_data.tar.gz" ./nodered/nodered_data

# Backup .env files (encrypted)
tar -czf - ./librenms/.env ./nodered/.env ./librenms-api/.env | \
    openssl enc -aes-256-cbc -salt -out "$BACKUP_DIR/env_files.tar.gz.enc"

echo "Backup completed: $BACKUP_DIR"
```

#### 7.2 ตั้ง Cron Job สำหรับ Auto Backup

```bash
# Edit crontab
crontab -e

# เพิ่มบรรทัดนี้ (backup ทุกวันเวลา 2:00 AM)
0 2 * * * cd /path/to/project && ./backup.sh
```

---

### ✅ ขั้นตอนที่ 8: Monitoring และ Logging

#### 8.1 ตั้งค่า Log Rotation

สร้างไฟล์ `/etc/logrotate.d/librenms`:
```
/path/to/project/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 root root
}
```

#### 8.2 ตรวจสอบ Container Health

```bash
# ตรวจสอบสถานะ containers
docker ps

# ดู logs
docker logs librenms
docker logs librenms_db
docker logs nodered

# ตรวจสอบ resource usage
docker stats
```

---

## 🔍 Security Testing Checklist

หลังจากตั้งค่าเสร็จแล้ว ให้ทดสอบดังนี้:

- [ ] ไม่สามารถเข้า MySQL ด้วย default password
- [ ] ไม่สามารถเข้า Redis โดยไม่มี password
- [ ] SNMP community "public" ไม่สามารถใช้งานได้
- [ ] MQTT ต้อง authenticate ก่อนเชื่อมต่อ
- [ ] Node-RED UI ต้อง login ก่อนใช้งาน
- [ ] LibreNMS web UI ใช้ HTTPS (ถ้าเปิดให้ external)
- [ ] Firewall อนุญาตเฉพาะ ports ที่จำเป็น
- [ ] Backup system ทำงานอัตโนมัติ

---

## 📚 Additional Security Resources

### แนะนำให้อ่านเพิ่มเติม:

1. **LibreNMS Security:**
   - https://docs.librenms.org/Support/Security/

2. **Node-RED Security:**
   - https://nodered.org/docs/user-guide/runtime/securing-node-red

3. **MQTT Security:**
   - https://mosquitto.org/man/mosquitto-conf-5.html

4. **Docker Security:**
   - https://docs.docker.com/engine/security/

---

## 🆘 ติดปัญหา?

หากพบปัญหาเกี่ยวกับความปลอดภัย:

1. ตรวจสอบไฟล์ `.env` ว่าตั้งค่าถูกต้อง
2. Restart containers: `docker-compose down && docker-compose up -d`
3. ตรวจสอบ logs: `docker logs <container_name>`
4. อ่าน documentation ของแต่ละ component

---

**🔐 Remember: Security is not a one-time setup, it's an ongoing process!**