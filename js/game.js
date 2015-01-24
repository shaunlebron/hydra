// game.js

var game = new Phaser.Game(1024, 1024, Phaser.AUTO, 'gameDiv');

game.global = { 
	tileSize: 64,
};

game.state.add('boot', bootState);
game.state.add('load', loadState);
game.state.add('menu', menuState);
game.state.add('play', playState);


game.state.start('boot');

game.antialias = false;
