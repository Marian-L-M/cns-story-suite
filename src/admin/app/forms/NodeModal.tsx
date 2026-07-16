import { useState, useEffect } from '@wordpress/element';
import {
	BaseControl,
	Button,
	CheckboxControl,
	Flex,
	Modal,
	RadioControl,
	RangeControl,
	SelectControl,
	TextControl,
	TextareaControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { image as imageIcon, plus, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import SubstoryPicker from '../shared/SubstoryPicker';
import ColorField from '../shared/ColorField';
import MediaSelectButton from '../shared/MediaSelectButton';
import { apiFetch } from '../../utils';
import type { StoryNode, StoryPath, NodeFormData, IconType, IconBgShape, NodeMarkerType } from '../../../types';

interface Props {
	nodeId:       number | null; // null = new node
	existingNode: StoryNode | null;
	initialX:     number; // 0–1 normalised canvas position
	initialY:     number;
	paths:        StoryPath[];
	onSave:       ( data: NodeFormData ) => void;
	onClose:      () => void;
}

function buildInitialForm( node: StoryNode | null, initialX: number, initialY: number ): NodeFormData {
	return {
		x:                  node?.x              ?? initialX,
		y:                  node?.y              ?? initialY,
		pathId:             node?.pathId         ?? null,
		substoryId:         node?.substoryId     ?? null,
		substoryLabel:      node?.substoryTitle  ?? '',
		titleOverride:      node?.titleOverride  ?? '',
		excerptOverride:    node?.excerptOverride ?? '',
		iconType:           node?.iconType       ?? 'round',
		iconId:             node?.iconId         ?? null,
		iconColor:          node?.iconColor      ?? '#ffffff',
		iconSize:           node?.iconSize       ?? 1.0,
		iconBorderColor:    node?.iconBorderColor ?? '#000000',
		iconBorderWidth:    node?.iconBorderWidth ?? 2,
		iconBgColor:        node?.iconBgColor     ?? '#ffffff',
		iconBgShape:        node?.iconBgShape     ?? 'none',
		markerType:         node?.markerType      ?? 'inherit',
		markerIconId:       node?.markerIconId    ?? null,
		markerColor:        node?.markerColor     ?? null,
		markerSize:         node?.markerSize      ?? null,
		markerIconOffsetX:  node?.markerIconOffsetX ?? null,
		markerIconOffsetY:  node?.markerIconOffsetY ?? null,
	};
}

const SHAPE_OPTIONS: { value: IconType; label: string }[] = [
	{ value: 'round',     label: 'Round' },
	{ value: 'square',    label: 'Square' },
	{ value: 'diamond',   label: 'Diamond' },
	{ value: 'icon',      label: 'Icon' },
	{ value: 'thumbnail', label: 'Thumbnail' },
];

export default function NodeModal( { nodeId, existingNode, initialX, initialY, paths, onSave, onClose }: Props ) {
	const [ form,     setForm     ] = useState< NodeFormData >( () => buildInitialForm( existingNode, initialX, initialY ) );
	const [ saving,   setSaving   ] = useState( false );
	const [ newTitle, setNewTitle ] = useState( '' );
	const [ creating, setCreating ] = useState( false );

	const isNew = nodeId === null;

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
			const data = await apiFetch< { id: number; title: string; editUrl: string } >(
				'POST',
				'/substories',
				{ title: newTitle }
			);
			set( 'substoryId', data.id );
			set( 'substoryLabel', data.title );
			setNewTitle( '' );
		} catch {
			/* create failures are silent, as before */
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
		<Modal
			title={ isNew ? __( 'Add Node', 'cns-story-suite' ) : __( 'Edit Node', 'cns-story-suite' ) }
			onRequestClose={ onClose }
			size="medium"
			className="cns-node-modal"
		>
			{ /* Substory connection */ }
			<div className="cns-modal-section">
				<h3>{ __( 'Substory Post', 'cns-story-suite' ) }</h3>
				<SubstoryPicker
					substoryId={ form.substoryId }
					substoryLabel={ form.substoryLabel }
					onChange={ ( id, label ) => { set( 'substoryId', id ); set( 'substoryLabel', label ); } }
				/>

				{ ! form.substoryId && (
					<div style={ { marginTop: 10 } }>
						<p className="description" style={ { marginBottom: 6 } }>
							{ __( 'Or create a new substory post:', 'cns-story-suite' ) }
						</p>
						<Flex gap={ 2 } align="flex-end">
							<div style={ { flex: 1 } }>
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'New substory title', 'cns-story-suite' ) }
									hideLabelFromVision
									placeholder={ __( 'New substory title…', 'cns-story-suite' ) }
									value={ newTitle }
									onChange={ setNewTitle }
									onKeyDown={ ( e: React.KeyboardEvent ) => {
										if ( e.key === 'Enter' ) handleCreateSubstory();
									} }
								/>
							</div>
							<Button
								variant="secondary"
								icon={ plus }
								isBusy={ creating }
								disabled={ creating || ! newTitle.trim() }
								onClick={ handleCreateSubstory }
							>
								{ creating
									? __( 'Creating…', 'cns-story-suite' )
									: __( 'Create', 'cns-story-suite' ) }
							</Button>
						</Flex>
					</div>
				) }
			</div>

			{ /* Title / excerpt overrides */ }
			<div className="cns-modal-section">
				<h3>{ __( 'Display Overrides', 'cns-story-suite' ) }</h3>
				<p className="description" style={ { marginBottom: 12 } }>
					{ __( 'Leave blank to use the substory post’s title and excerpt.', 'cns-story-suite' ) }
				</p>
				<div className="cns-grid cns-grid__12">
					<div className="cns-grid__group cns-grid__span-full">
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Title', 'cns-story-suite' ) }
							value={ form.titleOverride }
							placeholder={ form.substoryLabel || __( 'Node title…', 'cns-story-suite' ) }
							onChange={ ( v ) => set( 'titleOverride', v ) }
						/>
					</div>
					<div className="cns-grid__group cns-grid__span-full">
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Excerpt', 'cns-story-suite' ) }
							rows={ 3 }
							value={ form.excerptOverride }
							placeholder={ __( 'Short description shown in the story window…', 'cns-story-suite' ) }
							onChange={ ( v ) => set( 'excerptOverride', v ) }
						/>
					</div>
				</div>
			</div>

			{ /* Position */ }
			<div className="cns-modal-section">
				<h3>{ __( 'Position', 'cns-story-suite' ) }</h3>
				<div className="cns-grid cns-grid__12">
					<div className="cns-grid__group">
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'X (%)', 'cns-story-suite' ) }
							min={ 0 } max={ 100 } step={ 0.1 }
							value={ Math.round( form.x * 1000 ) / 10 }
							onChange={ ( v ) =>
								set( 'x', Math.max( 0, Math.min( 1, ( parseFloat( v ?? '' ) || 0 ) / 100 ) ) )
							}
						/>
					</div>
					<div className="cns-grid__group">
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Y (%)', 'cns-story-suite' ) }
							min={ 0 } max={ 100 } step={ 0.1 }
							value={ Math.round( form.y * 1000 ) / 10 }
							onChange={ ( v ) =>
								set( 'y', Math.max( 0, Math.min( 1, ( parseFloat( v ?? '' ) || 0 ) / 100 ) ) )
							}
						/>
					</div>
				</div>
				<p className="description" style={ { marginTop: 6 } }>
					{ __(
						'Position as a percentage of canvas width/height from the top-left. Also adjustable by clicking or dragging on the canvas.',
						'cns-story-suite'
					) }
				</p>
			</div>

			{ /* Icon settings */ }
			<div className="cns-modal-section">
				<h3>{ __( 'Node Appearance', 'cns-story-suite' ) }</h3>
				<div className="cns-grid cns-grid__12">
					<div className="cns-grid__group cns-grid__span-full">
						<RadioControl
							label={ __( 'Shape', 'cns-story-suite' ) }
							selected={ form.iconType }
							options={ SHAPE_OPTIONS.filter(
								( o ) => o.value !== 'thumbnail' || !! form.substoryId
							) }
							onChange={ ( v ) => set( 'iconType', v as IconType ) }
						/>
						{ form.iconType === 'thumbnail' && (
							<p className="description" style={ { marginTop: 6 } }>
								{ __( 'Uses the substory’s featured image, clipped to a circle.', 'cns-story-suite' ) }
							</p>
						) }
						{ ! form.substoryId && (
							<p className="description" style={ { marginTop: 6, color: '#888' } }>
								{ __( 'Link a substory above to enable the Thumbnail option.', 'cns-story-suite' ) }
							</p>
						) }
					</div>

					{ form.iconType === 'icon' && (
						<div className="cns-grid__group cns-grid__span-full">
							<BaseControl
								__nextHasNoMarginBottom
								id="cns-node-icon-image"
								label={ __( 'Icon Image', 'cns-story-suite' ) }
							>
								<div className="cns-actions-row">
									<MediaSelectButton
										title={ __( 'Select Icon', 'cns-story-suite' ) }
										value={ form.iconId }
										icon={ imageIcon }
										onSelect={ ( att ) => set( 'iconId', att.id ) }
									>
										{ form.iconId
											? `Icon #${ form.iconId }`
											: __( 'Select Icon', 'cns-story-suite' ) }
									</MediaSelectButton>
									{ form.iconId && (
										<Button
											variant="tertiary"
											isDestructive
											icon={ trash }
											label={ __( 'Remove icon', 'cns-story-suite' ) }
											onClick={ () => set( 'iconId', null ) }
										/>
									) }
								</div>
							</BaseControl>
						</div>
					) }

					{ /* Background (for icon and thumbnail) */ }
					{ ( form.iconType === 'icon' || form.iconType === 'thumbnail' ) && (
						<div className="cns-grid__group cns-grid__span-full">
							<RadioControl
								label={ __( 'Background shape', 'cns-story-suite' ) }
								selected={ form.iconBgShape }
								options={ ( form.iconType === 'thumbnail'
									? ( [ 'round', 'square' ] as const )
									: ( [ 'none', 'round', 'square' ] as const )
								).map( ( s ) => ( {
									value: s,
									label: s.charAt( 0 ).toUpperCase() + s.slice( 1 ),
								} ) ) }
								onChange={ ( v ) => set( 'iconBgShape', v as IconBgShape ) }
							/>
						</div>
					) }
					{ ( form.iconType === 'icon' || form.iconType === 'thumbnail' ) && form.iconBgShape !== 'none' && (
						<div className="cns-grid__group">
							<ColorField
								label={ __( 'Background color', 'cns-story-suite' ) }
								value={ form.iconBgColor }
								onChange={ ( v ) => set( 'iconBgColor', v ) }
							/>
						</div>
					) }

					{ ! [ 'icon', 'thumbnail' ].includes( form.iconType ) && (
						<div className="cns-grid__group">
							<ColorField
								label={ __( 'Fill color', 'cns-story-suite' ) }
								value={ form.iconColor }
								onChange={ ( v ) => set( 'iconColor', v ) }
							/>
						</div>
					) }

					<div className="cns-grid__group">
						<ColorField
							label={ __( 'Border color', 'cns-story-suite' ) }
							value={ form.iconBorderColor }
							onChange={ ( v ) => set( 'iconBorderColor', v ) }
						/>
					</div>
					<div className="cns-grid__group">
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Border width (px)', 'cns-story-suite' ) }
							min={ 0 } max={ 10 } step={ 0.5 }
							withInputField
							value={ form.iconBorderWidth }
							onChange={ ( v ) => set( 'iconBorderWidth', v ?? 2 ) }
						/>
					</div>
					<div className="cns-grid__group">
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Size (×)', 'cns-story-suite' ) }
							min={ 0.25 } max={ 3 } step={ 0.25 }
							withInputField
							value={ form.iconSize }
							onChange={ ( v ) => set( 'iconSize', v ?? 1 ) }
						/>
					</div>
				</div>
			</div>

			{ /* Path assignment */ }
			<div className="cns-modal-section">
				<h3>{ __( 'Story Path', 'cns-story-suite' ) }</h3>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Path', 'cns-story-suite' ) }
					hideLabelFromVision
					help={ __( 'Assign this node to a path to inherit its marker settings.', 'cns-story-suite' ) }
					value={ form.pathId !== null ? String( form.pathId ) : '' }
					options={ [
						{ value: '', label: __( '— No path (use global settings) —', 'cns-story-suite' ) },
						...paths.map( ( p ) => ( {
							value: String( p.id ),
							label: p.label || `Path #${ p.id }`,
						} ) ),
					] }
					onChange={ ( v ) => set( 'pathId', v ? parseInt( v, 10 ) : null ) }
				/>
			</div>

			{ /* Per-node marker override */ }
			<div className="cns-modal-section">
				<h3>{ __( 'Individual Marker Override', 'cns-story-suite' ) }</h3>
				<p className="description" style={ { marginBottom: 10 } }>
					{ __(
						'Overrides path and global settings for this node only. Leave a field unchecked to inherit.',
						'cns-story-suite'
					) }
				</p>

				<div className="cns-grid cns-grid__12">
					<div className="cns-grid__group cns-grid__span-full">
						<RadioControl
							label={ __( 'Marker type', 'cns-story-suite' ) }
							selected={ form.markerType }
							options={ [
								{ value: 'inherit', label: __( 'Inherit', 'cns-story-suite' ) },
								{ value: 'ring',    label: __( 'Ring', 'cns-story-suite' ) },
								{ value: 'icon',    label: __( 'Icon', 'cns-story-suite' ) },
							] }
							onChange={ ( v ) => set( 'markerType', v as NodeMarkerType ) }
						/>
					</div>

					{ /* Color override */ }
					<div className="cns-grid__group">
						<CheckboxControl
							__nextHasNoMarginBottom
							label={ __( 'Color override', 'cns-story-suite' ) }
							checked={ form.markerColor !== null }
							onChange={ ( checked ) => set( 'markerColor', checked ? '#00aaff' : null ) }
						/>
						{ form.markerColor !== null && (
							<ColorField
								label={ __( 'Marker color', 'cns-story-suite' ) }
								value={ form.markerColor }
								onChange={ ( v ) => set( 'markerColor', v ) }
							/>
						) }
					</div>

					{ /* Size override */ }
					<div className="cns-grid__group">
						<CheckboxControl
							__nextHasNoMarginBottom
							label={ __( 'Size override', 'cns-story-suite' ) }
							checked={ form.markerSize !== null }
							onChange={ ( checked ) => set( 'markerSize', checked ? 5 : null ) }
						/>
						{ form.markerSize !== null && (
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Marker size (px)', 'cns-story-suite' ) }
								hideLabelFromVision
								min={ 1 } max={ 30 } step={ 1 }
								withInputField
								value={ form.markerSize }
								onChange={ ( v ) => set( 'markerSize', v ?? 5 ) }
							/>
						) }
					</div>

					{ /* Icon picker — only when type is icon */ }
					{ form.markerType === 'icon' && (
						<div className="cns-grid__group cns-grid__span-full">
							<BaseControl
								__nextHasNoMarginBottom
								id="cns-node-marker-icon"
								label={ __( 'Marker icon', 'cns-story-suite' ) }
							>
								<div className="cns-actions-row">
									<MediaSelectButton
										title={ __( 'Select Marker Icon', 'cns-story-suite' ) }
										value={ form.markerIconId }
										allowedTypes={ [ 'image' ] }
										icon={ imageIcon }
										onSelect={ ( att ) => set( 'markerIconId', att.id ) }
									>
										{ form.markerIconId
											? `Icon #${ form.markerIconId }`
											: __( 'Select icon', 'cns-story-suite' ) }
									</MediaSelectButton>
									{ form.markerIconId && (
										<Button
											variant="tertiary"
											isDestructive
											icon={ trash }
											label={ __( 'Remove marker icon', 'cns-story-suite' ) }
											onClick={ () => set( 'markerIconId', null ) }
										/>
									) }
								</div>
							</BaseControl>
						</div>
					) }

					{ /* Offset overrides — only when type is icon */ }
					{ form.markerType === 'icon' && (
						<>
							<div className="cns-grid__group">
								<CheckboxControl
									__nextHasNoMarginBottom
									label={ __( 'Offset X override', 'cns-story-suite' ) }
									checked={ form.markerIconOffsetX !== null }
									onChange={ ( checked ) => set( 'markerIconOffsetX', checked ? 0 : null ) }
								/>
								{ form.markerIconOffsetX !== null && (
									<NumberControl
										__next40pxDefaultSize
										label={ __( 'Offset X (px)', 'cns-story-suite' ) }
										hideLabelFromVision
										min={ -100 } max={ 100 } step={ 1 }
										value={ form.markerIconOffsetX }
										onChange={ ( v ) =>
											set( 'markerIconOffsetX', parseFloat( v ?? '' ) || 0 )
										}
									/>
								) }
							</div>
							<div className="cns-grid__group">
								<CheckboxControl
									__nextHasNoMarginBottom
									label={ __( 'Offset Y override', 'cns-story-suite' ) }
									checked={ form.markerIconOffsetY !== null }
									onChange={ ( checked ) => set( 'markerIconOffsetY', checked ? -30 : null ) }
								/>
								{ form.markerIconOffsetY !== null && (
									<NumberControl
										__next40pxDefaultSize
										label={ __( 'Offset Y (px)', 'cns-story-suite' ) }
										hideLabelFromVision
										min={ -100 } max={ 100 } step={ 1 }
										value={ form.markerIconOffsetY }
										onChange={ ( v ) =>
											set( 'markerIconOffsetY', parseFloat( v ?? '' ) || 0 )
										}
									/>
								) }
							</div>
						</>
					) }
				</div>
			</div>

			<Flex justify="flex-end" gap={ 2 } style={ { marginTop: 16 } }>
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'cns-story-suite' ) }
				</Button>
				<Button
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
					onClick={ handleSave }
				>
					{ saving
						? __( 'Saving…', 'cns-story-suite' )
						: isNew
						? __( 'Add Node', 'cns-story-suite' )
						: __( 'Save Node', 'cns-story-suite' ) }
				</Button>
			</Flex>
		</Modal>
	);
}
