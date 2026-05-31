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
