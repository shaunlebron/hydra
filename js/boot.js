// boot.js

var bootState = {

	preload: function () {
		game.load.image('progressBar', 'assets/progressBar.png');	
	},

	create: function () {
		game.stage.backgroundColor = '#D62424';
		game.physics.startSystem(Phaser.Physics.ARCADE);

		game.state.start('load');
	},


};