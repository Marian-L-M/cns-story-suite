import { useState, useRef, useEffect } from '@wordpress/element';
import { ComboboxControl } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

interface MapRecord {
	id:    number;
	title: { rendered: string };
}

interface Props {
	mapId:    number | null;
	mapTitle: string;
	onChange: ( id: number | null, title: string ) => void;
}

/**
 * Async map picker: ComboboxControl over core-data's useEntityRecords for
 * the `maps` post type — resolution state, caching, and request plumbing
 * all come from the wp/core-data store.
 */
export default function MapPicker( { mapId, mapTitle, onChange }: Props ) {
	const [ search, setSearch ] = useState( '' );
	const timer = useRef< number | null >( null );

	useEffect(
		() => () => {
			if ( timer.current ) window.clearTimeout( timer.current );
		},
		[]
	);

	const { records } = useEntityRecords< MapRecord >(
		'postType',
		'maps',
		{
			search,
			per_page: 20,
			status: 'publish,private,draft',
		},
		{ enabled: search.length >= 2 }
	);

	const options = [
		...( mapId
			? [ { value: String( mapId ), label: mapTitle || `Map #${ mapId }` } ]
			: [] ),
		...( records ?? [] )
			.filter( ( r ) => r.id !== mapId )
			.map( ( r ) => ( { value: String( r.id ), label: r.title.rendered } ) ),
	];

	// Debounce the store query so we don't resolve every keystroke.
	function handleFilterValueChange( input: string ) {
		if ( timer.current ) window.clearTimeout( timer.current );
		timer.current = window.setTimeout( () => setSearch( input ), 300 );
	}

	return (
		<ComboboxControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Map', 'cns-story-suite' ) }
			hideLabelFromVision
			placeholder={ __( 'Search maps…', 'cns-story-suite' ) }
			value={ mapId ? String( mapId ) : null }
			options={ options }
			onFilterValueChange={ handleFilterValueChange }
			onChange={ ( value ) => {
				if ( ! value ) {
					onChange( null, '' );
					return;
				}
				const opt = options.find( ( o ) => o.value === value );
				onChange( parseInt( value, 10 ), opt?.label || '' );
			} }
			allowReset
		/>
	);
}
