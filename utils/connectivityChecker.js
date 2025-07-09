// Connectivity Checker utility for verifying remote service or database reachability
// Useful for health checks and monitoring external dependencies
// Usage Example:
//   const checkConnectivity = require('./connectivityChecker');
//   checkConnectivity('google.com', 80).then(isReachable => console.log(isReachable));

const net = require('net');

/**
 * Checks if a remote host and port are reachable.
 * @param {string} host - The hostname or IP address to check.
 * @param {number} port - The port number to check.
 * @param {number} [timeout=3000] - Timeout in milliseconds.
 * @returns {Promise<boolean>} - Resolves to true if reachable, false otherwise.
 */
function checkConnectivity(host, port, timeout = 3000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let reachable = false;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      reachable = true;
      socket.destroy();
    });
    socket.on('timeout', () => {
      socket.destroy();
    });
    socket.on('error', () => {
      socket.destroy();
    });
    socket.on('close', () => {
      resolve(reachable);
    });
    socket.connect(port, host);
  });
}

module.exports = checkConnectivity;