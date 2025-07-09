// Service Locator utility for dependency management in backend services
// Allows registration and retrieval of shared services or singletons
// Usage Example:
//   const locator = require('./serviceLocator');
//   locator.register('db', dbInstance);
//   const db = locator.get('db');

/**
 * Simple Service Locator for managing dependencies.
 */
class ServiceLocator {
  constructor() {
    this.services = new Map();
  }

  /**
   * Register a service or singleton instance.
   * @param {string} name - Service name.
   * @param {any} instance - Service instance.
   */
  register(name, instance) {
    this.services.set(name, instance);
  }

  /**
   * Retrieve a registered service by name.
   * @param {string} name - Service name.
   * @returns {any} - Registered service instance or undefined.
   */
  get(name) {
    return this.services.get(name);
  }

  /**
   * Remove a registered service.
   * @param {string} name - Service name.
   */
  unregister(name) {
    this.services.delete(name);
  }

  /**
   * Clear all registered services.
   */
  clear() {
    this.services.clear();
  }
}

module.exports = new ServiceLocator();