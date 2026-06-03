import { useState, useEffect } from '@wordpress/element';
import MarkerControls from '../shared/MarkerControls';
import type { StoryPath, PathFormData, MarkerType } from '../../../types';

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

	useEffect( () => {
		document.body.classList.add( 'cns-modal-open' );
		function onKey( e: KeyboardEvent ) { if ( e.key === 'Escape' ) onClose(); }
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.body.classList.remove( 'cns-modal-open' );
			document.removeEventListener( 'keydown', onKey );
		};
	}, [] );

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
		<div className="cns-modal" role="dialog" aria-modal="true" aria-label={ isNew ? 'Add Path' : 'Edit Path' }>
			<div className="cns-modal__backdrop" onClick={ onClose } />
			<div className="cns-modal__dialog">

				<div className="cns-modal__header">
					<h2 className="cns-modal__title">{ isNew ? 'Add Path' : 'Edit Path' }</h2>
					<button className="cns-modal__close" onClick={ onClose } aria-label="Close">&times;</button>
				</div>

				<div className="cns-modal__body">

					<div className="cns-modal-section">
						<h3>Path Label</h3>
						<input
							type="text"
							className="regular-text"
							placeholder="e.g. Main storyline"
							value={ form.label }
							onChange={ ( e ) => set( 'label', e.target.value ) }
						/>
					</div>

					<div className="cns-modal-section">
						<h3>Marker Settings</h3>
						<p className="description" style={ { marginBottom: 10 } }>
							These override the global marker for all nodes in this path (unless overridden per-node).
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

				</div>

				<div className="cns-modal__footer">
					<button className="button" onClick={ onClose }>Cancel</button>
					<button className="button button-primary" onClick={ handleSave } disabled={ saving || ! form.label.trim() }>
						{ saving ? 'Saving…' : isNew ? 'Add Path' : 'Save Path' }
					</button>
				</div>

			</div>
		</div>
	);
}
