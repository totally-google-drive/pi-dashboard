import os
import bcrypt

# Flask configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'pi-dashboard-secret-key-change-me')
JWT_SECRET = os.environ.get('JWT_SECRET', 'jwt-secret-key-change-me')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24

# Default password (change in production!)
DEFAULT_PASSWORD = os.environ.get('DASHBOARD_PASSWORD', 'pi')

# Pre-hash the default password for secure comparison
HASHED_PASSWORD = bcrypt.hashpw(DEFAULT_PASSWORD.encode('utf-8'), bcrypt.gensalt())

# Docker socket path
DOCKER_SOCKET = os.environ.get('DOCKER_SOCKET', '/var/run/docker.sock')

# Server config
HOST = os.environ.get('HOST', '0.0.0.0')
PORT = int(os.environ.get('PORT', 5000))

# Stats update interval (seconds)
STATS_INTERVAL = 2