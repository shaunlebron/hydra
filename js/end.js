// menu.js

var endState = {

	create: function  () {


		var endScreen = game.add.image(game.world.centerX, game.world.centerY, 'end');
		endScreen.anchor.setTo(0.5,0.5);

		var player1Label = game.add.text(game.world.centerX - 150, 380, '1',
			{ font: '150px ' + 'Hydra', fill: '#ffffff'});
		player1Label.anchor.setTo(0.5,0.5);

		var player2Label = game.add.text(game.world.centerX+ 200, 380, '2',
			{ font: '150px ' + 'Hydra', fill: '#ffffff'});
		player2Label.anchor.setTo(0.5,0.5);

		var title = game.add.text(game.world.centerX, 150, 'Winner',
			{ font: '80px ' + 'Hydra', fill: '#ffffff'});
		title.anchor.setTo(0.5,0.5);

		player1Label.text = game.global.playerScores[0];
		player2Label.text = game.global.playerScores[1];
		if (game.global.lastWinner == 0){
			player1Label.setStyle({font: '150px ' + 'Hydra',fill: '#f4d448'});
			title.text = 'Player 1 Wins';
		} else {
			player2Label.setStyle({font: '150px ' + 'Hydra',fill: '#f4d448'});
			title.text = 'Player 2 Wins'; 
		}
		
		console.log(game.global.lastWinner);

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


