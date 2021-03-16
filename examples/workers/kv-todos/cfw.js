module.exports = {
  name: 'worktop-demo-kv-todos',
  zoneid: '<YOUR ZONE ID>',
	profile: 'personal',
	build: require('../../cfw.setup.js'), // TODO: remove
  routes: [
    '<YOUR DOMAIN>/*'
	],
	globals: {
		TODOS: 'KV:<NAMESPACEID>'
	},
}
