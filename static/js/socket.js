// WebSocket handler for real-time updates
class SocketHandler {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            if (typeof onSocketConnected === 'function') {
                onSocketConnected();
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
        });

        this.socket.on('stats_update', (data) => {
            if (typeof onStatsUpdate === 'function') {
                onStatsUpdate(data);
            }
        });

        this.socket.on('container_update', (data) => {
            if (typeof onContainerUpdate === 'function') {
                onContainerUpdate(data);
            }
        });
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    requestStats() {
        this.emit('request_stats', {});
    }
}

const socketHandler = new SocketHandler();