import { ENV }	from '../Environment.js';

/**
 * A base class for all page objects
 *
 * @class Base class for all pages
 */
export class PageBase
{
    constructor()
	{
	}

	/**
	 * Can this object be iterated over
	 */
	isIterable(obj)
	{
		return obj && typeof obj[Symbol.iterator] === 'function';
	}

	/**
	 * Sets the status of a message to the UI status area
	 */
	setStatus(msg)
	{
		$('#status-message').html(msg);
	}

}