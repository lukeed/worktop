module.exports = {
  name: 'worktop-demo-basic',
  zoneid: '<YOUR ZONE ID>',
	profile: 'personal',
	build: require('../../cfw.setup.js'), // TODO: remove
  routes: [
    '<YOUR DOMAIN>/*'
  ]
}
