import {
	BaseControl,
	Button,
	ColorIndicator,
	ColorPicker,
	Dropdown,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';

interface Props {
	label: string;
	/**
	 * A `#rrggbb` or `#rrggbbaa` color. Alpha rides along in the value rather
	 * than living in a sibling opacity field, so a color is a single thing
	 * everywhere: one form field, one stored column, one canvas fill style.
	 */
	value: string;
	onChange: ( color: string ) => void;
	/** Set false for a color that must stay opaque. */
	enableAlpha?: boolean;
}

/**
 * Compact color control: a swatch button that opens the wp ColorPicker in a
 * popover — the same pattern the block editor uses for inline color fields.
 *
 * `ColorPicker` emits exactly the `#rrggbb`/`#rrggbbaa` this stores, and
 * canvas accepts it verbatim as a fill or stroke style, so no conversion
 * happens anywhere between the picker and the pixels.
 */
export default function ColorField( {
	label,
	value,
	onChange,
	enableAlpha = true,
}: Props ) {
	const id = useRef(
		`cns-color-${ Math.random().toString( 36 ).slice( 2 ) }`
	);

	// Show `#2271b1 · 30%` rather than the raw `#2271b14d` — the alpha byte is
	// unreadable, and the percentage is the part worth showing.
	const isHex8 = /^#[0-9a-f]{8}$/i.test( value );
	const alphaByte = isHex8 ? parseInt( value.slice( 7 ), 16 ) : 255;
	const alphaPct =
		alphaByte < 255 ? Math.round( ( alphaByte / 255 ) * 100 ) : null;
	const rgbText = isHex8 ? value.slice( 0, 7 ) : value;

	return (
		<BaseControl
			__nextHasNoMarginBottom
			id={ id.current }
			label={ label }
			className="cns-color-field"
		>
			<Dropdown
				popoverProps={ { placement: 'bottom-start' } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						id={ id.current }
						className="cns-color-field__toggle"
						onClick={ onToggle }
						aria-expanded={ isOpen }
					>
						<span className="cns-color-field__swatch">
							<ColorIndicator colorValue={ value } />
						</span>
						<span className="cns-color-field__value">
							{ rgbText }
							{ alphaPct !== null && (
								<span className="cns-color-field__alpha">
									{ ` · ${ alphaPct }%` }
								</span>
							) }
						</span>
					</Button>
				) }
				renderContent={ () => (
					<ColorPicker
						color={ value }
						onChange={ onChange }
						enableAlpha={ enableAlpha }
					/>
				) }
			/>
		</BaseControl>
	);
}
