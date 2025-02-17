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
var net = require("net");
var http = require("http");
var https = require("https");
var url_1 = require("url");
var HealthCheck = /** @class */ (function () {
    function HealthCheck() {
    }
    HealthCheck.prototype.checkHealth = function (type_1, target_1, timeout_1) {
        return __awaiter(this, arguments, void 0, function (type, target, timeout, healthPath) {
            var _this = this;
            if (healthPath === void 0) { healthPath = '/'; }
            return __generator(this, function (_a) {
                if (timeout < 2 || timeout > 60)
                    throw new Error("Timeout must be between 2 and 60 seconds");
                return [2 /*return*/, new Promise(function (resolve) {
                        try {
                            var url = new url_1.URL(target);
                            var protocol = url.protocol.replace(':', '').toUpperCase();
                            var hostname = url.hostname;
                            var port = url.port ? parseInt(url.port) : (protocol === 'HTTPS' ? 443 : 80);
                            if (type.toUpperCase() === 'TCP') {
                                _this.checkTcp(hostname, port, timeout * 1000, resolve);
                            }
                            else if (type.toUpperCase() === 'HTTP') {
                                _this.checkHttp(protocol, hostname, port, healthPath, timeout * 1000, resolve);
                            }
                            else {
                                console.error("Unsupported test type");
                                resolve(false);
                            }
                        }
                        catch (error) {
                            console.error("Invalid target format", error);
                            resolve(false);
                        }
                    })];
            });
        });
    };
    HealthCheck.prototype.checkTcp = function (hostname, port, timeout, callback) {
        var client = new net.Socket();
        var timer = setTimeout(function () {
            client.destroy();
            callback(false);
        }, timeout);
        client.connect(port, hostname, function () {
            clearTimeout(timer);
            client.destroy();
            callback(true);
        });
        client.on('error', function () {
            clearTimeout(timer);
            callback(false);
        });
    };
    HealthCheck.prototype.checkHttp = function (protocol, hostname, port, path, timeout, callback) {
        var options = {
            hostname: hostname,
            port: port,
            path: path,
            method: 'GET',
            timeout: timeout
        };
        var requestModule = protocol === 'HTTPS' ? https : http;
        var req = requestModule.request(options, function (res) {
            callback(res.statusCode === 200);
        });
        req.on('error', function () { return callback(false); });
        req.on('timeout', function () {
            req.destroy();
            callback(false);
        });
        req.end();
    };
    return HealthCheck;
}());
exports.default = HealthCheck;
