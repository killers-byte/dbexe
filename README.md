# 🛡️ BIN AI Hub – Badan Intelijen Negara

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0%20Quantum-cyan?style=for-the-badge&logo=sharp" alt="Version">
  <img src="https://img.shields.io/badge/platform-Termux%20%7C%20Linux%20%7C%20Windows-brightgreen?style=for-the-badge&logo=linux" alt="Platform">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=statuspal" alt="Status">
  <img src="https://img.shields.io/badge/security-offensive-red?style=for-the-badge&logo=hackthebox" alt="Security">
  <img src="https://img.shields.io/badge/deploy-self--hosted%20%7C%20free-blueviolet?style=for-the-badge&logo=rocket" alt="Deploy">
</p>

**BIN AI Hub** adalah pusat kendali intelijen digital berbasis AI.  
Dilengkapi dengan **7 mode kecerdasan buatan**, **custom jailbreak prompt**, **OSINT tracking**, **penetration testing assistant**, **DeepExploit**, **AutoRecon**, **Burp Suite AI** dan **Agen AI otonom** – semua dijalankan 100% nyata tanpa simulasi.

> **Dikembangkan oleh:** Badan Intelijen Negara (BIN)  
> **Model AI:** `glm/glm-4.5` via [freetheai.xyz](https://api.freetheai.xyz)  
> **Lisensi:** Klasifikasi Negara – *For authorized personnel only*

---

## 🧠 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🎭 7 Mode AI | Default Chat, PentestGPT, HackerGPT, WormGPT/FraudGPT, Burp Suite AI, DeepExploit, AutoRecon |
| 🧪 Custom Jailbreak | Sistem prompt global (berlaku untuk semua mode) – tersimpan di `jailbreak_prompts.json` |
| 🎯 OSINT Tracking | Lacak email, nomor HP, username, domain – real data dari [emailrep.io](https://emailrep.io), [crt.sh](https://crt.sh), [socialscan](https://github.com/iojw/socialscan) |
| 🐱‍💻 Burp Proxy Mini | Analisis HTTP response dengan AI untuk XSS, SQLi, CSRF |
| 💣 DeepExploit | Port scanning Python-native / nmap + rekomendasi exploit AI |
| 🛰️ AutoRecon | Subdomain enumeration, port scan, direktori brute‑force + panduan exploit AI |
| 🤖 Agen Otonom | Loop AI yang menjalankan tool nyata berdasarkan misi (track, scan, recon) |
| 🌐 Responsif | Antarmuka terminal‑glassmorphism, mobile‑friendly, command palette `/menu`, `/track`, dll. |

---

## 🏗️ Instalasi & Menjalankan

### Prasyarat (semua platform)
- Python 3.10+
- `pip` & `git`
- `nmap`, `gobuster`, `dirb` (opsional; tool Python-native sudah disertakan)

### ▶️ Jalankan dengan Cepat (Linux / WSL / macOS)

```bash
git clone https://github.com/killers-byte/dbexe.git
cd bin-ai-hub
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Aplikasi akan berjalan di `http://localhost:5000`.

---

### 📱 Deploy di Termux (Android) – Full Power dengan Proot Ubuntu

Termux tanpa root tidak bisa menginstal `nmap` langsung. Gunakan **proot-distro Ubuntu** untuk menjalankan tools penuh.

#### 1. Persiapan Termux
```bash
pkg update -y && pkg upgrade -y
pkg install proot-distro git termux-api -y
proot-distro install ubuntu
```

#### 2. Masuk ke Ubuntu proot & siapkan dependensi
```bash
proot-distro login ubuntu
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv git nmap gobuster dirb curl
```

#### 3. Clone repository & setup virtual environment
```bash
cd /opt
git clone https://github.com/killers-byte/dbexe.git
cd bin-ai-hub
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Jalankan Flask di background
```bash
screen -S flask
python app.py
# Tekan CTRL+A lalu D untuk keluar dari screen
```

#### 5. Expose ke internet dengan localhost.run (gratis, tanpa kartu)
```bash
screen -S tunnel
ssh -R 80:localhost:5000 nokey@localhost.run
# Catat URL yang muncul (contoh: https://xxxx.lhr.life)
# CTRL+A, D untuk detach
```

#### 6. Menjaga aplikasi tetap hidup 24 jam
- Di sesi Termux (bukan proot): `termux-wake-lock wakelock`
- Daftarkan URL tunnel ke [UptimeRobot](https://uptimerobot.com) dengan interval 5 menit.

---

## 🌐 Opsi Tunnel Lainnya (Jika localhost.run diblokir)

| Tunnel | Perintah | Kelebihan | Kekurangan |
|--------|----------|-----------|------------|
| **Cloudflare TryCloudflare** | `cloudflared tunnel --url http://localhost:5000` | Cepat, HTTPS | QUIC kadang diblokir jaringan seluler |
| **Ngrok** | `ngrok http 5000` | Stabil, tidak perlu login | Versi gratis 2 jam sesi |
| **SSH Reverse** | `ssh -R 80:localhost:5000 nokey@localhost.run` | Tanpa instal, HTTPS | URL berubah setiap restart |

> **Rekomendasi:** Gunakan `localhost.run` untuk kemudahan tanpa install tambahan.

---

## ⌨️ Perintah Cepat (Command Palette)

Ketik langsung di chat (prefix `/`):

| Perintah | Fungsi |
|----------|--------|
| `/track <email/nomor/username>` | Buka tool OSINT dengan target |
| `/scan <IP>` | Buka DeepExploit dengan target IP |
| `/recon <domain>` | Buka AutoRecon dengan target domain |
| `/agent <misi>` | Jalankan Agen AI Otonom |
| `/menu` | Tampilkan semua perintah |
| `/clear` | Bersihkan chat |

---

## 🎨 Kustomisasi

- **Ganti model AI:** edit `BASE_URL`, `API_KEY`, `MODEL` di `app.py`.
- **Tambah API key OSINT:** set environment variable `NUMVERIFY_KEY` dan `HIBP_KEY` untuk fitur lebih lengkap.
- **Tema UI:** sesuaikan `static/style.css` (variabel CSS, warna, font).
- **Jailbreak prompt:** kelola via antarmuka web (modal sidebar).

---

## 📦 Struktur Proyek

```
bin-ai-hub/
├── app.py                  # Backend Flask utama
├── requirements.txt        # Dependensi Python
├── jailbreak_prompts.json  # Data prompt custom
├── templates/
│   └── index.html          # Antarmuka web
├── static/
│   ├── style.css           # Desain responsif & terminal
│   └── script.js           # Logika frontend
└── README.md
```

---

## ⚠️ Disclaimer

Aplikasi ini ditujukan **hanya untuk keperluan pengujian keamanan yang sah dan pendidikan**.  
Penggunaan untuk aktivitas ilegal di luar tanggung jawab pengembang.  
**BIN AI Hub** adalah alat simulasi intelijen; segala tindakan yang melanggar hukum sepenuhnya tanggung jawab pengguna.

---

## 🤝 Kontribusi

Proyek ini **closed-source** dan dikelola oleh **Badan Intelijen Negara**.  
Permintaan fitur atau bug report dapat disampaikan melalui fitur `/feedback` di dalam aplikasi.

---

## 🛡️ Dibuat oleh

**BIN – Badan Intelijen Negara**  
Divisi Cyber & SIGINT  
> *"Kebebasan tidak pernah diberikan. Kebebasan diambil."*

© 2026 BIN AI Hub v4.0 Quantum. All rights reserved.
```
