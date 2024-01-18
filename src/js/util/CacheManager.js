/**
 * CacheManager class for managing cached data in browser storage.
 *
 * @class
 * @param {number} [cacheInMinutes=240] - Default cache duration in minutes
 * @param {Storage} [storage=localStorage] - Storage mechanism to use (localStorage or sessionStorage).
 */
export class CacheManager
{
	/**
	 * Constructs a new CacheManager instance.
	 *
	 * @constructor
	 */
	constructor(cacheInMinutes = 240, storage = localStorage)
	{
	  this.cacheInMinutes = cacheInMinutes;
	  this.storage = storage;
	}

	/**
	 * Retrieves a cached value by key.
	 *
	 * @param {string} cacheKey - Key of the cached value.
	 * @returns {*|null} The cached value, or null if not found or expired.
	 */
	get(cacheKey)
	{
	  const cached = this.storage.getItem(cacheKey);
	  if (!cached)
	  	return null;

	  const { expiry, value } = JSON.parse(cached);
	  if (Date.now() > expiry) {
		this.remove(cacheKey); // Cleanly remove expired cache
		return null;
	  }

	  return value;
	}

	/**
	 * Sets a cached value with an optional expiration time.
	 *
	 * @param {string} cacheKey - Key of the cached value.
	 * @param {*} value - Value to cache.
	 * @param {number} [expiryInMinutes=this.cacheInMinutes] - Optional expiration time in minutes.
	 */
	set(cacheKey, value, expiryInMinutes = this.cacheInMinutes)
	{
	  const expiry = Date.now() + expiryInMinutes * 60 * 1000; // Convert minutes to milliseconds
	  const cachedValue = JSON.stringify({ expiry, value });
	  this.storage.setItem(cacheKey, cachedValue);
	}

	/**
	 * Removes a cached value by key.
	 *
	 * @param {string} cacheKey - Key of the cached value to remove.
	 */
	remove(cacheKey)
	{
	  this.storage.removeItem(cacheKey);
	}

	/**
	 * Removes all cached values except those specified in the keepKeys array.
	 *
	 * @param {string[]} keepKeys - Array of key names to keep.
	 */
	clearExcept(keepKeys)
	{
		// Collect keys to remove don't iterate over storage
		// and try to remove at the same time
		const keysToRemove = [];
		for (let i = 0; i < this.storage.length; i++) {
			const key = this.storage.key(i);
			if (!keepKeys.includes(key)) {
				keysToRemove.push(key);
			}
		}

		// Remove items using the collected keys
		for (const keyToRemove of keysToRemove) {
			this.storage.removeItem(keyToRemove);
		}
	}

	/**
	 * Clears all cached values.
	 */
	clear()
	{
	  this.storage.clear();
	}

	/**
	 * Checks if a cache value exists for a given key.
	 *
	 * @param {string} cacheKey - Key of the cached value to check.
	 * @returns {boolean} True if a cache value exists, false otherwise.
	 */
	hasCache(cacheKey)
	{
	  return !!this.storage.getItem(cacheKey);
	}

	/**
	 * Updates a specific property of a cached object, including support for nested properties.
	 *
	 * @param {string} cacheKey - Key of the cached object.
	 * @param {string} propertyPath - Property path to update (supports nested properties, e.g., 'nested.property').
	 * @param {*} newValue - New value to set for the property.
	 */
	setProperty(cacheKey, propertyPath, newValue)
	{
		if (newValue == null || newValue === undefined) {
			return;
		}

		const cachedObject = this.get(cacheKey);
		if (!cachedObject || typeof cachedObject !== 'object') {
			console.error(`CacheManager.setProperty: Cache key "${cacheKey}" not found or not an object.`);
			return;
		}

		const properties = propertyPath.split('.');
		let targetObject = cachedObject;
		for (let i = 0; i < properties.length - 1; i++) {
			const property = properties[i];
			if (!(property in targetObject)) {
				targetObject[property] = {};
			}
			targetObject = targetObject[property];
		}

		targetObject[properties[properties.length - 1]] = newValue;
		this.set(cacheKey, cachedObject);
	}

	/**
	 * Retrieves a specific property from a cached object, including support for nested properties.
	 *
	 * @param {string} cacheKey - Key of the cached object.
	 * @param {string} propertyPath - Property path to retrieve (supports nested properties, e.g., 'nested.property').
	 * @returns {*} The value of the property, or null if not found.
	 */
	getProperty(cacheKey, propertyPath)
	{
		const cachedObject = this.get(cacheKey);
		if (!cachedObject || typeof cachedObject !== 'object') {
			console.warn(`CacheManager.getProperty: Cache key "${cacheKey}" not found or not an object.`);
			return null;
		}

		const properties = propertyPath.split('.');
		let targetValue = cachedObject;

		for (let i = 0; i < properties.length; i++) {
			const property = properties[i];
			if (!(property in targetValue)) {
				console.warn(`Property "${property}" not found in cached object for key "${cacheKey}".`);
				return null;
			}
			targetValue = targetValue[property];
		}

		return targetValue;
	}

	/**
	 * Removes a specific property from a cached object.
	 *
	 * @param {string} cacheKey - Key of the cached object.
	 * @param {string} propertyPath - Property path to remove (supports nested properties, e.g., 'nested.property').
	 */
	removeProperty(cacheKey, propertyPath)
	{
		const cachedObject = this.get(cacheKey);
		if (!cachedObject || typeof cachedObject !== 'object') {
			console.error(`CacheManager.removeProperty: Cache key "${cacheKey}" not found or not an object.`);
			return;
		}

		const properties = propertyPath.split('.');
		let targetObject = cachedObject;

		for (let i = 0; i < properties.length - 1; i++) {
			const property = properties[i];
			if (!(property in targetObject)) {
				console.warn(`Property "${property}" not found in cached object for key "${cacheKey}".`);
				return;
			}
			targetObject = targetObject[property];
		}

		delete targetObject[properties[properties.length - 1]];
		this.set(cacheKey, cachedObject);
	}
}
