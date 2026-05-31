import { useState, useEffect } from '@wordpress/element';
import { apiFetch } from '../../utils';
import type { SubstorySearchResult } from '../../../types';

interface Props {
	substoryId:    number | null;
	substoryLabel: string;
	onChange:      ( id: number | null, label: string ) => void;
}

export default function SubstoryPicker( { substoryId, substoryLabel, onChange }: Props ) {
	const [ query,   setQuery   ] = useState( '' );
	const [ results, setResults ] = useState< SubstorySearchResult[] >( [] );
	const [ loading, setLoading ] = useState( false );
	const [ open,    setOpen    ] = useState( false );

	useEffect( () => {
		if ( ! open ) return;
		const timeout = setTimeout( search, 300 );
		return () => clearTimeout( timeout );
	}, [ query, open ] );

	async function search() {
		setLoading( true );
		try {
			const res  = await apiFetch( 'GET', `/substories?search=${ encodeURIComponent( query ) }&per_page=20` );
			const data = await res.json() as SubstorySearchResult[];
			if ( res.ok ) setResults( data );
		} finally {
			setLoading( false );
		}
	}

	function handleSelect( item: SubstorySearchResult ) {
		onChange( item.id, item.title );
		setOpen( false );
		setQuery( '' );
	}

	function handleClear() {
		onChange( null, '' );
	}

	return (
		<div className="cns-substory-picker">
			{ substoryId ? (
				<div className="cns-picker-selected">
					<span>{ substoryLabel || `Substory #${ substoryId }` }</span>
					<button type="button" className="button button-small" onClick={ handleClear }>
						Remove
					</button>
				</div>
			) : (
				<>
					<button
						type="button"
						className="button"
						onClick={ () => { setOpen( ( p ) => ! p ); if ( ! open ) setQuery( '' ); } }
					>
						{ open ? 'Close' : '+ Connect Substory Post' }
					</button>

					{ open && (
						<div className="cns-picker-dropdown">
							<input
								type="search"
								placeholder="Search substories…"
								value={ query }
								onChange={ ( e ) => setQuery( e.target.value ) }
								autoFocus
								className="regular-text"
							/>
							{ loading && <div className="cns-picker-loading">Searching…</div> }
							<ul className="cns-picker-results">
								{ results.map( ( item ) => (
									<li key={ item.id }>
										<button type="button" onClick={ () => handleSelect( item ) }>
											{ item.thumbnailUrl && (
												<img src={ item.thumbnailUrl } alt="" width="32" height="32" />
											) }
											<span>{ item.title }</span>
											<small>{ item.status }</small>
										</button>
									</li>
								) ) }
								{ ! loading && results.length === 0 && query && (
									<li className="cns-picker-empty">No substories found.</li>
								) }
							</ul>
						</div>
					) }
				</>
			) }
		</div>
	);
}
