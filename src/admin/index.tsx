import { createRoot } from '@wordpress/element';
import './admin.scss';
import StoryEditorApp from './app/StoryEditorApp';

const root = document.getElementById( 'cns-admin-root' );
if ( root ) {
	createRoot( root ).render( <StoryEditorApp /> );
}
