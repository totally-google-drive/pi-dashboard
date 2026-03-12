# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Flask-based **Raspberry Pi Dashboard** application that monitors system resources and manages Docker containers.

## Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app (requires Docker socket access)
python app.py
```

The server runs on `http://0.0.0.0:5000` by default. Configure via environment variables in `config.py`.

## Architecture

- **Backend**: Flask + Flask-SocketIO for real-time WebSocket communication
- **Frontend**: Vanilla JS with Socket.IO client for live updates
- **Authentication**: JWT-based (tokens expire after 24 hours)
- **System Monitoring**: Uses `psutil` for CPU, memory, disk, network stats; reads CPU temperature from Raspberry Pi sensors
- **Docker Integration**: Connects to Docker socket to list containers, view logs, and manage container lifecycle

## Key Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | No | Login page |
| `/dashboard` | GET | No | Main dashboard |
| `/api/login` | POST | No | Returns JWT token |
| `/api/stats` | GET | JWT | System statistics |
| `/api/processes` | GET | JWT | Top processes by CPU/memory |
| `/api/docker/containers` | GET | JWT | List all containers |
| `/api/docker/<action>/<id>` | POST | JWT | start/stop/restart container |

## Configuration

Edit `config.py` or set environment variables:
- `DASHBOARD_PASSWORD` - Login password (default: "pi")
- `JWT_SECRET` - JWT signing key
- `SECRET_KEY` - Flask secret key
- `DOCKER_SOCKET` - Path to Docker socket (default: `/var/run/docker.sock`)
- `HOST`/`PORT` - Server binding

## Dependencies

Flask, Flask-SocketIO, PyJWT, bcrypt, psutil, docker (v7.1+), python-socketio

## Python 3.13 Compatibility

The original code uses `eventlet` which is incompatible with Python 3.13. Workaround:
- Removed eventlet, uses default threading mode
- Upgraded docker library to 7.1.0 for urllib3 compatibility
- Added `allow_unsafe_werkzeug=True` to run() call