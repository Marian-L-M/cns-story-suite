import type { StorySettings } from '../../../types';
import MapPicker from '../shared/MapPicker';

interface Props {
	settings:     StorySettings;
	onChange:     ( s: StorySettings ) => void;
	onMapChange:  ( mapId: number | null, mapTitle: string ) => void;
}

export default function SettingsPanel( { settings, onChange, onMapChange }: Props ) {
	function set< K extends keyof StorySettings >( key: K, value: StorySettings[ K ] ) {
		onChange( { ...settings, [ key ]: value } );
	}

	function openThumbnailPicker() {
		const frame = window.wp?.media?.( {
			title:    'Select Story Thumbnail',
			button:   { text: 'Use as thumbnail' },
			multiple: false,
			library:  { type: 'image' },
		} );
		if ( ! frame ) return;
		frame.on( 'select', () => {
			const att = frame.state().get( 'selection' ).first().toJSON();
			onChange( { ...settings, thumbnailId: att.id, thumbnailUrl: att.url } );
		} );
		frame.open();
	}

	function removeThumbnail() {
		onChange( { ...settings, thumbnailId: null, thumbnailUrl: '' } );
	}

	return (
		<div className="cns-panel cns-settings-panel">
			<h2>Story Settings</h2>

			<table className="form-table" role="presentation">
				<tbody>

					<tr>
						<th scope="row"><label htmlFor="story-title">Title</label></th>
						<td>
							<input
								id="story-title"
								type="text"
								className="regular-text"
								value={ settings.title }
								onChange={ ( e ) => set( 'title', e.target.value ) }
							/>
						</td>
					</tr>

					<tr>
						<th scope="row"><label>Thumbnail</label></th>
						<td>
							{ settings.thumbnailUrl && (
								<div style={ { marginBottom: 8 } }>
									<img
										src={ settings.thumbnailUrl }
										alt=""
										style={ { maxWidth: 120, maxHeight: 80, display: 'block', borderRadius: 4, border: '1px solid #ddd' } }
									/>
								</div>
							) }
							<div style={ { display: 'flex', gap: 8 } }>
								<button type="button" className="button" onClick={ openThumbnailPicker }>
									{ settings.thumbnailId ? 'Change thumbnail' : 'Set thumbnail' }
								</button>
								{ settings.thumbnailId && (
									<button type="button" className="button" onClick={ removeThumbnail }>
										Remove
									</button>
								) }
							</div>
							<p className="description">Used as the story&rsquo;s featured image.</p>
						</td>
					</tr>

					<tr>
						<th scope="row"><label>Map</label></th>
						<td>
							<MapPicker
								mapId={ settings.mapId }
								mapTitle={ settings.mapTitle }
								onChange={ onMapChange }
							/>
							<p className="description">
								The story canvas overlays this map. Objects and areas are shown read-only.
							</p>
						</td>
					</tr>

				</tbody>
			</table>
		</div>
	);
}
