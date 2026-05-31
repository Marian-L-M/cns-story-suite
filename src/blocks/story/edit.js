import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, Placeholder, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes } ) {
	const { storyId } = attributes;

	const story = useSelect(
		( select ) => {
			if ( ! storyId ) return null;
			return select( 'core' ).getEntityRecord( 'postType', 'cns_story', storyId );
		},
		[ storyId ]
	);

	const isLoading = storyId && story === undefined;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Story Settings', 'cns-story-suite' ) }>
					<TextControl
						label={ __( 'Story ID', 'cns-story-suite' ) }
						type="number"
						value={ storyId || '' }
						onChange={ ( v ) => setAttributes( { storyId: parseInt( v ) || 0 } ) }
						help={ __( 'Enter the ID of the story to embed.', 'cns-story-suite' ) }
					/>
					{ storyId > 0 && story && (
						<p>
							<strong>{ story.title?.rendered || __( '(no title)', 'cns-story-suite' ) }</strong>
						</p>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...useBlockProps() }>
				{ isLoading && <Spinner /> }

				{ ! storyId && (
					<Placeholder
						icon="book"
						label={ __( 'CNS Story', 'cns-story-suite' ) }
						instructions={ __( 'Enter a Story ID in the block settings panel to embed a story.', 'cns-story-suite' ) }
					/>
				) }

				{ storyId > 0 && ! isLoading && story && (
					<div className="cns-story-block-preview">
						<div className="cns-story-block-preview__label">
							{ __( 'Story:', 'cns-story-suite' ) }
						</div>
						<div className="cns-story-block-preview__title">
							{ story.title?.rendered || __( '(no title)', 'cns-story-suite' ) }
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
