
import { ChartManager }	from '../ui/ChartManager.js';

export class CoinWidget
{
	/**
	 * Adds a cryptocurrency to the widget display.
	 *
	 * @param {string} htmlID - The Dom ID to append to
	 * @param {Object} data - Market data for the cryptocurrency.
	 */
	static add(htmlID, data)
	{
		if (data === undefined || data === null){
			console.error("Unable to load coin data!");
			return;
		}

		const currentPrice        = data.current_price.toFixed(2);
		const dailyHigh           = data.high_24h.toFixed(2);
		const dailyLow            = data.low_24h.toFixed(2);
		const priceChange         = data.price_change_24h.toFixed(2);
		const priceChangeRatio    = data.price_change_percentage_24h.toFixed(2);
		const priceDirection      = priceChangeRatio >= 0 ? '+' : '-';
		const colorClass          = priceDirection === '+' ? 'price-up-bg' : 'price-down-bg';
		const ticker              = data.symbol.toUpperCase();
		const cellID              = `widget-${data.id}-` + Math.random().toString(36).substring(2, 7);

		let HTML = `
			<div class="col-lg-3 col-md-4 p-2" id="${cellID}">
			<div class="widget-container container-fluid ${colorClass} text-white text-nowrap p-4">
				<div class="row">
					<div class="col-lg-6 col-md-12 text-lg-start text-center p-2">
						<p class="ticker">
							<img src="${data.image}" alt="${data.id} logo" style="height: 30px; width: 30px; margin-right: 5px;">
							${ticker}/USD
						</p>
						<p class="price">${currentPrice}</p>
					</div>
					<div class="col-lg-6 col-md-12 p-2 text-lg-end text-center">
						${priceChangeRatio}% • ${priceChange} <br/>
						H ${dailyHigh} <br/>
						L ${dailyLow}
					</div>
				</div>
				<div id="chart-area-${data.id}" class="row p-2 ">
					<div class="chart d-none">
						<canvas id="chart-${data.id}"></canvas>
					</div>
					<div class="loading text-center">
						<i class="fa-solid fa-circle-notch fa-spin"></i> Queueing Price History...
						<div class="countdown"></div>
					</div>
				</div>
			</div>
			</div>`;

		$(`#${htmlID}`).append(HTML);
	}

	/**
	 * Adds a price chart to the cryptocurrency display in the widget.
	 *
	 * @param {Number} days - Number of days for which the chart displays data.
	 * @param {Object} data - Price data for the cryptocurrency.
	 */
	static addChart(days, data)
	{
		let processedData = [];
		let hasPriceData  = data._history != undefined && data._history.prices != undefined;

		if (hasPriceData) {
			// Extract the last `numberOfItems` elements
			processedData = data._history.prices
				.slice(-days)
				.map(priceData => ({
					date: new Date(priceData[0]),
					price: priceData[1]
			}));
        }

		// Instantiate the chart class and render the chart
		if (hasPriceData) {
			$(`#chart-area-${data.id} .loading`).addClass('d-none');
			$(`#chart-area-${data.id} .chart`).removeClass('d-none');
			const chartMgr = new ChartManager(`chart-${data.id}`);
			chartMgr.renderChart(processedData);
		} else {
			//$(`#${cellID} .chart-container`).html('<div class="text-center">Unable to load price data.<br/> Try again in a few minutes</div>');
		}

	}
}