import { createRoot, useState, useEffect } from '@wordpress/element';

interface StoryRef {
	id:        number;
	title:     string;
	status:    string;
	nodeCount: number;
	editUrl:   string;
}

function StoriesPanel( { mapId, overviewUrl }: { mapId: number; overviewUrl: string } ) {
	const [ stories, setStories ] = useState< StoryRef[] >( [] );
	const [ loading, setLoading ] = useState( true );

	const g = ( window as unknown as {
		cnsStorySuite: { restUrl: string; nonce: string; editorUrl: string }
	} ).cnsStorySuite;

	useEffect( () => {
		( async () => {
			const res = await fetch( `${ g.restUrl }/maps/${ mapId }/stories`, {
				headers: { 'X-WP-Nonce': g.nonce },
			} );
			if ( res.ok ) setStories( await res.json() );
			setLoading( false );
		} )();
	}, [ mapId ] );

	const newStoryUrl = g.editorUrl + ( g.editorUrl.includes( '?' ) ? '&' : '?' ) + 'preset_map=' + mapId;

	return (
		<div className="cns-panel" style={ { padding: '16px' } }>
			<div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } }>
				<h2 style={ { margin: 0 } }>Stories on this map</h2>
				<div>
					<a href={ newStoryUrl } className="button button-primary">+ New Story</a>
					{ ' ' }
					<a href={ overviewUrl } className="button">All Stories ↗</a>
				</div>
			</div>

			{ loading && <p>Loading…</p> }

			{ ! loading && stories.length === 0 && (
				<p className="description">No stories overlay this map yet.</p>
			) }

			{ ! loading && stories.length > 0 && (
				<table className="wp-list-table widefat fixed striped">
					<thead>
						<tr>
							<th>Title</th>
							<th>Status</th>
							<th>Nodes</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{ stories.map( ( s ) => (
							<tr key={ s.id }>
								<td><strong>{ s.title || '(no title)' }</strong></td>
								<td>{ s.status }</td>
								<td>{ s.nodeCount }</td>
								<td>
									<a href={ s.editUrl } className="button button-small">Edit Story</a>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) }
		</div>
	);
}

// Mount into the placeholder rendered by map-suite's MapEditorApp.
function init() {
	const container = document.getElementById( 'cns-map-stories-panel' );
	if ( ! container ) return;

	const mapId      = parseInt( container.dataset.mapId      || '0', 10 );
	const overviewUrl = container.dataset.overviewUrl || '#';

	if ( ! mapId ) {
		container.innerHTML = '<div class="cns-panel" style="padding:16px"><p class="description">Save the map first to manage stories.</p></div>';
		return;
	}

	createRoot( container ).render(
		<StoriesPanel mapId={ mapId } overviewUrl={ overviewUrl } />
	);
}

// The container is rendered by React (MapEditorApp) so it may not exist yet at script load.
// Use MutationObserver to detect when the tab becomes active.
const observer = new MutationObserver( () => {
	if ( document.getElementById( 'cns-map-stories-panel' ) ) {
		observer.disconnect();
		init();
	}
} );

observer.observe( document.body, { childList: true, subtree: true } );

// Also try immediately in case the tab is already active.
init();
