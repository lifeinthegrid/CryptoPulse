import { ENV } 					from '../Environment.js';
import { CoinGeckoAdapter } 	from '../../../vendor/api/coin-gecko/CoinGecko.js';
import { CoinWidget }			from './CoinWidget.js';
import { PageBase } 			from './PageBase.js';

/**
 * Dashboard to manage cryptocurrency widgets.
 *
 * @class CoinConsole
 */
export class CoinConsole extends PageBase
{
	/**
	 * Constructor
	 */
    constructor(app)
	{
		super();
		this.APP            = app;
		this.CACHE			= app.CACHE
		this.API			= new CoinGeckoAdapter();
		this.domAnchorId	= `crypto-console`;
		this.htmlID 		= `crypto-widgets`;
		this.isLoading  	= false;
    }

	/**
	 * Fetches market data for the specified cryptocurrencies from the API.
	 */
	async apiCacheMarkets()
	{
		//await new Promise(resolve => setTimeout(resolve, 1200));
		let cryptoList = this.APP.CONFIG.coins.map(item => item.id).join(",");

		try {
			const apiData = await this.API.coins.markets({
				vs_currency: this.APP.CONFIG.currency,
				ids: cryptoList,
				order: 'market_cap_desc',
				per_page: 250,
				page: 1,
				[this.apiTypeQuery] : this.APP.CONFIG.apiKey
			});

			for (const coin of apiData) {
				let cacheKey = `${ENV.API_PREFIX_KEY}_${coin.id}`;
				this.CACHE.set(cacheKey, coin);
			}
			if (apiData.length == 0) {
				this.setStatus('Check app.json to make sure coin ids are correct.');
			}
			this.CACHE.setProperty(ENV.APP_CONFIG_KEY, '_apiCoinsFound', apiData.length || 0);
		} catch (error) {
			console.error(error);
			this.setStatus('CoinGecko request error... Try again in a few minutes!');
		}
	}

	/**
	 * Fetches price data for a specific cryptocurrency from the API.
	 *
	 * @param {String} coinId - The ID of the cryptocurrency.
	 */
	async apiCacheCoinPrices(coinId)
	{
		try {
			//await new Promise(resolve => setTimeout(resolve, 1200));
			let apiData = await this.API.coins.fetchMarketChart(coinId,
				{
					vs_currency: this.APP.CONFIG.currency,
					days: 365,
					interval: 'daily',
					[this.apiTypeQuery] : this.APP.CONFIG.apiKey
				});

			let cacheKey = `${ENV.API_PREFIX_KEY}_${coinId}`;
			let coinData = this.CACHE.get(cacheKey);

			if (coinData) {
				let coinDataWithChart = { ...coinData, _history: apiData };
				this.CACHE.set(cacheKey, coinDataWithChart);
			}
		} catch (error) {
			console.error('Error fetching market chart data for:', coinId, error);
		}
	}

	/**
	 * Shows empty console if no coins are found
	 */
	showEmptyConsole()
	{
		if ($(`#${this.htmlID}`).is(':empty')) {
			$(`#${this.domAnchorId}`).html(`
				<div class="m-5 p-5 text-center">
					No Coins have been selected.<br/>
					<button type="button" class="btn btn-link" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight">
						Enable Coins Now!
					</button>
				</div>`);
		}
	}

	/**
	 * Loads the API query mode used for api requests
	 */
	loadAPIQueryMode()
	{
		let type = this.APP.CONFIG.apiType;
		switch (type) {
			case 'Public':	this.apiTypeQuery = ''; 					break;
			case 'Demo':	this.apiTypeQuery = 'x_cg_demo_api_key'; 	break;
			case 'Pro':		this.apiTypeQuery = 'x_cg_pro_api_key'; 	break;
		}
	}

	/**
	 * Initiates the data loading process for the widgets
	 *
	 * @param {Number} days - Number of days for which to fetch price data.
	 */
	async load(days)
	{
        if (this.isLoading) {
            console.log("Load method is already running.");
			this.setStatus("Loading Please Wait...");
            return;
        }
        this.isLoading = true;
		this.setStatus("Requesting data from CoinGecko... Please wait!");
		this.loadAPIQueryMode();

        $(`#${this.domAnchorId}`).html(`
        <div class="container-fluid">
            <div class="row" id="${this.htmlID}"></div>
        </div>`);

        try {
			$('#days-group :input').prop('disabled', true);
           await this._loadMarketData();
           await this._loadPriceData(days);
        } catch (error) {
            console.error("An error occurred in the load method:", error);
        } finally {
           	this.isLoading = false;
			this.setStatus("");
			$('#days-group :input').prop('disabled', false);
			this.showEmptyConsole();
        }
    }

	/**
	 * Private method to load main market data for each cryptocurrency.
	 */
	async _loadMarketData()
	{
		if (! this.isIterable(this.APP.CONFIG.coins)) {
			return;
		}

		let coinsFound = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, '_apiCoinsFound') || 0;
		if (coinsFound == 0) {
			await this.apiCacheMarkets();
		}

		var validatedCoins = [];
		for (var coin of this.APP.CONFIG.coins) {
			let cacheKey 	= `${ENV.API_PREFIX_KEY}_${coin.id}`;
			let data 		= this.CACHE.get(cacheKey);
			coin.valid 		= (data) ? true : false;
			if (coin.valid && coin.active){
				CoinWidget.add(this.htmlID, data);
			}
			validatedCoins.push(coin);
		}
		this.CACHE.setProperty(ENV.APP_CONFIG_KEY, 'coins', validatedCoins);
	}

	/**
	 * Private method to load price data for each cryptocurrency.
	 *
	 * @param {Number} days - Number of days for which to fetch price data.
	 */
	async _loadPriceData(days)
	{
		if (! this.isIterable(this.APP.CONFIG.coins)) {
			return;
		}

		const maxAttempts = 5;  // Number tries
		const maxTimeout  = 61; // Initial timeout in seconds

		// Nested function for handling the countdown
		const startCountdown = (coinId, duration) => {
			return new Promise(resolve => {
				let countdown = duration;
				const countdownInterval = setInterval(() => {
					let msg = `Rate limit exceeded. <br/>Retrying in ${countdown--} seconds...<br/>Consider using API Key.`;
					$(`#chart-area-${coinId} .countdown`).html(msg);
				}, 1000);

				setTimeout(() => {
					clearInterval(countdownInterval);
					resolve();
				}, countdown * 1000);
			});
		};

		for (const coin of this.APP.CONFIG.coins) {

			if (! coin.active || ! coin.valid) {
				continue;
			}

			let cacheKey = `${ENV.API_PREFIX_KEY}_${coin.id}`;
			let attempts = 0;

			while (attempts < maxAttempts) {
				let coinData = this.CACHE.get(cacheKey);

				if (coinData && !coinData._history) {
					await this.apiCacheCoinPrices(coin.id);
					coinData =  this.CACHE.get(cacheKey);
					if (coinData && !coinData._history) {
						await startCountdown(coin.id, maxTimeout);
					}
				}

				if (coinData && coinData._history) {
					CoinWidget.addChart(days, coinData);
					break;
				} else {
					attempts++;
					console.warn(`Attempt ${attempts} failed to load price data for ${coin.id}`);
				}

				if (attempts === maxAttempts) {
					$(`#chart-area-${coin.id} .loading`).html(`Try again in a few minutes...`);
					console.error(`Failed to load price data for ${coin.id} after ${maxAttempts} attempts.`);
				}
			}
		}
	}

}