import { Button } from '@wordpress/components';
import { MediaUpload } from '@wordpress/media-utils';
import type { ComponentType } from 'react';

// The published types for MediaUpload declare its props as an untyped class
// component, so we re-type the render-prop surface we actually use.
interface MediaUploadProps {
	title?: string;
	allowedTypes?: string[];
	multiple?: boolean;
	value?: number;
	onSelect: ( attachment: { id: number; url: string } ) => void;
	render: ( props: { open: () => void } ) => JSX.Element;
}
const Media = MediaUpload as unknown as ComponentType< MediaUploadProps >;

interface Props {
	/** Media modal title. */
	title: string;
	value: number | null;
	allowedTypes?: string[];
	icon?: JSX.Element;
	onSelect: ( attachment: { id: number; url: string } ) => void;
	/** Button label. */
	children: string;
}

/**
 * A secondary Button that opens the native media modal via
 * @wordpress/media-utils' MediaUpload render prop.
 */
export default function MediaSelectButton( {
	title,
	value,
	allowedTypes,
	icon,
	onSelect,
	children,
}: Props ) {
	return (
		<Media
			title={ title }
			allowedTypes={ allowedTypes }
			multiple={ false }
			value={ value ?? undefined }
			onSelect={ onSelect }
			render={ ( { open } ) => (
				<Button variant="secondary" icon={ icon } onClick={ open }>
					{ children }
				</Button>
			) }
		/>
	);
}
