import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ComboboxControl, Placeholder, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

const STATUS_LABELS = {
	draft:   __( 'Draft', 'cns-story-suite' ),
	private: __( 'Private', 'cns-story-suite' ),
};

function storyLabel( record ) {
	const title  = decodeEntities( record.title?.rendered || '' ) || __( '(no title)', 'cns-story-suite' );
	const status = STATUS_LABELS[ record.status ];
	return status ? `${ title } — ${ status }` : title;
}

export default function Edit( { attributes, setAttributes } ) {
	const { storyId } = attributes;
	const [ search, setSearch ] = useState( '' );

	const { story, searchResults, isSearching } = useSelect(
		( select ) => {
			const { getEntityRecord, getEntityRecords, isResolving } = select( 'core' );
			const query = {
				per_page: 20,
				status:   [ 'publish', 'draft', 'private' ],
				...( search ? { search } : {} ),
			};
			return {
				story:         storyId ? getEntityRecord( 'postType', 'cns_story', storyId ) : null,
				searchResults: getEntityRecords( 'postType', 'cns_story', query ),
				isSearching:   isResolving( 'getEntityRecords', [ 'postType', 'cns_story', query ] ),
			};
		},
		[ storyId, search ]
	);

	const isLoading = storyId && story === undefined;

	const options = [
		// Keep the current selection visible even when it doesn't match the search.
		...( storyId && story ? [ { value: String( storyId ), label: storyLabel( story ) } ] : [] ),
		...( searchResults ?? [] )
			.filter( ( r ) => r.id !== storyId )
			.map( ( r ) => ( { value: String( r.id ), label: storyLabel( r ) } ) ),
	];

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Story Settings', 'cns-story-suite' ) }>
					<ComboboxControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Story', 'cns-story-suite' ) }
						placeholder={ __( 'Search stories…', 'cns-story-suite' ) }
						value={ storyId ? String( storyId ) : null }
						options={ options }
						onFilterValueChange={ setSearch }
						onChange={ ( value ) =>
							setAttributes( { storyId: parseInt( value ?? '', 10 ) || 0 } )
						}
						allowReset
						help={
							isSearching
								? __( 'Searching…', 'cns-story-suite' )
								: __( 'Type to search stories by title.', 'cns-story-suite' )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...useBlockProps() }>
				{ isLoading && <Spinner /> }

				{ ! storyId && (
					<Placeholder
						icon="book"
						label={ __( 'CNS Story', 'cns-story-suite' ) }
						instructions={ __( 'Pick a story in the block settings panel to embed it.', 'cns-story-suite' ) }
					/>
				) }

				{ storyId > 0 && ! isLoading && story && (
					<div className="cns-story-block-preview">
						<div className="cns-story-block-preview__label">
							{ __( 'Story:', 'cns-story-suite' ) }
						</div>
						<div className="cns-story-block-preview__title">
							{ decodeEntities( story.title?.rendered || '' ) || __( '(no title)', 'cns-story-suite' ) }
						</div>
						<p className="cns-story-block-preview__note">
							{ __( 'The interactive canvas renders on the frontend.', 'cns-story-suite' ) }
						</p>
					</div>
				) }

				{ storyId > 0 && ! isLoading && ! story && (
					<Placeholder
						icon="warning"
						label={ __( 'Story not found', 'cns-story-suite' ) }
						instructions={ __( 'No story found with the given ID.', 'cns-story-suite' ) }
					/>
				) }
			</div>
		</>
	);
}
