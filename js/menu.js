// menu.js

var menuState = {

	create: function  () {

		var nameLabel = game.add.text(game.world.centerX, game.world.centerY -128, 'Hydra',
			{ font: '150px ' + game.global.font, fill: '#ffffff', align: 'center' });
		nameLabel.anchor.setTo(0.5,0.5);

		var instructLabel = game.add.text(game.world.centerX, game.world.height-256,
			'occupy the most spaces\nbefore you run out of moves!',
			{font:'35px ' + game.global.font, fill: '#ffffff', align:'center'});
		instructLabel.anchor.setTo(0.5,0.5);


		var startLabel = game.add.text(game.world.centerX, game.world.height-80,
			'press space to begin',
			{font:'25px ' + game.global.font, fill: '#ffffff'});
		startLabel.anchor.setTo(0.5,0.5);

		var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.addOnce(this.start, this);

		// this.loop = game.add.sound('intro',0.75,true);
		// this.loop.play();
	},

	start: function(){
		this.loop.destroy();
		// game.state.start('play');
	}
};



function spacer(){
	var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.addOnce(this.start, this);
}
