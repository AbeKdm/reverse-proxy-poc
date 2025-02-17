const net = require('net');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class HealthCheck {
    async checkHealth(type, target, timeout, healthPath = '/') {
        if (timeout < 2 || timeout > 60) throw new Error("Timeout must be between 2 and 60 seconds");
        
        return new Promise((resolve) => {
            try {
                const url = new URL(target);
                const protocol = url.protocol.replace(':', '').toUpperCase();
                const hostname = url.hostname;
                const port = url.port ? parseInt(url.port) : (protocol === 'HTTPS' ? 443 : 80);

                if (type.toUpperCase() === 'TCP') {
                    this.checkTcp(hostname, port, timeout * 1000, resolve);
                } else if (type.toUpperCase() === 'HTTP') {
                    this.checkHttp(protocol, hostname, port, healthPath, timeout * 1000, resolve);
                } else {
                    console.error("Unsupported test type");
                    resolve(false);
                }
            } catch (error) {
                console.error("Invalid target format", error);
                resolve(false);
            }
        });
    }

    checkTcp(hostname, port, timeout, callback) {
        const client = new net.Socket();
        const timer = setTimeout(() => {
            client.destroy();
            callback(false);
        }, timeout);

        client.connect(port, hostname, () => {
            clearTimeout(timer);
            client.destroy();
            callback(true);
        });

        client.on('error', () => {
            clearTimeout(timer);
            callback(false);
        });
    }

    checkHttp(protocol, hostname, port, path, timeout, callback) {
        const options = {
            hostname,
            port,
            path,
            method: 'GET',
            timeout
        };

        const requestModule = protocol === 'HTTPS' ? https : http;
        const req = requestModule.request(options, (res) => {
            callback(res.statusCode === 200);
        });

        req.on('error', () => callback(false));
        req.on('timeout', () => {
            req.destroy();
            callback(false);
        });
        req.end();
    }
}

module.exports = HealthCheck;
// The HealthCheck class is a utility class that provides a method to check the health of a server using TCP or HTTP. The checkHealth method accepts the following parameters:
// type: The type of health check to perform (TCP or HTTP).
