import { useState, useRef, useEffect } from '@wordpress/element';
import { ComboboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../../utils';
import type { SubstorySearchResult } from '../../../types';

interface Props {
	substoryId:    number | null;
	substoryLabel: string;
	onChange:      ( id: number | null, label: string ) => void;
}

/**
 * Async substory picker on top of ComboboxControl: typing queries the
 * plugin's /substories endpoint (debounced); clearing resets the link.
 */
export default function SubstoryPicker( { substoryId, substoryLabel, onChange }: Props ) {
	const [ results, setResults ] = useState< SubstorySearchResult[] >( [] );
	const timer = useRef< number | null >( null );

	useEffect(
		() => () => {
			if ( timer.current ) window.clearTimeout( timer.current );
		},
		[]
	);

	const options = [
		...( substoryId
			? [
					{
						value: String( substoryId ),
						label: substoryLabel || `Substory #${ substoryId }`,
					},
			  ]
			: [] ),
		...results
			.filter( ( r ) => r.id !== substoryId )
			.map( ( r ) => ( {
				value: String( r.id ),
				label:
					r.status && r.status !== 'publish'
						? `${ r.title } (${ r.status })`
						: r.title,
			} ) ),
	];

	function handleFilterValueChange( input: string ) {
		if ( timer.current ) window.clearTimeout( timer.current );
		timer.current = window.setTimeout( async () => {
			try {
				const data = await apiFetch< SubstorySearchResult[] >(
					'GET',
					`/substories?search=${ encodeURIComponent( input ) }&per_page=20`
				);
				if ( Array.isArray( data ) ) setResults( data );
			} catch {
				/* silent */
			}
		}, 300 );
	}

	return (
		<ComboboxControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Substory post', 'cns-story-suite' ) }
			hideLabelFromVision
			placeholder={ __( 'Search substories…', 'cns-story-suite' ) }
			value={ substoryId ? String( substoryId ) : null }
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
