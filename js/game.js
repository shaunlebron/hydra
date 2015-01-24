// game.js

var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'gameDiv');

game.global = { 

};

game.state.add('boot', bootState);
game.state.add('load', loadState);
game.state.add('menu', menuState);


game.state.start('boot');

game.antialias = false;
