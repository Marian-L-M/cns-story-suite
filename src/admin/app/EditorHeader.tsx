import type { PostStatus, SaveStatus } from '../../types';

interface Props {
	pageTitle:      string;
	overviewUrl:    string;
	viewUrl:        string;
	status:         PostStatus;
	saveStatus:     SaveStatus;
	onStatusChange: ( s: PostStatus ) => void;
	onSave:         () => void;
}

const STATUS_LABELS: Record< PostStatus, string > = {
	draft:   'Draft',
	publish: 'Published',
	private: 'Private',
};

export default function EditorHeader( {
	pageTitle, overviewUrl, viewUrl,
	status, saveStatus, onStatusChange, onSave,
}: Props ) {
	return (
		<div className="cns-map-editor__header">
			<a href={ overviewUrl } className="cns-back-link">&larr; All Stories</a>
			<h1>{ pageTitle }</h1>
			<div className="cns-map-editor__header-actions">
				{ saveStatus.text && (
					<span className={ `cns-save-status${ saveStatus.type ? ` cns-save-status--${ saveStatus.type }` : '' }` }>
						{ saveStatus.text }
					</span>
				) }
				<select
					value={ status }
					onChange={ ( e ) => onStatusChange( e.target.value as PostStatus ) }
					className="cns-status-select"
					aria-label="Post status"
				>
					{ ( Object.keys( STATUS_LABELS ) as PostStatus[] ).map( ( s ) => (
						<option key={ s } value={ s }>{ STATUS_LABELS[ s ] }</option>
					) ) }
				</select>
				{ viewUrl && (
					<a href={ viewUrl } target="_blank" rel="noopener noreferrer" className="button">
						View Story
					</a>
				) }
				<button onClick={ onSave } className="button button-primary">
					Save Story
				</button>
			</div>
		</div>
	);
}
