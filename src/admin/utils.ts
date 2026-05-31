export function apiFetch(
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	path: string,
	body?: Record< string, unknown >
): Promise< Response > {
	const g = window.cnsStorySuite;
	const url = g.restUrl + path;
	return fetch( url, {
		method,
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce':   g.nonce,
		},
		body: body ? JSON.stringify( body ) : undefined,
	} );
}

export function mapApiFetch(
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	path: string,
	body?: Record< string, unknown >
): Promise< Response > {
	const g = window.cnsStorySuite;
	const url = g.mapRestUrl + path;
	return fetch( url, {
		method,
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce':   g.nonce,
		},
		body: body ? JSON.stringify( body ) : undefined,
	} );
}
