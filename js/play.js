
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

function angleToDir(a) {
	var dx,dy;
	switch (normalizeAngle(a)) {
		case 0:   dx =  0; dy = -1; break;
		case 90:  dx =  1; dy =  0; break;
		case 180: dx =  0; dy =  1; break;
		case 270: dx = -1; dy =  0; break;
	}
	return { x: dx, y: dy };
}

var STATUS_ALIVE = 0;
var STATUS_DYING = 1;
var STATUS_DEAD = 2;
var STATUS_SPAWNING = 3;

var playState = {

	create: function() {
		this.createWorld();
		this.createPlayer();
	},

	createWorld: function() {
		this.map = game.add.tilemap('map01');
		this.map.addTilesetImage('HydraTile');
		this.map.addTilesetImage('Walls');
		this.collideLayer = this.map.createLayer('Collide');
		this.wallLayer = this.map.createLayer('Walls');
		this.bodyLayer = this.map.createLayer('Body');
	},

	createPlayer: function() {
		this.player = {
			dirX: 1,
			dirY: 0,
			speed: 400,
			frame: 0,
			status: STATUS_ALIVE,
		};

		this.head = game.add.sprite(0, game.global.tileSize * 6.5 , 'head');
		this.head.anchor.setTo(0.5,0.5);
		this.head.frame = 0;
		this.head.animations.add('eat', [0,1],8,true);
		this.head.animations.play('eat');
		this.head.angle = 90;

		this.keyUp = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		this.keyDown = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		this.keyLeft = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		this.keyRight = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

		this.keyUp.onDown.add(function() {    this.tryTurn(0); }, this);
		this.keyDown.onDown.add(function() {  this.tryTurn(180); }, this);
		this.keyLeft.onDown.add(function() {  this.tryTurn(270); }, this);
		this.keyRight.onDown.add(function() { this.tryTurn(90); }, this);
	},

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

	tryTurn: function(targetAngle) {

		this.nextAngle = null;

		var dir = angleToDir(targetAngle);
		var tile = getTile(this.head.x, this.head.y);
		if (!this.emptyTile(tile.x+dir.x, tile.y+dir.y)) {
			this.nextAngle = targetAngle;
			return;
		}

		this.player.dirX = dir.x;
		this.player.dirY = dir.y;

		var a = normalizeAngle(this.head.angle);
		var da = targetAngle - a;
		if (da > 180) {
			da -= 360;
		}
		else if (da < -180) {
			da += 360;
		}

		game.add.tween(this.head).to({angle: this.head.angle+da}, 100, Phaser.Easing.Linear.None, true);
	},

	pullTowardTrack: function(dim, trackX, dt) {
		var x = this.head[dim];
		var dx = 2 * this.player.speed * dt;

		if (x > trackX) {
			this.head[dim] = Math.max(trackX, x - dx);
		}
		else if (x < trackX) {
			this.head[dim] = Math.min(trackX, x + dx);
		}
	},

	move: function (dt) {

		var x = this.head.x;
		var y = this.head.y;
		var dx = this.player.dirX * this.player.speed * dt;
		var dy = this.player.dirY * this.player.speed * dt;

		var tile = getTile(x,y);
		var center = getCenterPixel(x,y);

		// next position
		var nx = x+dx;
		var ny = y+dy;

		// stop at tile midpoint if next tile is blocked
		if (!this.emptyTile(tile.x+this.player.dirX, tile.y+this.player.dirY)) {
			if ((dx > 0 && nx > center.x) ||
					(dx < 0 && nx < center.x)) {
				nx = center.x;
			}
			if ((dy > 0 && ny > center.y) ||
					(dy < 0 && ny < center.y)) {
				ny = center.y;
			}
		}

		// update position
		this.head.x = nx;
		this.head.y = ny;

		// keep player on track
		if (dy != 0) {
			this.pullTowardTrack('x', center.x, dt);
		}
		if (dx != 0) {
			this.pullTowardTrack('y', center.y, dt);
		}

		// try last failed attempted turn if it is available now
		if (this.nextAngle != null) {
			this.tryTurn(this.nextAngle);
		}

	},

	update: function() {
		this.move(game.time.elapsed / 1000);
	},
};

