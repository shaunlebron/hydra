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
		game.load.image('title', 'assets/HydraTitle.png');
		game.load.spritesheet('BodyBlue', 'assets/HydraBodyBlue.png', 64, 64);
		game.load.spritesheet('head', 'assets/HydraAnim.png', 64, 64);
		game.load.image('HydraTile', 'assets/HydraTile.png');
		game.load.image('Walls', 'assets/HydraTilePac.png');
		game.load.tilemap('map01', 'assets/tilemap.json', null, Phaser.Tilemap.TILED_JSON);
	},

	create: function(){
		game.state.start('menu');
	}
};

