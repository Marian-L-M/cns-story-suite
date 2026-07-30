import {
	BaseControl,
	Button,
	Flex,
	FlexBlock,
	FlexItem,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { image as imageIcon, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import MapPicker from '../shared/MapPicker';
import MarkerControls from '../shared/MarkerControls';
import MediaSelectButton from '../shared/MediaSelectButton';

import type { StorySettings } from '../../../types';

interface Props {
	settings:     StorySettings;
	onChange:     ( s: StorySettings ) => void;
	onMapChange:  ( mapId: number | null, mapTitle: string ) => void;
}

export default function SettingsPanel( { settings, onChange, onMapChange }: Props ) {
	function set< K extends keyof StorySettings >( key: K, value: StorySettings[ K ] ) {
		onChange( { ...settings, [ key ]: value } );
	}

	return (
		<div className="cns-panel cns-settings-panel">
			<h2>{ __( 'Story Settings', 'cns-story-suite' ) }</h2>

			<div className="cns-grid cns-grid__24">
				<Flex className={"cns-grid__span-2"} direction={"column"} gap={4}>
					<FlexItem>
						<TextControl
							label={ __( 'Title', 'cns-story-suite' ) }
							value={ settings.title }
							onChange={ ( v ) => set( 'title', v ) }
							__next40pxDefaultSize
							/>
					</FlexItem>
					<FlexItem>
						<TextareaControl
							label={ __( 'Description', 'cns-story-suite' ) }
							help={ __( 'Short summary shown in story listings.', 'cns-story-suite' ) }
							rows={ 3 }
							value={ settings.description }
							onChange={ ( v ) => set( 'description', v ) }
							/>
					</FlexItem>
					<FlexItem>
						<BaseControl
							id="cns-story-map"
							label={ __( 'Map', 'cns-story-suite' ) }
							help={ __(
								'The story canvas overlays this map. Objects and areas are shown read-only.',
								'cns-story-suite'
							) }
						>
							<MapPicker
								mapId={ settings.mapId }
								mapTitle={ settings.mapTitle }
								onChange={ onMapChange }
							/>
						</BaseControl>
					</FlexItem>
				</Flex>
		

				<div className="cns-grid__group cns-grid__span-1">
					<BaseControl
						id="cns-story-thumbnail"
						label={ __( 'Thumbnail', 'cns-story-suite' ) }
						help={ __( 'Used as the story’s featured image.', 'cns-story-suite' ) }
					>
						{ settings.thumbnailUrl && (
							<div style={ { marginBottom: 8 } }>
								<img
									src={ settings.thumbnailUrl }
									alt=""
									style={ { maxWidth: 240, maxHeight: 160, display: 'block', borderRadius: 4, border: '1px solid #ddd' } }
								/>
							</div>
						) }
						<div className="cns-actions-row">
							<MediaSelectButton
								title={ __( 'Select Story Thumbnail', 'cns-story-suite' ) }
								value={ settings.thumbnailId }
								allowedTypes={ [ 'image' ] }
								icon={ imageIcon }
								onSelect={ ( att ) =>
									onChange( { ...settings, thumbnailId: att.id, thumbnailUrl: att.url } )
								}
							>
								{ settings.thumbnailId
									? __( 'Change thumbnail', 'cns-story-suite' )
									: __( 'Set thumbnail', 'cns-story-suite' ) }
							</MediaSelectButton>
							{ settings.thumbnailId && (
								<Button
									variant="tertiary"
									isDestructive
									icon={ trash }
									label={ __( 'Remove thumbnail', 'cns-story-suite' ) }
									onClick={ () => onChange( { ...settings, thumbnailId: null, thumbnailUrl: '' } ) }
								/>
							) }
						</div>
					</BaseControl>
				</div>
				<div className="cns-grid__group cns-grid__span-2">
					<BaseControl
						id="cns-story-marker"
						label={ __( 'Active node marker', 'cns-story-suite' ) }
						help={ __( 'Global default. Overridden per-path and per-node.', 'cns-story-suite' ) }
					>
						<MarkerControls
							markerType={ settings.markerType }
							markerColor={ settings.markerColor }
							markerSize={ settings.markerSize }
							markerIconId={ settings.markerIconId }
							markerIconUrl={ settings.markerIconUrl }
							markerIconOffsetX={ settings.markerIconOffsetX }
							markerIconOffsetY={ settings.markerIconOffsetY }
							onChange={ ( updates ) => onChange( { ...settings, ...updates } ) }
						/>
					</BaseControl>
				</div>
			</div>
		</div>
	);
}
