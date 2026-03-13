# Pi Dashboard - Raspberry Pi System Monitor

![Pi Dashboard Logo](https://cdn-icons-png.flaticon.com/512/2977/2977177.png)

A **Flask-based web dashboard** for monitoring Raspberry Pi system resources and managing Docker containers in real-time.

## 📋 Features

### System Monitoring
- **CPU Usage**: Real-time CPU percentage with per-core breakdown
- **CPU Temperature**: Raspberry Pi thermal monitoring
- **Memory Usage**: RAM usage with detailed statistics
- **Disk Storage**: Storage usage and free space
- **Network Speed**: Real-time upload/download speeds
- **Disk I/O**: Read/write speeds and totals

### Process Management
- **Top Processes**: View processes sorted by CPU and memory usage
- **Process Details**: See CPU and memory consumption for each process

### Docker Container Management
- **Container List**: View all running and stopped containers
- **Container Stats**: CPU, memory, and network usage per container
- **Container Logs**: View real-time logs for each container
- **Container Actions**: Start, stop, and restart containers
- **Immich Grouping**: Special grouping for Immich photo management stack
- **Bulk Actions**: Start/stop/restart all Immich containers at once

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Login attempt protection (5 attempts/minute)
- **HTTPS Ready**: Configure for secure connections

## 🚀 Installation

### Prerequisites
- Raspberry Pi (any model)
- Python 3.13+
- Docker (optional, for container management)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pi-dashboard.git
   cd pi-dashboard
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # OR
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the dashboard**
   Open your browser and navigate to: `http://<your-pi-ip>:5000`

### Docker Installation (Alternative)

```bash
# Build Docker image
docker build -t pi-dashboard .

# Run container
docker run -d \
  -p 5000:5000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name pi-dashboard \
  pi-dashboard
```

## 🔧 Configuration

Edit `config.py` to customize settings:

```python
# Flask configuration
SECRET_KEY = 'your-secret-key-change-me'
JWT_SECRET = 'jwt-secret-key-change-me'

# Default password (change in production!)
DEFAULT_PASSWORD = 'pi'  # Change this!

# Docker socket path
DOCKER_SOCKET = '/var/run/docker.sock'

# Server config
HOST = '0.0.0.0'
PORT = 5000

# Stats update interval (seconds)
STATS_INTERVAL = 2
```

### Environment Variables

You can also use environment variables:

```bash
export SECRET_KEY='your-secret-key'
export JWT_SECRET='your-jwt-secret'
export DASHBOARD_PASSWORD='your-password'
export HOST='0.0.0.0'
export PORT=5000
```

## 🔐 Security

### Default Credentials
- **Username**: admin (implicit)
- **Password**: `pi` (change immediately!)

### Changing the Password

1. **Method 1**: Edit `config.py`
   ```python
   DEFAULT_PASSWORD = 'your-new-strong-password'
   ```

2. **Method 2**: Use environment variable
   ```bash
export DASHBOARD_PASSWORD='your-new-password'
```

### Security Best Practices

1. **Change default password** immediately after first login
2. **Use HTTPS** in production (configure reverse proxy with SSL)
3. **Restrict access** by IP if possible
4. **Regularly update** dependencies
5. **Monitor logs** for suspicious activity

## 📱 Usage

### Login
1. Open browser to `http://<pi-ip>:5000`
2. Enter your password
3. Click "Login"

### Dashboard Overview

#### System Stats Cards
- **CPU Card**: CPU usage, temperature, core count, top CPU-consuming processes
- **Memory Card**: RAM usage, available memory, top memory-consuming processes
- **Storage Card**: Disk usage, free space
- **Network Card**: Real-time upload/download speeds
- **Disk I/O Card**: Read/write speeds
- **Temperature Card**: Current CPU temperature

#### Docker Section
- **Container Cards**: Each container has its own card
- **Immich Group**: Special grouping for Immich services
- **Actions**: Start, stop, restart containers
- **Logs**: View container logs (50 lines by default)

### Keyboard Shortcuts
- **Login**: Press Enter to submit password

## 🎨 Screenshots

### Login Page
![Login Page](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Docker Management
![Docker Management](screenshots/docker.png)

## 🔄 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | Authenticate and get JWT token |

**Request**:
```json
{
  "password": "your-password"
}
```

**Response**:
```json
{
  "token": "jwt.token.here"
}
```

### System Monitoring
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stats` | GET | JWT | Get system statistics |
| `/api/processes` | GET | JWT | Get top processes |

### Docker Management
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/docker/containers` | GET | JWT | List all containers |
| `/api/docker/stats/<id>` | GET | JWT | Get container stats |
| `/api/docker/logs/<id>` | GET | JWT | Get container logs |
| `/api/docker/start/<id>` | POST | JWT | Start container |
| `/api/docker/stop/<id>` | POST | JWT | Stop container |
| `/api/docker/restart/<id>` | POST | JWT | Restart container |

## 🛠️ Development

### Running in Development Mode

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run with debug mode
python app.py
```

### Code Structure

```
pi-dashboard/
├── app.py                  # Main application
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├──
├── static/
│   ├── css/
│   │   └── style.css       # CSS styles
│   └── js/
│       ├── app.js         # Main JavaScript
│       └── socket.js      # WebSocket handler
├── templates/
│   ├── login.html         # Login page
│   └── dashboard.html     # Main dashboard
├── pi-dashboard.service   # Systemd service file
└── README.md              # This file
```

### Adding New Features

1. **Backend**: Add new routes in `app.py`
2. **Frontend**: Update `app.js` and `dashboard.html`
3. **Styles**: Add CSS in `style.css`
4. **Test**: Verify functionality

## 📦 Systemd Service

For production deployment, use the provided systemd service:

```bash
# Copy service file
sudo cp pi-dashboard.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start pi-dashboard

# Enable on boot
sudo systemctl enable pi-dashboard

# Check status
sudo systemctl status pi-dashboard

# View logs
journalctl -u pi-dashboard -f
```

## 🐛 Troubleshooting

### Common Issues

#### Docker Connection Failed
**Error**: "Could not connect to Docker"
**Solution**: Ensure Docker socket is accessible:
```bash
sudo chmod 666 /var/run/docker.sock
```

#### Port Already in Use
**Error**: "Address already in use"
**Solution**: Change port in `config.py` or kill existing process:
```bash
pkill -f "python app.py"
```

#### Permission Denied
**Error**: Permission errors on Docker socket
**Solution**: Run as root or add user to docker group:
```bash
sudo usermod -aG docker $USER
```

#### Module Not Found
**Error**: Missing Python modules
**Solution**: Install dependencies:
```bash
pip install -r requirements.txt
```

### Debugging

Enable debug mode in `app.py`:
```python
socketio.run(app, host=config.HOST, port=config.PORT, debug=True)
```

View logs:
```bash
python app.py
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

### Code Standards

- Follow PEP 8 style guide
- Write clear, descriptive commit messages
- Add comments for complex logic
- Test your changes thoroughly

## 📞 Support

For issues and questions:

- **GitHub Issues**: [Open an issue](https://github.com/totally-google-drive/pi-dashboard/issues)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgements

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/) - Real-time communication
- [psutil](https://psutil.readthedocs.io/) - System monitoring
- [Docker SDK](https://docker-py.readthedocs.io/) - Docker integration
- [Font Awesome](https://fontawesome.com/) - Icons

---

**Project**: Pi Dashboard
**Version**: 1.0.0
**Author**: Totally-google-drive
**License**: MIT

🚀 **Happy Monitoring!** 🍓
