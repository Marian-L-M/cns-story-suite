import { useState } from '@wordpress/element';
import { Button, SearchControl, SelectControl } from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
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
			const data = await mapApiFetch< Array< { id: number; title: string } > >( 'GET', path );
			setResults( data.map( ( item ) => ( { id: item.id, title: item.title, type: linkType } ) ) );
		} catch {
			/* search failures leave the results empty, as before */
		} finally {
			setLoading( false );
		}
	}

	const linkedIds = new Set( links.filter( ( l ) => l.linkType === linkType ).map( ( l ) => l.linkId ) );

	return (
		<div className="cns-panel cns-links-panel">
			<h2>{ __( 'Map Suite Links', 'cns-story-suite' ) }</h2>
			<p className="description">
				{ __(
					'Link this story to specific map objects, areas, or hierarchy regions. These relationships are used for cross-referencing in the map editor.',
					'cns-story-suite'
				) }
			</p>

			{ links.length > 0 && (
				<>
					<h3>{ __( 'Linked Entities', 'cns-story-suite' ) }</h3>
					<table className="wp-list-table widefat fixed striped">
						<thead>
							<tr>
								<th>{ __( 'Type', 'cns-story-suite' ) }</th>
								<th>{ __( 'Entity', 'cns-story-suite' ) }</th>
								<th>{ __( 'Actions', 'cns-story-suite' ) }</th>
							</tr>
						</thead>
						<tbody>
							{ links.map( ( storyLink ) => (
								<tr key={ storyLink.id }>
									<td><span className="cns-badge">{ LINK_TYPE_LABELS[ storyLink.linkType ] }</span></td>
									<td>{ storyLink.linkTitle || `#${ storyLink.linkId }` }</td>
									<td>
										<Button
											size="small"
											icon={ linkOff }
											isDestructive
											onClick={ () => onLinkDelete( storyLink.id ) }
										>
											{ __( 'Unlink', 'cns-story-suite' ) }
										</Button>
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</>
			) }

			<h3 style={ { marginTop: 24 } }>{ __( 'Add Link', 'cns-story-suite' ) }</h3>
			<div className="cns-row-group">
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Entity type', 'cns-story-suite' ) }
					hideLabelFromVision
					value={ linkType }
					options={ [
						{ value: 'map_object', label: __( 'Map Object', 'cns-story-suite' ) },
						{ value: 'map_area',   label: __( 'Map Area', 'cns-story-suite' ) },
						{ value: 'hierarchy',  label: __( 'Hierarchy Region', 'cns-story-suite' ) },
					] }
					onChange={ ( v ) => { setLinkType( v as LinkType ); setResults( [] ); } }
				/>
				<SearchControl
					__nextHasNoMarginBottom
					label={ __( 'Search entities', 'cns-story-suite' ) }
					hideLabelFromVision
					placeholder={ __( 'Search…', 'cns-story-suite' ) }
					value={ search }
					onChange={ setSearch }
					onKeyDown={ ( e: React.KeyboardEvent ) => {
						if ( e.key === 'Enter' ) handleSearch();
					} }
				/>
				<Button
					variant="secondary"
					isBusy={ loading }
					disabled={ loading }
					onClick={ handleSearch }
				>
					{ loading
						? __( 'Searching…', 'cns-story-suite' )
						: __( 'Search', 'cns-story-suite' ) }
				</Button>
			</div>

			{ results.length > 0 && (
				<ul className="cns-link-results">
					{ results.map( ( item ) => (
						<li key={ item.id } className="cns-link-result">
							<span>{ item.title || `#${ item.id }` }</span>
							{ linkedIds.has( item.id ) ? (
								<span className="cns-badge">{ __( 'Linked', 'cns-story-suite' ) }</span>
							) : (
								<Button
									size="small"
									variant="primary"
									icon={ link }
									onClick={ () => onLinkAdd( linkType, item.id ) }
								>
									{ __( 'Link', 'cns-story-suite' ) }
								</Button>
							) }
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
