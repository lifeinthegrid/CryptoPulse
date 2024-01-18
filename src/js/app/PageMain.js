import { ENV }			from '../Environment.js';
import { CoinConsole }	from './CoinConsole.js';
import { PageBase }		from './PageBase.js';

/**
 * The page for the main screen
 *
 * @class PageMain
 */
export class PageMain extends PageBase
{
	/**
	 * Constructor
	 */
	constructor(app)
	{
		super();
		this.APP	= app;
		this.CACHE	= app.CACHE;
	}

	/**
	 * Start the page application
	 */
	start()
	{
		this.offCanvas = null;
		this.loadCoinCheckboxes();
		this.registerEvents();
		this.CONSOLE	= new CoinConsole(this.APP);

		//INIT ELEMENTS
		let activeDays 	 = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'days');
		let theme      	 = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'theme') 			|| 'smooth';
		let cacheTimeout = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'cacheTimeout') 	|| 240;
		let apiKey 		 = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'apiKey') 		|| '';
		let apiType		 = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'apiType') 		|| 'Demo';

		$(`#btn-radio${activeDays}`).prop('checked', true);
		$('#input-theme').val(theme);
		$('#input-cache-time').val(cacheTimeout);
		$('#input-api-key').val(apiKey);
		$('#select-api-type').val(apiType).trigger('change');
		$('#version-info').html(`Version: ${ENV.VERSION}`);
		$('#select-api-type').trigger('change');

		this.CONSOLE.load(activeDays);
	}

	/**
	 * Loads the coin checkboxes
	 */
	loadCoinCheckboxes()
	{
		var storedCoins = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'coins') || [];
		var $listGroup = $('#list-group-coins');
		$listGroup.empty();

		$.each(storedCoins, (index, coin) => {
			//var disabled = coin.valid === undefined || coin.valid ? '' : 'disabled';
			var checked  = coin.active ? 'checked' : '';
			var input	= `<input type="checkbox" id="ui-chk-${coin.id}" value='${coin.ticker}' class='form-check-input' ${checked}>`;
			var label	= `<label for="ui-chk-${coin.id}" class="form-check-label stretched-link">&nbsp;${coin.name} <sup>${coin.ticker}</sup></label>`;
			var $item	= $('<li class="list-group-item">').append(input, label);
			$listGroup.append($item);
		});
	}

	/**
	 * Register events
	 */
	registerEvents()
	{
		//Click Events
		$('#btn-clear-all-cache').on('click', this.onClearAllCache);
		$('#btn-refresh-coin-cache').on('click', this.onRefreshCoinCache);

		//Change Events
		$('#days-group input[type="radio"]').on('change', this.onDaysChange);
		$('#input-theme').on('change', this.onThemeChange);
		$('#select-api-type').on('change', this.onApiTypeChange);
		$('#input-api-key').on('change', this.onApiKeyChange);
		$('#list-group-coins input[type="checkbox"]').on('change', this.onCoinCheckboxChange);
		$("#list-group-coins-toggle").on('change', this.onCoinToggleOnOff);

		//Generic Events
		this.offCanvas = document.querySelector('#offcanvasRight');
		this.offCanvas.addEventListener('hide.bs.offcanvas', () => {
			let activeDays = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'days');
			this.CONSOLE.load(activeDays);
		});
	}

	/**
	 * Click even for removing all cache
	 */
	onClearAllCache = (event) =>
	{
		var confirmClear = confirm(`NOTICE: Are you sure you want to clear the ALL settings?  This will clear ALL preference `
									+ `settings and ALL coin data. To get new coin data use the Refresh Coin Cache button.`);
		if (confirmClear) {
			this.CACHE.clear();
			location.reload();
		}
	}

	/**
	 * Click even for refreshing coin cache
	 */
	onRefreshCoinCache = (event) =>
	{
		var confirmClear = confirm(`Are you sure you want to request new coin data?`);
		if (confirmClear) {
			this.CACHE.clearExcept([ENV.APP_CONFIG_KEY]);
			this.CACHE.setProperty(ENV.APP_CONFIG_KEY, '_apiCoinsFound', 0);
			setTimeout(function() {	location.reload(); }, 250);
		}
	}

	/**
	 * Change event for all coins
	 */
	onCoinToggleOnOff = (event) =>
	{
		const checked = $(event.target).is(":checked");
		$("#list-group-coins input[type='checkbox']").prop("checked", checked);
		this.onCoinCheckboxChange();
	}

	/**
	 * Change event for coin checkbox change
	 */
	onCoinCheckboxChange = (event) =>
	{
		var storedCoins = this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'coins') || [];
		$.each(storedCoins, function(index, coin) {
			if(coin.id === this.id) {
				let checked = $(`#ui-chk-${coin.id}`).prop('checked');
				coin.active = checked;
			}
		});
		this.CACHE.setProperty(ENV.APP_CONFIG_KEY, 'coins', storedCoins);
	}

	/**
	 * Change event for day changes
	 */
	onDaysChange = (event) =>
	{
		const days = $(event.target).val();
		this.CONSOLE.load(days);
		this.CACHE.setProperty(ENV.APP_CONFIG_KEY, 'days', days);
	}

	/**
	 * Change event for theme
	 */
	onThemeChange = (event) =>
	{
		let themeName 	= $(event.target).val();
		let storedName 	= this.CACHE.getProperty(ENV.APP_CONFIG_KEY, 'theme');
		if (themeName == storedName) {
			return;
		}
		this.APP.loadTheme(themeName);
	}

	/**
	 * Change event for api type
	 */
	onApiTypeChange = (event) =>
	{
	 	const requiredTypes = ['Demo', 'Pro'];
		let apiType = $(event.target).val();
		$('#input-api-key').prop('required', requiredTypes.includes(apiType));
		this.CACHE.setProperty(ENV.APP_CONFIG_KEY, 'apiType', apiType);
		if (apiType == 'Public') {
			$('#input-api-key').val('');
			$('#input-api-key').attr('disabled', true);
		} else {
			$('#input-api-key').removeAttr('disabled');
		}
	}

	/**
	 * Change event for api key
	 */
	onApiKeyChange = (event) =>
	{
		let value = $(event.target).val();
		console.log(value);
		this.CACHE.setProperty(ENV.APP_CONFIG_KEY, 'apiKey', value);
	}
}