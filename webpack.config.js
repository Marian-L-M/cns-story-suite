const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: async () => {
		const blockEntries = await defaultConfig.entry();
		return {
			...blockEntries,
			'admin/index':     './src/admin/index.tsx',
			'map-panel/index': './src/map-panel/index.tsx',
		};
	},
};
