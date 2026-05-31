import { useState, useEffect } from '@wordpress/element';
import SubstoryPicker from '../shared/SubstoryPicker';
import { apiFetch } from '../../utils';
import type { StoryNode, NodeFormData, IconType } from '../../../types';

interface Props {
	nodeId:       number | null; // null = new node
	existingNode: StoryNode | null;
	initialX:     number; // 0–1 normalised canvas position
	initialY:     number;
	onSave:       ( data: NodeFormData ) => void;
	onClose:      () => void;
}

function buildInitialForm( node: StoryNode | null, initialX: number, initialY: number ): NodeFormData {
	return {
		x:               node?.x              ?? initialX,
		y:               node?.y              ?? initialY,
		substoryId:      node?.substoryId     ?? null,
		substoryLabel:   node?.substoryTitle  ?? '',
		titleOverride:   node?.titleOverride  ?? '',
		excerptOverride: node?.excerptOverride ?? '',
		iconType:        node?.iconType       ?? 'round',
		iconId:          node?.iconId         ?? null,
		iconColor:       node?.iconColor      ?? '#ffffff',
		iconSize:        node?.iconSize       ?? 1.0,
	};
}

export default function NodeModal( { nodeId, existingNode, initialX, initialY, onSave, onClose }: Props ) {
	const [ form,     setForm     ] = useState< NodeFormData >( () => buildInitialForm( existingNode, initialX, initialY ) );
	const [ saving,   setSaving   ] = useState( false );
	const [ newTitle, setNewTitle ] = useState( '' );
	const [ creating, setCreating ] = useState( false );

	const isNew = nodeId === null;

	// Lock body scroll and handle Escape key.
	useEffect( () => {
		document.body.classList.add( 'cns-modal-open' );
		function onKey( e: KeyboardEvent ) {
			if ( e.key === 'Escape' ) onClose();
		}
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.body.classList.remove( 'cns-modal-open' );
			document.removeEventListener( 'keydown', onKey );
		};
	}, [] );

	useEffect( () => {
		setForm( buildInitialForm( existingNode, initialX, initialY ) );
	}, [ existingNode ] );

	function set< K extends keyof NodeFormData >( key: K, value: NodeFormData[ K ] ) {
		setForm( ( p ) => ( { ...p, [ key ]: value } ) );
	}

	async function handleCreateSubstory() {
		if ( ! newTitle.trim() ) return;
		setCreating( true );
		try {
			const res  = await apiFetch( 'POST', '/substories', { title: newTitle } );
			const data = await res.json() as { id: number; title: string; editUrl: string };
			if ( res.ok ) {
				set( 'substoryId', data.id );
				set( 'substoryLabel', data.title );
				setNewTitle( '' );
			}
		} finally {
			setCreating( false );
		}
	}

	async function handleSave() {
		setSaving( true );
		await onSave( form );
		setSaving( false );
	}

	return (
		<div
			className="cns-modal"
			role="dialog"
			aria-modal="true"
			aria-label={ isNew ? 'Add Node' : 'Edit Node' }
		>
			<div className="cns-modal__backdrop" onClick={ onClose } />

			<div className="cns-modal__dialog">

				<div className="cns-modal__header">
					<h2 className="cns-modal__title">{ isNew ? 'Add Node' : 'Edit Node' }</h2>
					<button className="cns-modal__close" onClick={ onClose } aria-label="Close">&times;</button>
				</div>

				<div className="cns-modal__body">

					{ /* Substory connection */ }
					<div className="cns-modal-section">
						<h3>Substory Post</h3>
						<SubstoryPicker
							substoryId={ form.substoryId }
							substoryLabel={ form.substoryLabel }
							onChange={ ( id, label ) => { set( 'substoryId', id ); set( 'substoryLabel', label ); } }
						/>

						{ ! form.substoryId && (
							<div className="cns-modal-section__create" style={ { marginTop: 10 } }>
								<p className="description" style={ { marginBottom: 6 } }>
									Or create a new substory post:
								</p>
								<div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
									<input
										type="text"
										className="regular-text"
										placeholder="New substory title…"
										value={ newTitle }
										onChange={ ( e ) => setNewTitle( e.target.value ) }
										onKeyDown={ ( e ) => { if ( e.key === 'Enter' ) handleCreateSubstory(); } }
										style={ { flex: 1 } }
									/>
									<button
										type="button"
										className="button"
										onClick={ handleCreateSubstory }
										disabled={ creating || ! newTitle.trim() }
									>
										{ creating ? 'Creating…' : 'Create' }
									</button>
								</div>
							</div>
						) }
					</div>

					{ /* Title / excerpt overrides */ }
					<div className="cns-modal-section">
						<h3>Display Overrides</h3>
						<p className="description" style={ { marginBottom: 12 } }>
							Leave blank to use the substory post&rsquo;s title and excerpt.
						</p>
						<div className="cns-form-grid">
							<div className="cns-form-row cns-form-row--full">
								<label htmlFor="node-title-override">Title</label>
								<input
									id="node-title-override"
									type="text"
									className="regular-text"
									value={ form.titleOverride }
									onChange={ ( e ) => set( 'titleOverride', e.target.value ) }
									placeholder={ form.substoryLabel || 'Node title…' }
								/>
							</div>
							<div className="cns-form-row cns-form-row--full">
								<label htmlFor="node-excerpt-override">Excerpt</label>
								<textarea
									id="node-excerpt-override"
									className="large-text"
									rows={ 3 }
									value={ form.excerptOverride }
									onChange={ ( e ) => set( 'excerptOverride', e.target.value ) }
									placeholder="Short description shown in the story window…"
								/>
							</div>
						</div>
					</div>

					{ /* Position */ }
					<div className="cns-modal-section">
						<h3>Position</h3>
						<div className="cns-form-grid">
							<div className="cns-form-row">
								<label htmlFor="node-pos-x">X (%)</label>
								<input
									id="node-pos-x"
									type="number"
									className="small-text"
									min="0"
									max="100"
									step="0.1"
									value={ Math.round( form.x * 1000 ) / 10 }
									onChange={ ( e ) => set( 'x', Math.max( 0, Math.min( 1, parseFloat( e.target.value ) / 100 ) ) ) }
								/>
							</div>
							<div className="cns-form-row">
								<label htmlFor="node-pos-y">Y (%)</label>
								<input
									id="node-pos-y"
									type="number"
									className="small-text"
									min="0"
									max="100"
									step="0.1"
									value={ Math.round( form.y * 1000 ) / 10 }
									onChange={ ( e ) => set( 'y', Math.max( 0, Math.min( 1, parseFloat( e.target.value ) / 100 ) ) ) }
								/>
							</div>
						</div>
						<p className="description" style={ { marginTop: 6 } }>
							Position as a percentage of canvas width/height from the top-left. Also adjustable by clicking or dragging on the canvas.
						</p>
					</div>

					{ /* Icon settings */ }
					<div className="cns-modal-section">
						<h3>Node Appearance</h3>
						<div className="cns-form-grid">

							<div className="cns-form-row cns-form-row--full">
								<label>Shape</label>
								<div className="cns-radio-toggle">
									{ ( [ 'round', 'square', 'icon' ] as IconType[] ).map( ( t ) => (
										<label key={ t }>
											<input
												type="radio"
												name="icon-type"
												value={ t }
												checked={ form.iconType === t }
												onChange={ () => set( 'iconType', t ) }
											/>
											{ ' ' }{ t.charAt( 0 ).toUpperCase() + t.slice( 1 ) }
										</label>
									) ) }
								</div>
							</div>

							{ form.iconType === 'icon' && (
								<div className="cns-form-row cns-form-row--full">
									<label>Icon Image</label>
									<div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
										<button
											type="button"
											className="button"
											onClick={ () => {
												const frame = window.wp?.media( {
													title:    'Select Icon',
													button:   { text: 'Use this icon' },
													multiple: false,
												} );
												frame.on( 'select', () => {
													const attachment = frame.state().get( 'selection' ).first().toJSON();
													set( 'iconId', attachment.id );
												} );
												frame.open();
											} }
										>
											{ form.iconId ? `Icon #${ form.iconId }` : 'Select Icon' }
										</button>
										{ form.iconId && (
											<button
												type="button"
												className="button"
												onClick={ () => set( 'iconId', null ) }
											>
												Remove
											</button>
										) }
									</div>
								</div>
							) }

							<div className="cns-form-row">
								<label>Color</label>
								<div>
									<input
										type="color"
										value={ form.iconColor }
										onChange={ ( e ) => set( 'iconColor', e.target.value ) }
									/>
								</div>
							</div>

							<div className="cns-form-row">
								<label>Size</label>
								<div className="cns-range-wrap">
									<input
										type="range"
										min="0.25"
										max="3"
										step="0.25"
										value={ form.iconSize }
										onChange={ ( e ) => set( 'iconSize', parseFloat( e.target.value ) ) }
									/>
									<span className="cns-range-value">{ form.iconSize }&times;</span>
								</div>
							</div>

						</div>
					</div>

				</div>

				<div className="cns-modal__footer">
					<button className="button" onClick={ onClose }>Cancel</button>
					<button className="button button-primary" onClick={ handleSave } disabled={ saving }>
						{ saving ? 'Saving…' : isNew ? 'Add Node' : 'Save Node' }
					</button>
				</div>

			</div>
		</div>
	);
}
