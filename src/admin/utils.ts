import wpApiFetch from '@wordpress/api-fetch';

/**
 * Thin wrappers over @wordpress/api-fetch pinned to the plugin namespaces.
 * Nonce and REST root come from core's api-fetch middleware. They resolve
 * with the parsed JSON body and reject with the REST error object
 * ({ code, message, data }) on any non-2xx response — callers read
 * `.message` off the rejection.
 */
export function apiFetch< T = unknown >(
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	path: string,
	data?: Record< string, unknown >
): Promise< T > {
	return wpApiFetch< T >( {
		path: '/cns-story-suite/v1' + path,
		method,
		data,
	} );
}

export function mapApiFetch< T = unknown >(
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	path: string,
	data?: Record< string, unknown >
): Promise< T > {
	return wpApiFetch< T >( {
		path: '/cns-map-suite/v1' + path,
		method,
		data,
	} );
}
