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
		game.load.image('end', 'assets/HydraEnd.png');
		game.load.spritesheet('BodyBlue', 'assets/HydraBodyBlue.png', 64, 64);
		game.load.spritesheet('BodyPurple', 'assets/HydraBodyPurple.png', 64, 64);
		game.load.spritesheet('HeadBlue', 'assets/HydraAnim.png', 64, 64);
		game.load.spritesheet('HeadPurple', 'assets/HydraAnimPurp.png', 64, 64);
		game.load.spritesheet('LittleMan', 'assets/LittleMan.png', 64, 64);
		game.load.image('HydraTile', 'assets/HydraTile.png');
		game.load.image('Walls', 'assets/HydraTilePac.png');
		game.load.tilemap('map01', 'assets/tilemap.json', null, Phaser.Tilemap.TILED_JSON);
		game.load.audio('Hydra', ['assets/Hydra.ogg', 'assets/Hydra.mp3']);
		game.load.audio('Dead', ['assets/PlayerDead.ogg', 'assets/PlayerDead.mp3']);
		game.load.audio('Score', ['assets/PlayerScore.ogg', 'assets/PlayerScore.mp3']);
		game.load.audio('Spawn', ['assets/PlayerSpawn.ogg', 'assets/PlayerSpawn.mp3']);
		game.load.audio('Space', ['assets/SpacePress.ogg', 'assets/SpacePress.mp3']);
		game.load.audio('Rewind', ['assets/HydraRewind.ogg', 'assets/HydraRewind.mp3']);
		game.load.audio('EndMusic', ['assets/HydraEnd.ogg', 'assets/HydraEnd.mp3']);
	},

	create: function(){
		game.state.start('menu');
	}
};

