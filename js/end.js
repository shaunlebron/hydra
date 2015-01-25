// menu.js

var endState = {

	create: function  () {


		var endScreen = game.add.image(game.world.centerX, game.world.centerY, 'end');
		endScreen.anchor.setTo(0.5,0.5);

		var player1Label = game.add.text(game.world.centerX - 150, 380, '1',
			{ font: '150px ' + 'Hydra', fill: '#ffffff'});
		player1Label.anchor.setTo(0.5,0.5);

		var player2Label = game.add.text(game.world.centerX+ 150, 380, '2',
			{ font: '150px ' + 'Hydra', fill: '#ffffff'});
		player2Label.anchor.setTo(0.5,0.5);

		player1Label.text = '0';
		player2Label.text ='0';

		var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.addOnce(this.start, this);

		this.music = game.add.sound('EndMusic',0.75,false);
		this.music.play();

		this.keyPressSound = game.add.sound('Space',0.75,false);
	},

	start: function(){
		// this.loop.destroy();
		this.keyPressSound.play();
		game.state.start('menu');
	}
};


