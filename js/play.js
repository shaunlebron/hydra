
// get the tile-XY index for the given pixel-XY
function getTile(pixelX,pixelY) {
	var size = game.global.tileSize;
	return {
		x: Math.floor(pixelX / size),
		y: Math.floor(pixelY / size),
	};
}

var STATUS_ALIVE = 0;
var STATUS_DYING = 1;
var STATUS_DEAD = 2;
var STATUS_SPAWNING = 3;

var playState = {

	getAvailableTurns: function(tileX, tileY) {
		var tilesToCheck = [
			// TODO: add direction to each element
			{ x: tileX + 0, y: tileY + 1 },
			{ x: tileX + 0, y: tileY - 1 },
			{ x: tileX + 1, y: tileY + 0 },
			{ x: tileX - 1, y: tileY + 0 },
		];
		var turns = [];
		for (i=0; i<4; i++) {

			var t = tilesToCheck[i];
			var collide = this.map.getTile(t.x, t.y, this.collideLayer);
			var body =		this.map.getTile(t.x, t.y, this.bodyLayer);

			var onPath =		  (collide === 1);
			var bodyPresent = (body === 0);

			if (onPath && !bodyPresent) {
				turns.push(t);
			}
		}
		return turns;
	},

	rotateHead: function(angle) {
		game.add.tween(this.head).to({angle: angle}, 200, Phaser.Easing.Linear.None, true);
	},

	createWorld: function() {
		this.map = game.add.tilemap('map01');
		this.map.addTilesetImage('HydraTile');
		this.map.addTilesetImage('Walls');
		this.collideLayer = this.map.createLayer('Collide');
		this.wallLayer = this.map.createLayer('Walls');
		this.bodyLayer = this.map.createLayer('Body');


		this.player = {
			x: 0,
			y: game.global.tileSize * 6.5,
			vx: 0,
			vy: 0,
			faceDir: 0,
			frame: 0,
			status: STATUS_ALIVE,
		};

		this.head = game.add.sprite(64, game.global.tileSize * 6.5 , 'head');
		this.head.anchor.setTo(0.5,0.5);
		this.head.frame = 0;
		this.head.animations.add('eat', [0,1],8,true);
		this.head.animations.play('eat');
		this.head.angle = 90;

		this.keyUp = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		this.keyDown = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		this.keyLeft = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		this.keyRight = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

		this.keyUp.onDown.add(function() {    this.rotateHead(0); }, this);
		this.keyDown.onDown.add(function() {  this.rotateHead(180); }, this);
		this.keyLeft.onDown.add(function() {  this.rotateHead(270); }, this);
		this.keyRight.onDown.add(function() { this.rotateHead(90); }, this);
	},

	create: function() {
		this.createWorld();
	},

	update: function() {
	},
};

