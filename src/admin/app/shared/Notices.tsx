import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Renders snackbar notices from the wp/notices store — the same pattern the
 * block editor uses. Dispatch with createSuccessNotice/createErrorNotice and
 * `{ type: 'snackbar' }`.
 */
export default function Notices() {
	const notices = useSelect(
		( select ) => select( noticesStore ).getNotices(),
		[]
	);
	const { removeNotice } = useDispatch( noticesStore );

	return (
		<SnackbarList
			className="cns-snackbar-list"
			notices={ notices.filter( ( n ) => n.type === 'snackbar' ) }
			onRemove={ removeNotice }
		/>
	);
}
