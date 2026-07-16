import { Button, SelectControl } from '@wordpress/components';
import { arrowLeft, external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import type { PostStatus } from '../../types';

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
	{ value: 'draft',   label: 'Draft' },
	{ value: 'publish', label: 'Published' },
	{ value: 'private', label: 'Private' },
];

interface Props {
	pageTitle:      string;
	overviewUrl:    string;
	viewUrl:        string;
	status:         PostStatus;
	isSaving:       boolean;
	onStatusChange: ( s: PostStatus ) => void;
	onSave:         () => void;
}

export default function EditorHeader( {
	pageTitle, overviewUrl, viewUrl,
	status, isSaving, onStatusChange, onSave,
}: Props ) {
	return (
		<div className="cns-map-editor__header">
			<Button href={ overviewUrl } variant="tertiary" icon={ arrowLeft }>
				{ __( 'All Stories', 'cns-story-suite' ) }
			</Button>
			<h1>{ pageTitle }</h1>
			<div className="cns-map-editor__header-actions">
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Post status', 'cns-story-suite' ) }
					hideLabelFromVision
					value={ status }
					options={ STATUS_OPTIONS }
					onChange={ ( v ) => onStatusChange( v as PostStatus ) }
				/>
				{ viewUrl && (
					<Button
						href={ viewUrl }
						variant="secondary"
						icon={ external }
						target="_blank"
					>
						{ __( 'View Story', 'cns-story-suite' ) }
					</Button>
				) }
				<Button
					variant="primary"
					isBusy={ isSaving }
					disabled={ isSaving }
					onClick={ onSave }
				>
					{ __( 'Save Story', 'cns-story-suite' ) }
				</Button>
			</div>
		</div>
	);
}
