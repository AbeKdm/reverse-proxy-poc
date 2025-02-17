import * as net from 'net';
import { createProxyMiddleware } from 'http-proxy-middleware';
import HealthCheck from './HealthCheck';
import { Request, Response, NextFunction } from 'express';

var express = require('express');
var app = express();


let TARGET_SERVERS: string[] = [
    "http://localhost:5041",
    "http://localhost:5042",
    "http://localhost:5043",
    "http://localhost:5044",
    "http://localhost:5045"
];

const healthCheck = new HealthCheck();
let lastServerIndex = 0;

/*const isServerHealthy = (serverUrl: string): Promise<boolean> => {
    console.log(`\n[DEBUG] Checking server health: ${serverUrl}`);
    return new Promise((resolve) => {
        const { hostname, port } = new URL(serverUrl);
        const socket = net.connect(parseInt(port), hostname, () => {
            socket.destroy();
            resolve(true);
        });

        socket.setTimeout(200);
        socket.on("timeout", () => {
            socket.destroy();
            resolve(false);
        });

        socket.on("error", () => {
            resolve(false);
        });
    });
};*/

const GetNodeServerUrl = async (): Promise<string> => {
    for (let i = 0; i < TARGET_SERVERS.length; i++) {
        const currentServer = TARGET_SERVERS[lastServerIndex];
        const isServerHealthy = await healthCheck.checkHealth('TCP', currentServer, 5);
        //const healthy = await isServerHealthy(currentServer);

        lastServerIndex = (lastServerIndex + 1) % TARGET_SERVERS.length;

        if (isServerHealthy) {
            console.log(`[INFO] Routing to healthy server: ${currentServer}`);
            return currentServer;
        }

        console.log(`[WARNING] Server ${currentServer} is down. Skipping...`);
    }

    throw new Error("No healthy servers available!");
};

app.use(async (req: Request, res: Response, next: NextFunction) => {
    let targetServer = req.headers['x-target-server'] as string | undefined;
    console.log(`[INFO] Request: ${req.method} ${req.originalUrl}, x-target-server: ${targetServer}`);

    if (targetServer) {
        const lastUseEpoch = parseInt(req.headers["x-target-server-last-use"] as string, 10);
        const currentEpoch = Date.now();
        const diffInSec = (currentEpoch - lastUseEpoch) / 1000;

        console.log(`[INFO] Current time: ${currentEpoch}, last used time: ${lastUseEpoch}`);
        console.log(`[INFO] Last used server was used ${diffInSec} seconds ago.`);

        if (diffInSec > 30) {
            console.log(`[INFO] Reusing the last used server ${targetServer} as it was used less than 30 seconds ago.`);
            targetServer = undefined;
        }

        if (targetServer) {
            const isServerHealthy = await healthCheck.checkHealth('TCP', targetServer, 5);
            //const healthy = await isServerHealthy(targetServer);
            if (isServerHealthy) {
                console.log(`[INFO] Routing to server from header: ${targetServer}`);
            } else {
                console.log(`[ERROR] Specified server ${targetServer} is down, falling back to default routing.`);
                targetServer = undefined;
            }
        }
    }

    if (!targetServer) {
        try {
            targetServer = await GetNodeServerUrl();
        } catch (err) {
            console.error(`[ERROR] ${err instanceof Error ? err.message : err}`);
            return res.status(500).json({ error: "No healthy servers available" });
        }
    }

    const proxy = createProxyMiddleware({
        target: targetServer,
        changeOrigin: true,
        ws: true,
        on: {
            proxyReq: (proxyReq, req: Request) => {
                console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${targetServer}${req.originalUrl}`);
            },
            proxyRes: (proxyRes, req: Request) => {
                console.log(`[PROXY] ${req.method} ${req.originalUrl} <- ${targetServer}${req.originalUrl} (${proxyRes.statusCode})`);
            },
            error: (err, req: Request, res: Response) => {
                console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
                res.status(500).json({ error: "Proxy error", details: err.message });
            }
        }
    });

    return proxy(req, res, next);
});

const PORT = 25000;
app.listen(PORT, async () => {
    console.log(`Reverse proxy running on http://localhost:${PORT}, forwarding to healthy servers:`);
    for (const server of TARGET_SERVERS) {
        const isTcpHealthy = await healthCheck.checkHealth('TCP', server, 5);
        console.log(`Server ${server} is ${isTcpHealthy ? 'healthy' : 'unhealthy'}`);
    }
});

export default app;
