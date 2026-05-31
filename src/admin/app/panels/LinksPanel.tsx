import { useState } from '@wordpress/element';
import { mapApiFetch } from '../../utils';
import type { StoryLink, LinkType } from '../../../types';

interface LinkableItem {
	id:    number;
	title: string;
	type:  LinkType;
}

interface Props {
	storyId:      number;
	links:        StoryLink[];
	onLinkAdd:    ( linkType: string, linkId: number ) => void;
	onLinkDelete: ( linkId: number ) => void;
}

const LINK_TYPE_LABELS: Record< LinkType, string > = {
	map_object: 'Map Object',
	map_area:   'Map Area',
	hierarchy:  'Hierarchy Region',
};

export default function LinksPanel( { storyId: _storyId, links, onLinkAdd, onLinkDelete }: Props ) {
	const [ search,   setSearch   ] = useState( '' );
	const [ results,  setResults  ] = useState< LinkableItem[] >( [] );
	const [ loading,  setLoading  ] = useState( false );
	const [ linkType, setLinkType ] = useState< LinkType >( 'map_object' );

	async function handleSearch() {
		setLoading( true );
		try {
			// Query map-suite's REST API for linkable entities.
			let path = '';
			if ( linkType === 'map_object' ) {
				path = '/objects?per_page=50&search=' + encodeURIComponent( search );
			} else if ( linkType === 'map_area' ) {
				path = '/areas?per_page=50&search=' + encodeURIComponent( search );
			} else {
				path = '/hierarchy?per_page=50&search=' + encodeURIComponent( search );
			}
			const res  = await mapApiFetch( 'GET', path );
			const data = await res.json() as Array< { id: number; title: string } >;
			if ( res.ok ) {
				setResults( data.map( ( item ) => ( { id: item.id, title: item.title, type: linkType } ) ) );
			}
		} finally {
			setLoading( false );
		}
	}

	const linkedIds = new Set( links.filter( ( l ) => l.linkType === linkType ).map( ( l ) => l.linkId ) );

	return (
		<div className="cns-panel cns-links-panel">
			<h2>Map Suite Links</h2>
			<p className="description">
				Link this story to specific map objects, areas, or hierarchy regions.
				These relationships are used for cross-referencing in the map editor.
			</p>

			{ links.length > 0 && (
				<>
					<h3>Linked Entities</h3>
					<table className="wp-list-table widefat fixed striped">
						<thead>
							<tr>
								<th>Type</th>
								<th>Entity</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ links.map( ( link ) => (
								<tr key={ link.id }>
									<td><span className="cns-badge">{ LINK_TYPE_LABELS[ link.linkType ] }</span></td>
									<td>{ link.linkTitle || `#${ link.linkId }` }</td>
									<td>
										<button
											className="button button-small cns-delete-link"
											onClick={ () => onLinkDelete( link.id ) }
										>
											Unlink
										</button>
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</>
			) }

			<h3 style={ { marginTop: 24 } }>Add Link</h3>
			<div className="cns-row-group">
				<select
					value={ linkType }
					onChange={ ( e ) => { setLinkType( e.target.value as LinkType ); setResults( [] ); } }
				>
					<option value="map_object">Map Object</option>
					<option value="map_area">Map Area</option>
					<option value="hierarchy">Hierarchy Region</option>
				</select>
				<input
					type="search"
					placeholder="Search…"
					value={ search }
					onChange={ ( e ) => setSearch( e.target.value ) }
					onKeyDown={ ( e ) => { if ( e.key === 'Enter' ) handleSearch(); } }
					className="regular-text"
				/>
				<button className="button" onClick={ handleSearch } disabled={ loading }>
					{ loading ? 'Searching…' : 'Search' }
				</button>
			</div>

			{ results.length > 0 && (
				<ul className="cns-link-results">
					{ results.map( ( item ) => (
						<li key={ item.id } className="cns-link-result">
							<span>{ item.title || `#${ item.id }` }</span>
							{ linkedIds.has( item.id ) ? (
								<span className="cns-badge">Linked</span>
							) : (
								<button
									className="button button-small button-primary"
									onClick={ () => onLinkAdd( linkType, item.id ) }
								>
									+ Link
								</button>
							) }
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
