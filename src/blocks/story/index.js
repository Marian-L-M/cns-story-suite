import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import save from './save';
import metadata from './block.json';

// wp-scripts splits these into style-index.css (front + editor) and
// index.css (editor only); block.json references those built files.
import './style.scss';
import './editor.scss';

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save,
} );
