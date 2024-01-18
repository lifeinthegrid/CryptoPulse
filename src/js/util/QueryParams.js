/**
 * Class used to manage query params
 */
class QueryParams
{
	constructor(url = window.location.href)
	{
	  this.params = {};
	  const queryString = url.split('?')[1];
	  if (queryString) {
		for (const pair of queryString.split('&')) {
		  const [key, value] = pair.split('=');
		  this.params[key] = decodeURIComponent(value);
		}
	  }
	}

	get(key) {
	  return this.params[key];
	}

	getAll() {
	  return this.params;
	}

	set(key, value) {
	  this.params[key] = value;
	}

	remove(key) {
	  delete this.params[key];
	}

	toString() {
	  return Object.entries(this.params)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join('&');
	}
  }
