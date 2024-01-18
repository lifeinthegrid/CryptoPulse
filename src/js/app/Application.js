import { ENV } 					from '../Environment.js';
import { CacheManager } 		from '../util/CacheManager.js';

/**
 * The main application
 *
 * @class APP
 */
export class APP
{
	static CACHE = new CacheManager();

	/**
	 * Gets an config JSON file and returns
	 */
	static async fetchConfigFile(configPath)
	{
		try {
			const response = await fetch(configPath);
			if (!response.ok) {
				throw new Error(`Config File HTTP error on path "${configPath}".  status: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			console.error("Error loading configuration from file:", error);
		}
	}

	/**
	 * Loads any config JSON file and caches to local storage
	 */
	static async loadConfig(configPath, localStorageKey)
	{
		//LOCAL STORAGE
		const localData = APP.CACHE.get(localStorageKey);
		let   config;
		if (localData) {
			config = localData;
			return config;
		}

		//JSON FILE: Save for 6 months
		try {
			config = await this.fetchConfigFile(configPath);
			APP.CACHE.set(localStorageKey, config, 262800);
			return config;

		} catch (error) {
			console.error("Error loading configuration from file:", error);
			return config;
		}
	}

	/**
	 * Applies a specific theme to the page by dynamically replacing stylesheets.
	 *
	 * @param {string} theme - The name of the theme to apply (e.g., "night", "smooth").
	 */
	static async loadTheme(theme = null)
	{
		let themeName = (theme === null) ? APP.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'theme') : theme;
		document.querySelector(`link[href="./css/style-night.css"]`)?.remove();
		document.querySelector(`link[href="./css/style-smooth.css"]`)?.remove();

		const newLink = document.createElement("link");
		newLink.rel = "stylesheet";
		newLink.href = `./css/style-${themeName}.css`;
		document.head.appendChild(newLink);
		APP.CACHE.setProperty(ENV.APP_CONFIG_KEY, 'theme', themeName);
	}

	/**
	 * Gets a current copy of the APP Config file from cache
	 */
	static get CONFIG()
	{
		return APP.CACHE.get(ENV.APP_CONFIG_KEY);
	}
}