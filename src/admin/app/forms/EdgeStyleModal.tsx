import { useState, useEffect } from '@wordpress/element';
import type { StoryEdge, EdgeFormData, LineStyle } from '../../../types';

interface Props {
	edge:         StoryEdge;
	storyColor:   string;
	storyWidth:   number;
	storyStyle:   LineStyle;
	storyOpacity: number;
	onSave:       ( edgeId: number, data: EdgeFormData ) => void;
	onDelete:     ( edgeId: number ) => void;
	onClose:      () => void;
}

export default function EdgeStyleModal( { edge, storyColor, storyWidth, storyStyle, storyOpacity, onSave, onDelete, onClose }: Props ) {
	const [ form, setForm ] = useState< EdgeFormData >( {
		lineColor:   edge.lineColor,
		lineWidth:   edge.lineWidth,
		lineStyle:   edge.lineStyle,
		lineOpacity: edge.lineOpacity,
	} );

	useEffect( () => {
		document.body.classList.add( 'cns-modal-open' );
		const onKey = ( e: KeyboardEvent ) => { if ( e.key === 'Escape' ) onClose(); };
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.body.classList.remove( 'cns-modal-open' );
			document.removeEventListener( 'keydown', onKey );
		};
	}, [] );

	const effectiveColor   = form.lineColor   ?? storyColor;
	const effectiveWidth   = form.lineWidth   ?? storyWidth;
	const effectiveStyle   = form.lineStyle   ?? storyStyle;
	const effectiveOpacity = form.lineOpacity ?? storyOpacity;
	const hasOverride = form.lineColor !== null || form.lineWidth !== null || form.lineStyle !== null || form.lineOpacity !== null;

	return (
		<div className="cns-modal" role="dialog" aria-modal="true" aria-label="Path Style">
			<div className="cns-modal__backdrop" onClick={ onClose } />
			<div className="cns-modal__dialog">
				<div className="cns-modal__header">
					<h2 className="cns-modal__title">Path Style</h2>
					<button className="cns-modal__close" onClick={ onClose } aria-label="Close">&times;</button>
				</div>
				<div className="cns-modal__body">
					<div className="cns-modal-section">
						<p className="description">
							Override this connection&rsquo;s line style, or use the story&rsquo;s global settings.
						</p>
						<div className="cns-form-grid">
							<div className="cns-form-row">
								<label>Color{ form.lineColor === null && <em style={ { fontWeight: 'normal', marginLeft: 4 } }>(story default)</em> }</label>
								<div style={ { display: 'flex', gap: 6, alignItems: 'center' } }>
									<input type="color" value={ effectiveColor }
										onChange={ e => setForm( p => ( { ...p, lineColor: e.target.value } ) ) } />
									{ form.lineColor !== null && (
										<button type="button" className="button button-small"
											onClick={ () => setForm( p => ( { ...p, lineColor: null } ) ) }>&#x21BA;</button>
									) }
								</div>
							</div>
							<div className="cns-form-row">
								<label>Width{ form.lineWidth === null && <em style={ { fontWeight: 'normal', marginLeft: 4 } }>(story default)</em> }</label>
								<div style={ { display: 'flex', gap: 6, alignItems: 'center' } }>
									<input type="number" className="small-text" min="0.5" max="20" step="0.5"
										value={ effectiveWidth }
										onChange={ e => setForm( p => ( { ...p, lineWidth: parseFloat( e.target.value ) } ) ) }
										style={ { width: 56 } } />
									{ form.lineWidth !== null && (
										<button type="button" className="button button-small"
											onClick={ () => setForm( p => ( { ...p, lineWidth: null } ) ) }>&#x21BA;</button>
									) }
								</div>
							</div>
							<div className="cns-form-row">
								<label>Style{ form.lineStyle === null && <em style={ { fontWeight: 'normal', marginLeft: 4 } }>(story default)</em> }</label>
								<div style={ { display: 'flex', gap: 6, alignItems: 'center' } }>
									<select value={ effectiveStyle }
										onChange={ e => setForm( p => ( { ...p, lineStyle: e.target.value as LineStyle } ) ) }>
										<option value="solid">Solid</option>
										<option value="dashed">Dashed</option>
										<option value="dotted">Dotted</option>
									</select>
									{ form.lineStyle !== null && (
										<button type="button" className="button button-small"
											onClick={ () => setForm( p => ( { ...p, lineStyle: null } ) ) }>&#x21BA;</button>
									) }
								</div>
							</div>
							<div className="cns-form-row cns-form-row--full">
								<label>Opacity{ form.lineOpacity === null && <em style={ { fontWeight: 'normal', marginLeft: 4 } }>(story default)</em> }</label>
								<div style={ { display: 'flex', gap: 6, alignItems: 'center' } }>
									<input type="range" min="0" max="1" step="0.05"
										value={ effectiveOpacity }
										onChange={ e => setForm( p => ( { ...p, lineOpacity: parseFloat( e.target.value ) } ) ) }
										style={ { width: 100 } } />
									<span>{ Math.round( effectiveOpacity * 100 ) }%</span>
									{ form.lineOpacity !== null && (
										<button type="button" className="button button-small"
											onClick={ () => setForm( p => ( { ...p, lineOpacity: null } ) ) }>&#x21BA;</button>
									) }
								</div>
							</div>
						</div>
						{ hasOverride && (
							<button type="button" className="button" style={ { marginTop: 12 } }
								onClick={ () => setForm( { lineColor: null, lineWidth: null, lineStyle: null, lineOpacity: null } ) }>
								Reset all to story defaults
							</button>
						) }
					</div>
				</div>
				<div className="cns-modal__footer">
					<button type="button" className="button"
						style={ { color: '#b32d2e', marginRight: 'auto' } }
						onClick={ () => { if ( window.confirm( 'Delete this connection?' ) ) { onDelete( edge.id ); onClose(); } } }>
						Delete connection
					</button>
					<button type="button" className="button" onClick={ onClose }>Cancel</button>
					<button type="button" className="button button-primary"
						onClick={ () => { onSave( edge.id, form ); onClose(); } }>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
