import type { StoryTab } from '../../types';

const TABS: { id: StoryTab; label: string }[] = [
	{ id: 'settings', label: 'Settings' },
	{ id: 'canvas',   label: 'Canvas'   },
	{ id: 'nodes',    label: 'Nodes'    },
	{ id: 'paths',    label: 'Paths'    },
	{ id: 'links',    label: 'Links'    },
];

interface Props {
	activeTab: StoryTab;
	onChange:  ( tab: StoryTab ) => void;
}

export default function TabBar( { activeTab, onChange }: Props ) {
	return (
		<nav className="cns-map-editor__tabs" role="tablist" aria-label="Story editor modes">
			{ TABS.map( ( t ) => (
				<button
					key={ t.id }
					className={ `cns-tab${ activeTab === t.id ? ' cns-tab--active' : '' }` }
					role="tab"
					aria-selected={ activeTab === t.id }
					onClick={ () => onChange( t.id ) }
				>
					{ t.label }
				</button>
			) ) }
		</nav>
	);
}
