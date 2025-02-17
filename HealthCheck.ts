import * as net from 'net';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { getLogger } from './logger'; // Import getLogger directly

class HealthCheck {
    private logger = getLogger('HC');

    async checkHealth(type: string, target: string, timeout: number, healthPath: string = '/'): Promise<boolean> {
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
                    this.logger.error("Unsupported test type");
                    resolve(false);
                }
            } catch (error) {
                this.logger.error("Invalid target format", error);
                resolve(false);
            }
        });
    }

    private checkTcp(hostname: string, port: number, timeout: number, callback: (result: boolean) => void): void {
        this.logger.trace(`Checking TCP health for ${hostname}:${port}`);
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

    private checkHttp(protocol: string, hostname: string, port: number, path: string, timeout: number, callback: (result: boolean) => void): void {
        const options: http.RequestOptions = {
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

export default HealthCheck;