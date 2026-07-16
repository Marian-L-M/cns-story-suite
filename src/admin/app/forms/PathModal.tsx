import { useState } from '@wordpress/element';
import { Button, Flex, Modal, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import MarkerControls from '../shared/MarkerControls';
import type { StoryPath, PathFormData } from '../../../types';

interface Props {
	path:    StoryPath | null; // null = new path
	onSave:  ( data: PathFormData ) => Promise< void >;
	onClose: () => void;
}

function buildInitial( path: StoryPath | null ): PathFormData {
	return {
		label:             path?.label             ?? '',
		markerColor:       path?.markerColor       ?? '#00aaff',
		markerSize:        path?.markerSize        ?? 5,
		markerType:        path?.markerType        ?? 'ring',
		markerIconId:      path?.markerIconId      ?? null,
		markerIconUrl:     path?.markerIconUrl     ?? '',
		markerIconOffsetX: path?.markerIconOffsetX ?? 0,
		markerIconOffsetY: path?.markerIconOffsetY ?? -30,
	};
}

export default function PathModal( { path, onSave, onClose }: Props ) {
	const [ form,   setForm   ] = useState< PathFormData >( () => buildInitial( path ) );
	const [ saving, setSaving ] = useState( false );

	function set< K extends keyof PathFormData >( key: K, value: PathFormData[ K ] ) {
		setForm( ( p ) => ( { ...p, [ key ]: value } ) );
	}

	async function handleSave() {
		setSaving( true );
		await onSave( form );
		setSaving( false );
	}

	const isNew = path === null;

	return (
		<Modal
			title={ isNew ? __( 'Add Path', 'cns-story-suite' ) : __( 'Edit Path', 'cns-story-suite' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<div className="cns-modal-section">
				<h3>{ __( 'Path Label', 'cns-story-suite' ) }</h3>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Label', 'cns-story-suite' ) }
					hideLabelFromVision
					placeholder={ __( 'e.g. Main storyline', 'cns-story-suite' ) }
					value={ form.label }
					onChange={ ( v ) => set( 'label', v ) }
				/>
			</div>

			<div className="cns-modal-section">
				<h3>{ __( 'Marker Settings', 'cns-story-suite' ) }</h3>
				<p className="description" style={ { marginBottom: 10 } }>
					{ __(
						'These override the global marker for all nodes in this path (unless overridden per-node).',
						'cns-story-suite'
					) }
				</p>
				<MarkerControls
					markerType={ form.markerType }
					markerColor={ form.markerColor }
					markerSize={ form.markerSize }
					markerIconId={ form.markerIconId }
					markerIconUrl={ form.markerIconUrl }
					markerIconOffsetX={ form.markerIconOffsetX }
					markerIconOffsetY={ form.markerIconOffsetY }
					onChange={ ( updates ) => setForm( ( p ) => ( { ...p, ...updates } ) ) }
				/>
			</div>

			<Flex justify="flex-end" gap={ 2 } style={ { marginTop: 16 } }>
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'cns-story-suite' ) }
				</Button>
				<Button
					variant="primary"
					isBusy={ saving }
					disabled={ saving || ! form.label.trim() }
					onClick={ handleSave }
				>
					{ saving
						? __( 'Saving…', 'cns-story-suite' )
						: isNew
						? __( 'Add Path', 'cns-story-suite' )
						: __( 'Save Path', 'cns-story-suite' ) }
				</Button>
			</Flex>
		</Modal>
	);
}
