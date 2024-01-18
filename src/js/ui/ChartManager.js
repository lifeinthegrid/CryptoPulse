/**
 * Used to manage charts
 */
export class ChartManager
{
	constructor(chartId)
	 {
		try {
			this.ctx = document.getElementById(chartId).getContext('2d');
			this.chart = null;
		} catch (error) {
			console.warn(`Error loading ChartID: ${chartId}`);
		}
	}

	renderChart(data)
	{
		let radius = data.length <= 45 ? 3 : 0;
		const chartData = {
			labels: data.map(d => {
				const options = { day: '2-digit', month: 'short'};
				return d.date.toLocaleDateString('en-US', options);
			}),


			datasets: [{
				label: 'Price',
				data: data.map(d => d.price),
				fill: false,
				borderColor: 'white',
				tension: 0.1,
				pointRadius: radius
			}]
	};

	const chartOptions = {
		scales: {
			y: {
				display: true,
				ticks: {color: 'white'}
			},
			x: {
				display: true,
				ticks: {color: 'white'}
			}
		},
		plugins: {
			legend: {
			  display: false,
			},
			tooltip: {
			  enabled: true
			},
			datasets: {
                pointLabels: {
                    display: 'auto'
                }
            }
		},
		responsive: true,
		maintainAspectRatio: false,
	};

	chartOptions.plugins.annotation = {
		annotations: {
		  pointLabels: {
			display: false
		  }
		}
	  };

	this.chart = new Chart(this.ctx,
	{
		type: 'line',
		data: chartData,
		options: chartOptions
	});
	}

	updateChart(newData, priceChange)
	{
		const color = priceChange >= 0 ? 'green' : 'red';
		this.chart.data.labels = newData.map(d => d.date);
		this.chart.data.datasets[0].data = newData.flatMap(d => d.values);
		this.chart.data.datasets[0].borderColor = color;
		this.chart.update();
	}
}
