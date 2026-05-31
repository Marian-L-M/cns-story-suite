import { useState } from '@wordpress/element';
import { mapApiFetch } from '../../utils';

interface MapSearchResult {
	id:           number;
	title:        string;
	thumbnailUrl: string;
}

interface Props {
	mapId:    number | null;
	mapTitle: string;
	onChange: ( id: number | null, title: string ) => void;
}

export default function MapPicker( { mapId, mapTitle, onChange }: Props ) {
	const [ query,   setQuery   ] = useState( '' );
	const [ results, setResults ] = useState< MapSearchResult[] >( [] );
	const [ loading, setLoading ] = useState( false );
	const [ open,    setOpen    ] = useState( false );

	async function search() {
		if ( ! query.trim() ) return;
		setLoading( true );
		try {
			// Use WP REST API to search the maps CPT.
			const g   = window.cnsStorySuite;
			const url = g.wpRestUrl + '/maps?search=' + encodeURIComponent( query ) + '&per_page=20&status=publish,private,draft';
			const res = await fetch( url, {
				headers: { 'X-WP-Nonce': g.nonce },
			} );
			const data = await res.json() as Array< { id: number; title: { rendered: string }; meta?: Record< string, unknown > } >;
			if ( res.ok ) {
				setResults( data.map( ( m ) => ( {
					id:           m.id,
					title:        m.title.rendered,
					thumbnailUrl: '',
				} ) ) );
			}
		} finally {
			setLoading( false );
		}
	}

	function handleSelect( item: MapSearchResult ) {
		onChange( item.id, item.title );
		setOpen( false );
		setQuery( '' );
		setResults( [] );
	}

	function handleClear() {
		onChange( null, '' );
	}

	return (
		<div className="cns-map-picker">
			{ mapId ? (
				<div className="cns-picker-selected">
					<span>{ mapTitle || `Map #${ mapId }` }</span>
					<button type="button" className="button button-small" onClick={ handleClear }>
						Change
					</button>
				</div>
			) : (
				<>
					<div className="cns-row-group">
						<input
							type="search"
							placeholder="Search maps…"
							value={ query }
							onChange={ ( e ) => setQuery( e.target.value ) }
							onKeyDown={ ( e ) => { if ( e.key === 'Enter' ) { setOpen( true ); search(); } } }
							className="regular-text"
						/>
						<button
							type="button"
							className="button"
							onClick={ () => { setOpen( true ); search(); } }
							disabled={ loading }
						>
							{ loading ? 'Searching…' : 'Search' }
						</button>
					</div>

					{ open && results.length > 0 && (
						<ul className="cns-picker-results">
							{ results.map( ( item ) => (
								<li key={ item.id }>
									<button type="button" onClick={ () => handleSelect( item ) }>
										<span>{ item.title }</span>
									</button>
								</li>
							) ) }
						</ul>
					) }
					{ open && ! loading && results.length === 0 && query && (
						<p className="description">No maps found.</p>
					) }
				</>
			) }
		</div>
	);
}
