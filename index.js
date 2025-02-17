"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_proxy_middleware_1 = require("http-proxy-middleware");
var HealthCheck_1 = require("./HealthCheck");
var logger_1 = require("./logger"); // Import getLogger directly
var express = require('express');
var app = express();
var logger = (0, logger_1.getLogger)('PROXY');
logger.level = 'debug';
var TARGET_SERVERS = [
    "http://localhost:5041",
    "http://localhost:5042",
    "http://localhost:5043",
    "http://localhost:5044",
    "http://localhost:5045"
];
var healthCheck = new HealthCheck_1.default();
var lastServerIndex = 0;
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
var GetNodeServerUrl = function () { return __awaiter(void 0, void 0, void 0, function () {
    var i, currentServer, isServerHealthy;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                i = 0;
                _a.label = 1;
            case 1:
                if (!(i < TARGET_SERVERS.length)) return [3 /*break*/, 4];
                currentServer = TARGET_SERVERS[lastServerIndex];
                return [4 /*yield*/, healthCheck.checkHealth('TCP', currentServer, 5)];
            case 2:
                isServerHealthy = _a.sent();
                //const healthy = await isServerHealthy(currentServer);
                lastServerIndex = (lastServerIndex + 1) % TARGET_SERVERS.length;
                if (isServerHealthy) {
                    logger.info("Routing to healthy server: ".concat(currentServer));
                    return [2 /*return*/, currentServer];
                }
                logger.warn("[WARNING] Server ".concat(currentServer, " is down. Skipping..."));
                _a.label = 3;
            case 3:
                i++;
                return [3 /*break*/, 1];
            case 4: throw new Error("No healthy servers available!");
        }
    });
}); };
app.use(function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var targetServer, lastUseEpoch, currentEpoch, diffInSec, isServerHealthy, err_1, proxy;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                targetServer = req.headers['x-target-server'];
                console.log("[INFO] Request: ".concat(req.method, " ").concat(req.originalUrl, ", x-target-server: ").concat(targetServer));
                if (!targetServer) return [3 /*break*/, 2];
                lastUseEpoch = parseInt(req.headers["x-target-server-last-use"], 10);
                currentEpoch = Date.now();
                diffInSec = (currentEpoch - lastUseEpoch) / 1000;
                logger.info("Current time: ".concat(currentEpoch, ", last used time: ").concat(lastUseEpoch));
                logger.info("Last used server was used ".concat(diffInSec, " seconds ago."));
                if (diffInSec > 30) {
                    logger.info("Reusing the last used server ".concat(targetServer, " as it was used less than 30 seconds ago."));
                    targetServer = undefined;
                }
                if (!targetServer) return [3 /*break*/, 2];
                return [4 /*yield*/, healthCheck.checkHealth('TCP', targetServer, 5)];
            case 1:
                isServerHealthy = _a.sent();
                //const healthy = await isServerHealthy(targetServer);
                if (isServerHealthy) {
                    logger.info("Routing to server from header: ".concat(targetServer));
                }
                else {
                    logger.error("Specified server ".concat(targetServer, " is down, falling back to default routing."));
                    targetServer = undefined;
                }
                _a.label = 2;
            case 2:
                if (!!targetServer) return [3 /*break*/, 6];
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, GetNodeServerUrl()];
            case 4:
                targetServer = _a.sent();
                return [3 /*break*/, 6];
            case 5:
                err_1 = _a.sent();
                logger.error("".concat(err_1 instanceof Error ? err_1.message : err_1));
                return [2 /*return*/, res.status(500).json({ error: "No healthy servers available" })];
            case 6:
                proxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
                    target: targetServer,
                    changeOrigin: true,
                    logger: logger,
                    ws: true,
                    on: {
                        proxyReq: function (proxyReq, req) {
                            logger.info("[PROXY] ".concat(req.method, " ").concat(req.originalUrl, " -> ").concat(targetServer).concat(req.originalUrl));
                        },
                        proxyRes: function (proxyRes, req) {
                            logger.info("[PROXY] ".concat(req.method, " ").concat(req.originalUrl, " <- ").concat(targetServer).concat(req.originalUrl, " (").concat(proxyRes.statusCode, ")"));
                        },
                        error: function (err, req, res) {
                            logger.error("[PROXY] ".concat(req.method, " ").concat(req.originalUrl, ": ").concat(err.message));
                            res.status(500).json({ error: "Proxy error", details: err.message });
                        }
                    }
                });
                return [2 /*return*/, proxy(req, res, next)];
        }
    });
}); });
var PORT = 25000;
app.listen(PORT, function () { return __awaiter(void 0, void 0, void 0, function () {
    var _i, TARGET_SERVERS_1, server, isTcpHealthy;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger.info("Reverse proxy running on http://localhost:".concat(PORT, ", forwarding to healthy servers:"));
                _i = 0, TARGET_SERVERS_1 = TARGET_SERVERS;
                _a.label = 1;
            case 1:
                if (!(_i < TARGET_SERVERS_1.length)) return [3 /*break*/, 4];
                server = TARGET_SERVERS_1[_i];
                return [4 /*yield*/, healthCheck.checkHealth('TCP', server, 5)];
            case 2:
                isTcpHealthy = _a.sent();
                logger.info("Server ".concat(server, " is ").concat(isTcpHealthy ? 'healthy' : 'unhealthy'));
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = app;
