// load.js
var loadState = {

	preload: function(){
		var loadingLabel = game.add.text(game.world.centerX, 40, 'loading...',
			{ font: '30px ' + game.global.font, fill: '#ffffff'});
		loadingLabel.anchor.setTo(0.5,0.5);

		//Display the progress bar
		var progressBar = game.add.sprite(game.world.centerX, 2, 'progressBar');
		progressBar.anchor.setTo(0.5,0.5);
		game.load.setPreloadSprite(progressBar);
		game.load.spritesheet('hydraTile','assets/HydraTile.png',64,64);
		
	},

	create: function(){
		game.state.start('menu');
	}
};

