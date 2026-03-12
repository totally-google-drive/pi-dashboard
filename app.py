import os
import time
import threading
import logging
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict

import psutil
import docker
from flask import Flask, render_template, jsonify, request, g
from flask_socketio import SocketIO, emit
import jwt
import bcrypt

import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Rate limiting storage
login_attempts = defaultdict(list)

app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*")

# Docker client
try:
    docker_client = docker.DockerClient(base_url=f'unix://{config.DOCKER_SOCKET}')
    logger.info("Connected to Docker daemon")
except Exception as e:
    logger.warning(f"Could not connect to Docker: {e}. Docker features will be disabled.")
    docker_client = None


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'No token provided'}), 401

        try:
            payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated


def rate_limited(max_attempts=5, window=60):
    """Decorator to limit API endpoint calls"""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Get client IP
            ip = request.remote_addr
            now = time.time()

            # Clean old attempts
            login_attempts[ip] = [t for t in login_attempts[ip] if now - t < window]

            if len(login_attempts[ip]) >= max_attempts:
                logger.warning(f"Rate limit exceeded for IP: {ip}")
                return jsonify({'error': 'Too many attempts, please try again later'}), 429

            login_attempts[ip].append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator


def get_cpu_temp():
    """Get CPU temperature from Raspberry Pi"""
    try:
        temps = psutil.sensors_temperatures()
        # Try common Raspberry Pi thermal zone names
        for key in ['cpu_thermal', 'cpu-thermal', 'soc_thermal', 'soc-thermal', 'thermal_zone0']:
            if key in temps:
                return temps[key][0].current
        # Fallback: search for any thermal zone with 'cpu' or 'soc' in name
        for key in temps:
            if any(x in key.lower() for x in ['cpu', 'soc', 'thermal']):
                return temps[key][0].current
    except Exception:
        pass
    return None


def get_system_stats():
    """Get comprehensive system stats"""
    # Use Flask's application context for thread-safe storage
    if not hasattr(g, '_prev_net_io'):
        g._prev_net_io = None
    if not hasattr(g, '_prev_disk_io'):
        g._prev_disk_io = None

    _prev_net_io = g._prev_net_io
    _prev_disk_io = g._prev_disk_io

    # CPU
    cpu_percent = psutil.cpu_percent(interval=0.1, percpu=True)
    cpu_total = psutil.cpu_percent(interval=0.1)

    # CPU temperature
    cpu_temp = get_cpu_temp()

    # Memory
    mem = psutil.virtual_memory()

    # Disk
    disk = psutil.disk_usage('/')

    # Network
    net_io = psutil.net_io_counters()

    # Calculate network speed (bytes per second since last check)
    net_speed_sent = 0
    net_speed_recv = 0
    if _prev_net_io is not None:
        time_delta = config.STATS_INTERVAL  # seconds
        net_speed_sent = max(0, (net_io.bytes_sent - _prev_net_io.bytes_sent) / time_delta)
        net_speed_recv = max(0, (net_io.bytes_recv - _prev_net_io.bytes_recv) / time_delta)
    g._prev_net_io = net_io

    # Disk I/O
    try:
        disk_io = psutil.disk_io_counters()
        disk_read = disk_io.read_bytes
        disk_write = disk_io.write_bytes
        # Calculate disk I/O speed
        disk_speed_read = 0
        disk_speed_write = 0
        if _prev_disk_io is not None:
            time_delta = config.STATS_INTERVAL
            disk_speed_read = max(0, (disk_read - _prev_disk_io.read_bytes) / time_delta)
            disk_speed_write = max(0, (disk_write - _prev_disk_io.write_bytes) / time_delta)
        g._prev_disk_io = disk_io
    except Exception:
        disk_read = 0
        disk_write = 0
        disk_speed_read = 0
        disk_speed_write = 0

    return {
        'cpu': {
            'percent': cpu_total,
            'per_core': cpu_percent,
            'temperature': cpu_temp,
            'count': psutil.cpu_count()
        },
        'memory': {
            'total': mem.total,
            'used': mem.used,
            'available': mem.available,
            'percent': mem.percent
        },
        'disk': {
            'total': disk.total,
            'used': disk.used,
            'free': disk.free,
            'percent': disk.percent
        },
        'network': {
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'speed_sent': net_speed_sent,
            'speed_recv': net_speed_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv
        },
        'disk_io': {
            'read_bytes': disk_read,
            'write_bytes': disk_write,
            'speed_read': disk_speed_read,
            'speed_write': disk_speed_write
        },
        'timestamp': datetime.now().isoformat()
    }


