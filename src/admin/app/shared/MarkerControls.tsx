import type { MarkerType } from '../../../types';

interface MarkerValues {
	markerType:        MarkerType;
	markerColor:       string;
	markerSize:        number;
	markerIconId:      number | null;
	markerIconUrl:     string;
	markerIconOffsetX: number;
	markerIconOffsetY: number;
}

interface Props extends MarkerValues {
	onChange: ( updates: Partial< MarkerValues > ) => void;
}

const PRESETS = [
	{ label: 'Top',    x: 0,   y: -30 },
	{ label: 'Bottom', x: 0,   y:  30 },
	{ label: 'Left',   x: -30, y:   0 },
	{ label: 'Right',  x:  30, y:   0 },
	{ label: 'Center', x: 0,   y:   0 },
] as const;

export default function MarkerControls( {
	markerType, markerColor, markerSize,
	markerIconId, markerIconUrl,
	markerIconOffsetX, markerIconOffsetY,
	onChange,
}: Props ) {
	function openIconPicker() {
		const frame = window.wp?.media?.( {
			title:    'Select Marker Icon',
			button:   { text: 'Use as marker' },
			multiple: false,
			library:  { type: 'image' },
		} );
		if ( ! frame ) return;
		frame.on( 'select', () => {
			const att = frame.state().get( 'selection' ).first().toJSON();
			onChange( { markerIconId: att.id, markerIconUrl: att.url } );
		} );
		frame.open();
	}

	return (
		<div className="cns-marker-controls">
			{ /* Type */ }
			<div className="cns-form-row cns-form-row--full">
				<label>Type</label>
				<div className="cns-radio-toggle">
					{ ( [ 'ring', 'icon' ] as MarkerType[] ).map( ( t ) => (
						<label key={ t }>
							<input type="radio" name="mc-type" value={ t }
								checked={ markerType === t }
								onChange={ () => onChange( { markerType: t } ) }
							/>
							{ ' ' }{ t === 'ring' ? 'Ring outline' : 'Icon image' }
						</label>
					) ) }
				</div>
			</div>

			{ /* Color + Size */ }
			<div className="cns-form-row">
				<label>Color</label>
				<input type="color" value={ markerColor }
					onChange={ ( e ) => onChange( { markerColor: e.target.value } ) }
				/>
			</div>
			{ markerType === 'ring' && (
				<div className="cns-form-row">
					<label>Ring size</label>
					<div className="cns-range-wrap">
						<input type="range" min="1" max="30" step="1"
							value={ markerSize }
							onChange={ ( e ) => onChange( { markerSize: parseFloat( e.target.value ) } ) }
						/>
						<span className="cns-range-value">{ markerSize }px</span>
					</div>
				</div>
			) }

			{ /* Icon picker */ }
			{ markerType === 'icon' && (
				<>
					<div className="cns-form-row cns-form-row--full">
						<label>Icon image</label>
						<div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
							{ markerIconUrl && (
								<img src={ markerIconUrl } alt=""
									style={ { width: 32, height: 32, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 } }
								/>
							) }
							<button type="button" className="button" onClick={ openIconPicker }>
								{ markerIconId ? 'Change icon' : 'Select icon' }
							</button>
							{ markerIconId && (
								<button type="button" className="button"
									onClick={ () => onChange( { markerIconId: null, markerIconUrl: '' } ) }
								>Remove</button>
							) }
						</div>
					</div>

					{ /* Icon size */ }
					<div className="cns-form-row">
						<label>Icon size</label>
						<div className="cns-range-wrap">
							<input type="range" min="1" max="30" step="1"
								value={ markerSize }
								onChange={ ( e ) => onChange( { markerSize: parseFloat( e.target.value ) } ) }
							/>
							<span className="cns-range-value">{ markerSize }px</span>
						</div>
					</div>

					{ /* Offset presets */ }
					<div className="cns-form-row cns-form-row--full">
						<label>Position preset</label>
						<div style={ { display: 'flex', gap: 6, flexWrap: 'wrap' } }>
							{ PRESETS.map( ( preset ) => (
								<button key={ preset.label } type="button" className="button button-small"
									style={ {
										fontWeight:
											markerIconOffsetX === preset.x && markerIconOffsetY === preset.y
												? 'bold'
												: undefined,
									} }
									onClick={ () => onChange( { markerIconOffsetX: preset.x, markerIconOffsetY: preset.y } ) }
								>
									{ preset.label }
								</button>
							) ) }
						</div>
					</div>

					{ /* Manual offset */ }
					<div className="cns-form-row">
						<label>Offset X</label>
						<input type="number" min="-100" max="100" step="1" style={ { width: 60 } }
							value={ markerIconOffsetX }
							onChange={ ( e ) => onChange( { markerIconOffsetX: parseFloat( e.target.value ) || 0 } ) }
						/>
						<span style={ { marginLeft: 4 } }>px</span>
					</div>
					<div className="cns-form-row">
						<label>Offset Y</label>
						<input type="number" min="-100" max="100" step="1" style={ { width: 60 } }
							value={ markerIconOffsetY }
							onChange={ ( e ) => onChange( { markerIconOffsetY: parseFloat( e.target.value ) || 0 } ) }
						/>
						<span style={ { marginLeft: 4 } }>px</span>
					</div>
				</>
			) }
		</div>
	);
}
