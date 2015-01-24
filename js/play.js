
// get the tile-XY index for the given pixel-XY
function getTile(pixelX,pixelY) {
	var size = game.global.tileSize;
	return {
		x: Math.floor(pixelX / size),
		y: Math.floor(pixelY / size),
	};
}

function getCenterPixel(pixelX, pixelY) {
	var size = game.global.tileSize;
	var tile = getTile(pixelX, pixelY);
	return {
		x: Math.floor((tile.x + 0.5) * size),
		y: Math.floor((tile.y + 0.5) * size),
	};
}

function normalizeAngle(a) {
	var a = a % 360;
	if (a < 0) {
		a += 360;
	}
	return a;
}

var STATUS_ALIVE = 0;
var STATUS_DYING = 1;
var STATUS_DEAD = 2;
var STATUS_SPAWNING = 3;

var playState = {

	emptyTile: function(tileX, tileY) {
		var collide = this.map.getTile(tileX, tileY, this.collideLayer);
		var body =		this.map.getTile(tileX, tileY, this.bodyLayer);
		if (collide) {
			collide = collide.index;
		}
		if (body) {
			body = body.index;
		}
		
		var onPath =		  (collide === 1);
		var bodyPresent = (body === 0);

		return (onPath && !bodyPresent);
	},

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
			if (this.emptyTile(t.x, t.y)) {
				turns.push(t);
			}
		}
		return turns;
	},

	rotateHead: function(targetAngle) {

		var a = normalizeAngle(this.head.angle);

		// TODO: verify if we can turn


		var da = targetAngle - a;
		if (da > 180) {
			da -= 360;
		}
		else if (da < -180) {
			da += 360;
		}

		game.add.tween(this.head).to({angle: this.head.angle+da}, 100, Phaser.Easing.Linear.None, true);

		var a = normalizeAngle(targetAngle);
		switch (a) {
			case 0:
				this.player.dirX = 0;
				this.player.dirY = -1;
				break;
			case 90:
				this.player.dirX = 1;
				this.player.dirY = 0;
				break;
			case 180:
				this.player.dirX = 0;
				this.player.dirY = 1;
				break;
			case 270:
				this.player.dirX = -1;
				this.player.dirY = 0;
				break;
		}
	},

	createWorld: function() {
		this.map = game.add.tilemap('map01');
		this.map.addTilesetImage('HydraTile');
		this.map.addTilesetImage('Walls');
		this.collideLayer = this.map.createLayer('Collide');
		this.wallLayer = this.map.createLayer('Walls');
		this.bodyLayer = this.map.createLayer('Body');


		this.player = {
			dirX: 1,
			dirY: 0,
			speed: 200,
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

	move: function (dt) {

		var x = this.head.x;
		var y = this.head.y;
		var dx = this.player.dirX * this.player.speed * dt;
		var dy = this.player.dirY * this.player.speed * dt;

		var tile = getTile(x,y);
		var center = getCenterPixel(x,y);

		this.head.x += dx;
		this.head.y += dy;
	},

	update: function() {
		this.move(game.time.elapsed / 1000);
	},
};

