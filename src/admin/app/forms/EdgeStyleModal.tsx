import { useState } from '@wordpress/element';
import {
	Button,
	Flex,
	Modal,
	RangeControl,
	SelectControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { trash, undo } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import ColorField from '../shared/ColorField';
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

/** Small "back to story default" reset next to an overridden field. */
function ResetOverride( { visible, onReset }: { visible: boolean; onReset: () => void } ) {
	if ( ! visible ) return null;
	return (
		<Button
			size="small"
			icon={ undo }
			label={ __( 'Use story default', 'cns-story-suite' ) }
			onClick={ onReset }
		/>
	);
}

export default function EdgeStyleModal( { edge, storyColor, storyWidth, storyStyle, storyOpacity, onSave, onDelete, onClose }: Props ) {
	const [ form, setForm ] = useState< EdgeFormData >( {
		lineColor:   edge.lineColor,
		lineWidth:   edge.lineWidth,
		lineStyle:   edge.lineStyle,
		lineOpacity: edge.lineOpacity,
	} );

	const effectiveColor   = form.lineColor   ?? storyColor;
	const effectiveWidth   = form.lineWidth   ?? storyWidth;
	const effectiveStyle   = form.lineStyle   ?? storyStyle;
	const effectiveOpacity = form.lineOpacity ?? storyOpacity;
	const hasOverride = form.lineColor !== null || form.lineWidth !== null || form.lineStyle !== null || form.lineOpacity !== null;

	const defaultHint = ( isDefault: boolean ) =>
		isDefault ? __( '(story default)', 'cns-story-suite' ) : undefined;

	return (
		<Modal
			title={ __( 'Path Style', 'cns-story-suite' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<p className="description">
				{ __(
					'Override this connection’s line style, or use the story’s global settings.',
					'cns-story-suite'
				) }
			</p>
			<div className="cns-grid cns-grid__12">
				<div className="cns-grid__group">
					<Flex gap={ 1 } align="flex-end">
						<div style={ { flex: 1 } }>
							<ColorField
								label={ `${ __( 'Color', 'cns-story-suite' ) } ${ defaultHint( form.lineColor === null ) ?? '' }` }
								value={ effectiveColor }
								onChange={ ( v ) => setForm( ( p ) => ( { ...p, lineColor: v } ) ) }
							/>
						</div>
						<ResetOverride
							visible={ form.lineColor !== null }
							onReset={ () => setForm( ( p ) => ( { ...p, lineColor: null } ) ) }
						/>
					</Flex>
				</div>
				<div className="cns-grid__group">
					<Flex gap={ 1 } align="flex-end">
						<div style={ { flex: 1 } }>
							<NumberControl
								__next40pxDefaultSize
								label={ `${ __( 'Width (px)', 'cns-story-suite' ) } ${ defaultHint( form.lineWidth === null ) ?? '' }` }
								min={ 0.5 } max={ 20 } step={ 0.5 }
								value={ effectiveWidth }
								onChange={ ( v ) =>
									setForm( ( p ) => ( { ...p, lineWidth: parseFloat( v ?? '' ) || storyWidth } ) )
								}
							/>
						</div>
						<ResetOverride
							visible={ form.lineWidth !== null }
							onReset={ () => setForm( ( p ) => ( { ...p, lineWidth: null } ) ) }
						/>
					</Flex>
				</div>
				<div className="cns-grid__group">
					<Flex gap={ 1 } align="flex-end">
						<div style={ { flex: 1 } }>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ `${ __( 'Style', 'cns-story-suite' ) } ${ defaultHint( form.lineStyle === null ) ?? '' }` }
								value={ effectiveStyle }
								options={ [
									{ value: 'solid',  label: __( 'Solid', 'cns-story-suite' ) },
									{ value: 'dashed', label: __( 'Dashed', 'cns-story-suite' ) },
									{ value: 'dotted', label: __( 'Dotted', 'cns-story-suite' ) },
								] }
								onChange={ ( v ) => setForm( ( p ) => ( { ...p, lineStyle: v as LineStyle } ) ) }
							/>
						</div>
						<ResetOverride
							visible={ form.lineStyle !== null }
							onReset={ () => setForm( ( p ) => ( { ...p, lineStyle: null } ) ) }
						/>
					</Flex>
				</div>
				<div className="cns-grid__group">
					<Flex gap={ 1 } align="flex-end">
						<div style={ { flex: 1 } }>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ `${ __( 'Opacity', 'cns-story-suite' ) } ${ defaultHint( form.lineOpacity === null ) ?? '' }` }
								min={ 0 } max={ 1 } step={ 0.05 }
								withInputField
								value={ effectiveOpacity }
								onChange={ ( v ) => setForm( ( p ) => ( { ...p, lineOpacity: v ?? storyOpacity } ) ) }
							/>
						</div>
						<ResetOverride
							visible={ form.lineOpacity !== null }
							onReset={ () => setForm( ( p ) => ( { ...p, lineOpacity: null } ) ) }
						/>
					</Flex>
				</div>
			</div>
			{ hasOverride && (
				<Button
					variant="secondary"
					icon={ undo }
					style={ { marginTop: 12 } }
					onClick={ () => setForm( { lineColor: null, lineWidth: null, lineStyle: null, lineOpacity: null } ) }
				>
					{ __( 'Reset all to story defaults', 'cns-story-suite' ) }
				</Button>
			) }

			<Flex justify="flex-start" gap={ 2 } style={ { marginTop: 16 } }>
				<Button
					variant="secondary"
					isDestructive
					icon={ trash }
					style={ { marginRight: 'auto' } }
					onClick={ () => {
						if ( window.confirm( __( 'Delete this connection?', 'cns-story-suite' ) ) ) {
							onDelete( edge.id );
							onClose();
						}
					} }
				>
					{ __( 'Delete connection', 'cns-story-suite' ) }
				</Button>
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'cns-story-suite' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ () => {
						onSave( edge.id, form );
						onClose();
					} }
				>
					{ __( 'Save', 'cns-story-suite' ) }
				</Button>
			</Flex>
		</Modal>
	);
}
