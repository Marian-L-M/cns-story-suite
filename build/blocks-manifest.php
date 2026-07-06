<?php
// This file is generated. Do not modify it manually.
return array(
	'story' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'cns-story-suite/story',
		'version' => '0.1.0',
		'title' => 'CNS Story',
		'category' => 'embed',
		'description' => 'Embed a branching interactive story canvas with a story window.',
		'keywords' => array(
			'story',
			'canvas',
			'interactive'
		),
		'textdomain' => 'cns-story-suite',
		'attributes' => array(
			'storyId' => array(
				'type' => 'integer',
				'default' => 0
			)
		),
		'supports' => array(
			'html' => false,
			'align' => array(
				'wide',
				'full'
			)
		),
		'render' => 'file:./render.php',
		'viewScript' => 'file:./view.js',
		'style' => 'file:./style-index.css',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css'
	)
);
