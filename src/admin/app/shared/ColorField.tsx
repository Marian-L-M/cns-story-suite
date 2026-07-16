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
	value: string;
	onChange: ( color: string ) => void;
}

/**
 * Compact color control: a swatch button that opens the wp ColorPicker in a
 * popover — the same pattern the block editor uses for inline color fields.
 */
export default function ColorField( { label, value, onChange }: Props ) {
	const id = useRef(
		`cns-color-${ Math.random().toString( 36 ).slice( 2 ) }`
	);

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
						<ColorIndicator colorValue={ value } />
						<span className="cns-color-field__value">
							{ value }
						</span>
					</Button>
				) }
				renderContent={ () => (
					<ColorPicker
						color={ value }
						onChange={ onChange }
						enableAlpha={ false }
					/>
				) }
			/>
		</BaseControl>
	);
}