def get_process_list():
    """Get top processes by CPU and memory usage"""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            pinfo = proc.info
            if pinfo['cpu_percent'] is None:
                pinfo['cpu_percent'] = 0
            if pinfo['memory_percent'] is None:
                pinfo['memory_percent'] = 0
            processes.append({
                'pid': pinfo['pid'],
                'name': pinfo['name'],
                'cpu': round(pinfo['cpu_percent'], 1),
                'memory': round(pinfo['memory_percent'], 1)
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    # Sort by CPU and get top 15
    processes_cpu = sorted(processes, key=lambda x: x['cpu'], reverse=True)[:15]
    # Sort by memory and get top 15
    processes_mem = sorted(processes, key=lambda x: x['memory'], reverse=True)[:15]

    return {
        'by_cpu': processes_cpu,
        'by_memory': processes_mem
    }


def get_docker_containers():
    """Get all Docker containers with their status"""
    if docker_client is None:
        logger.warning("Docker client not available")
        return {'error': 'Docker not available'}

    try:
        containers = docker_client.containers.list(all=True)
        result = []
        for container in containers:
            # Get container stats
            try:
                stats = container.stats(stream=False)
                cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                           stats['precpu_stats']['cpu_usage']['total_usage']
                system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                              stats['precpu_stats']['system_cpu_usage']
                cpu_percent = (cpu_delta / system_delta) * 100.0 if system_delta > 0 else 0

                memory_usage = stats['memory_stats'].get('usage', 0)
                memory_limit = stats['memory_stats'].get('limit', 1)
                memory_percent = (memory_usage / memory_limit) * 100.0
            except Exception:
                cpu_percent = 0
                memory_usage = 0
                memory_percent = 0

            # Get container creation time from attrs
            try:
                container_attrs = container.attrs
                created_at = container_attrs.get('Created', None)
            except Exception:
                created_at = None

            result.append({
                'id': container.id,
                'short_id': container.short_id,
                'name': container.name,
                'image': container.image.tags[0] if container.image.tags else container.image.short_id,
                'status': container.status,
                'created': created_at,
                'cpu_percent': round(cpu_percent, 2),
                'memory_usage': memory_usage,
                'memory_percent': round(memory_percent, 2)
            })
        return result
    except Exception as e:
        logger.error(f"Error getting Docker containers: {e}", exc_info=True)
        return {'error': str(e)}


def get_container_logs(container_id, lines=100):
    """Get logs from a specific container"""
    if docker_client is None:
        return "Error: Docker not available"

    try:
        container = docker_client.containers.get(container_id)
        logs = container.logs(tail=lines, timestamps=True).decode('utf-8')
        return logs
    except Exception as e:
        logger.error(f"Error getting container logs for {container_id}: {e}", exc_info=True)
        return f"Error: {str(e)}"


# Routes
@app.route('/')
def index():
    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


@app.route('/api/login', methods=['POST'])
@rate_limited(max_attempts=5, window=60)
def login():
    data = request.get_json()
    password = data.get('password', '')

    # Compare password with pre-hashed password
    if bcrypt.checkpw(password.encode('utf-8'), config.HASHED_PASSWORD):
        # Clear failed attempts on successful login
        ip = request.remote_addr
        login_attempts[ip] = []

        # Generate JWT token
        payload = {
            'user': 'admin',
            'exp': datetime.utcnow() + timedelta(hours=config.JWT_EXPIRY_HOURS)
        }
        token = jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
        logger.info(f"Successful login from {ip}")
        return jsonify({'token': token})

    logger.warning(f"Failed login attempt from {request.remote_addr}")
    return jsonify({'error': 'Invalid password'}), 401


@app.route('/api/stats', methods=['GET'])
@jwt_required
def stats():
    return jsonify(get_system_stats())


@app.route('/api/processes', methods=['GET'])
@jwt_required
def processes():
    return jsonify(get_process_list())


@app.route('/api/docker/containers', methods=['GET'])
@jwt_required
def docker_containers():
    return jsonify(get_docker_containers())


@app.route('/api/docker/logs/<container_id>', methods=['GET'])
@jwt_required
def docker_logs(container_id):
    lines = request.args.get('lines', 100, type=int)
    return jsonify({'logs': get_container_logs(container_id, lines)})


@app.route('/api/docker/stats/<container_id>', methods=['GET'])
@jwt_required
def docker_container_stats(container_id):
    if docker_client is None:
        return jsonify({'error': 'Docker not available'}), 500

    try:
        container = docker_client.containers.get(container_id)
        stats = container.stats(stream=False)

        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                   stats['precpu_stats']['cpu_usage']['total_usage']
        system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                      stats['precpu_stats']['system_cpu_usage']
        cpu_percent = (cpu_delta / system_delta) * 100.0 if system_delta > 0 else 0

        return jsonify({
            'cpu_percent': round(cpu_percent, 2),
            'memory_usage': stats['memory_stats'].get('usage', 0),
            'memory_limit': stats['memory_stats'].get('limit', 0),
            'memory_percent': round((stats['memory_stats'].get('usage', 0) / stats['memory_stats'].get('limit', 1)) * 100, 2),
            'network_rx': stats['networks'].get('eth0', {}).get('rx_bytes', 0) if 'networks' in stats else 0,
            'network_tx': stats['networks'].get('eth0', {}).get('tx_bytes', 0) if 'networks' in stats else 0
        })
    except Exception as e:
        logger.error(f"Error getting container stats for {container_id}: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/docker/<action>/<container_id>', methods=['POST'])
@jwt_required
def docker_action(action, container_id):
    if docker_client is None:
        return jsonify({'error': 'Docker not available'}), 500

    try:
        container = docker_client.containers.get(container_id)

        if action == 'start':
            container.start()
        elif action == 'stop':
            container.stop(timeout=10)
        elif action == 'restart':
            container.restart(timeout=10)
        else:
            return jsonify({'error': 'Invalid action'}), 400

        # Emit update to all clients
        socketio.emit('container_update', get_docker_containers())

        return jsonify({'success': True, 'status': container.status})
    except Exception as e:
        logger.error(f"Error performing Docker action {action} on {container_id}: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# WebSocket events
@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('stats_update', get_system_stats())


@socketio.on('request_stats')
def handle_request_stats(sid):
    emit('stats_update', get_system_stats())


# Background thread for stats updates
def stats_broadcast():
    while True:
        socketio.sleep(config.STATS_INTERVAL)
        try:
            socketio.emit('stats_update', get_system_stats())
        except Exception as e:
            logger.error(f"Error broadcasting stats: {e}", exc_info=True)


def container_broadcast():
    while True:
        socketio.sleep(10)
        try:
            containers = get_docker_containers()
            if containers and not isinstance(containers, dict) or 'error' not in containers:
                socketio.emit('container_update', containers)
        except Exception as e:
            logger.error(f"Error broadcasting containers: {e}", exc_info=True)


if __name__ == '__main__':
    # Start background threads
    socketio.start_background_task(stats_broadcast)
    socketio.start_background_task(container_broadcast)

    logger.info(f"Starting Pi Dashboard on http://{config.HOST}:{config.PORT}")
    logger.info(f"Default password: {config.DEFAULT_PASSWORD}")
    logger.info(f"Change password in config.py or set DASHBOARD_PASSWORD env var")

    socketio.run(app, host=config.HOST, port=config.PORT, debug=False, allow_unsafe_werkzeug=True)