// boot.js

var bootState = {

	preload: function () {
		game.load.image('progressBar', 'assets/progressBar.png');	
	},

	create: function () {
		game.stage.backgroundColor = '#180a2b';
		game.physics.startSystem(Phaser.Physics.ARCADE);

		game.state.start('load');
	},


};