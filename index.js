const express = require("express");
const net = require("net");
const { createProxyMiddleware } = require("http-proxy-middleware");

const HealthCheck = require('./HealthCheck');

const app = express();

let TARGET_SERVERS = [
    "http://localhost:5041",
    "http://localhost:5042",
    "http://localhost:5043"
];

// add a healthcheck using  HealthCheck class
const healthCheck = new HealthCheck();

// Variable to track the last used server index
let lastServerIndex = 0;

// Function to check if a server is reachable via TCP
const isServerHealthy = (serverUrl) => {
    console.log(`[DEBUG] Checking server health: ${serverUrl}`);
    return new Promise((resolve) => {
        const { hostname, port } = new URL(serverUrl);
        const socket = net.connect(port, hostname, () => {
            socket.destroy();
            resolve(true); // Server is reachable
        });

        socket.setTimeout(200); // Set timeout for 0.2 second
        socket.on("timeout", () => {
            socket.destroy();
            resolve(false); // Server is not responding
        });

        socket.on("error", () => {
            resolve(false); // Server is not available
        });
    });
};

// Function to get the next healthy server in a round-robin manner
const GetNodeServerUrl = async () => {
    // Loop through the servers to find a healthy one
    for (let i = 0; i < TARGET_SERVERS.length; i++) {
        const currentServer = TARGET_SERVERS[lastServerIndex];
        const healthy = await isServerHealthy(currentServer);

        lastServerIndex = (lastServerIndex + 1) % TARGET_SERVERS.length;

        if (healthy) {
            // Update the last used server index for the next round-robin selection
            console.log(`[INFO] Routing to healthy server: ${currentServer}`);
            return currentServer;
        }

        console.log(`[WARNING] Server ${currentServer} is down. Skipping...`);
    }

    throw new Error("No healthy servers available!");
};

// Middleware to dynamically assign a target server with health check
app.use(async (req, res, next) => {
    let targetServer = req.headers['x-target-server'];
    // log request and this header
    console.log(`\n[INFO] Request: ${req.method} ${req.originalUrl}, x-target-server: ${targetServer}`);

    // If the 'x-target-server' header is present, perform health check on it
    if (targetServer) {

        if (req.headers["x-target-server-last-use"]) {
            const lastUseEpoch = parseInt(req.headers["x-target-server-last-use"], 10);
            const currentEpoch = Date.now();

            console.log(`x-target-server-last-use: ${lastUseEpoch}, currentEpoch: ${currentEpoch}`);

            const diffInMs = currentEpoch - lastUseEpoch;
            const diffInSec = diffInMs / 1000; // Convert to seconds
            const diffInMin = diffInSec / 60;  // Convert to minutes
            console.log(`[INFO] Last used server was used ${diffInSec} seconds ago.`);

            if (diffInSec > 30) {
                console.log(`[INFO] Reusing the last used server ${targetServer} as it was used less than a 30 seconds ago.`);
                targetServer = null; // Reset to fallback logic if the specified server is unhealthy
            }

        }

        if (targetServer) {
            const healthy = await isServerHealthy(targetServer);
            if (healthy) {
                console.log(`[INFO] Routing to server from header: ${targetServer}`);
            } else {
                console.log(`[ERROR] Specified server ${targetServer} is down, falling back to default routing.`);
                targetServer = null; // Reset to fallback logic if the specified server is unhealthy
            }
        }
    }

    // If no valid target server from header, or if the header's server is unhealthy, fallback to the default round-robin server selection
    if (!targetServer) {
        try {
            targetServer = await GetNodeServerUrl();
        } 
        catch (err) {
            console.error(`[ERROR] ${err.message}`);
            return res.status(500).json({ error: "No healthy servers available" });
        }
    }

    const proxy = createProxyMiddleware({
        target: targetServer,
        changeOrigin: true,
        ws: true,
        logLevel: "debug",
        on: {
            proxyReq: (proxyReq, req, res) => {
                console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${targetServer}${req.originalUrl}`);
            },
            proxyRes: (proxyRes, req, res) => {
                console.log(`[PROXY] ${req.method} ${req.originalUrl} <- ${targetServer}${req.originalUrl} (${proxyRes.statusCode})`);
            },
            error: (err, req, res) => {
                console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
                res.status(500).json({ error: "Proxy error", details: err.message });
            }
        }
    });

    return proxy(req, res, next);
});

// Start the proxy server
const PORT = 25000;
app.listen(PORT, () => {
    console.log(`Reverse proxy running on http://localhost:${PORT}, forwarding to healthy servers:`);
    TARGET_SERVERS.forEach(async (server) => {
        const isTcpHealthy = await healthCheck.checkHealth('TCP', server, 5);
        console.log(`Server ${server} is ${isTcpHealthy ? 'healthy' : 'unhealthy'}`);
    });    
});
