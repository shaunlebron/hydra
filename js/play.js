
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

function tileIndexFromStraight(enter, exit) {
	if (enter.x == -1 && exit.x == 1) {
		return 2; // moving >
	}
	else if (enter.x == 1 && exit.x == -1) {
		return 4; // moving <
	}
	else if (enter.y == -1 && exit.y == 1) {
		return 1; // moving ^
	}
	else if (enter.y == 1 && exit.y == -1) {
		return 3; // moving v
	}
	return null;
}

function tileIndexFromAll(all) {
	var master = 0;
	//    1
	// 8     2     (master code for adjacency)
	//    4

	// (assuming only one xy value is nonzero per element)
	for (var i=0; i<all.length; i++) {
		var a = all[i];
		if (a.x == -1) master += 8;
		if (a.x ==  1) master += 2;
		if (a.y == -1) master += 1;
		if (a.y ==  1) master += 4;
	}

	var masterToIndex = {
		0:  0,
		1:  0,
		2:  0,
		3:  7,
		4:  0,
		5:  1,
		6:  5,
		7:  11,
		8:  0,
		9:  8,
		10: 2,
		11: 10,
		12: 6,
		13: 13,
		14: 12,
		15: 0, // no tile for this yet (choosing a T)
	};

	return masterToIndex[master];
}

function tileIndexFromAdjacency(adj) {
	var enter = adj.enter;
	var exits = adj.exits;
	var numExits = exits.length;

	// empty
	if (enter == null || numExits == 0) {
		return 0;
	}

	// special case: oriented straight piece
	var i;
	if (numExits == 1) {
		i = tileIndexFromStraight(enter, exits[0]);
		if (i != null) return i;
	}

	// general case
	var all = [enter];
	for (i=0; i<numExits; i++) {
		all.push(exits[i]);
	}
	return tileIndexFromAll(all);
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
			dir: { x: 1, y: 0},
			speed: 400,
			frame: 0,
			status: STATUS_ALIVE,
		};

		var startTile = { x: 0, y: 6 };
		var size = game.global.tileSize;
		this.head = game.add.sprite(startTile.x*size, (startTile.y+0.5)*size, 'head');
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

		this.initAdjacency();

		// initialize adjacency of first tile;
		var a = this.adjacency[startTile.x][startTile.y];
		a.enter = {x: -1, y: 0};

	},

	initAdjacency: function() {
		var adj = [];
		var x,y;
		for (x=0; x<this.map.width; x++) {
			adj[x] = [];
			for (y=0; y<this.map.height; y++) {
				adj[x][y] = {enter: null, exits: []};
			}
		}
		this.adjacency = adj;
	},

	refreshBodyTile: function(tileX, tileY) {
		var adj = this.adjacency[tileX][tileY];
		var index = tileIndexFromAdjacency(adj);
		this.map.putTile(index, tileX, tileY, this.bodyLayer);
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

		this.player.dir.x = dir.x;
		this.player.dir.y = dir.y;

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
		var dir = this.player.dir;
		var dx = dir.x * this.player.speed * dt;
		var dy = dir.y * this.player.speed * dt;

		var tile = getTile(x,y);
		var center = getCenterPixel(x,y);

		// next position
		var nx = x+dx;
		var ny = y+dy;

		// determine if we have passed the center of the tile
		var passedCenterX = (dx > 0 && nx > center.x) || (dx < 0 && nx < center.x);
		var passedCenterY = (dy > 0 && ny > center.y) || (dy < 0 && ny < center.y);

		// stop at tile midpoint if next tile is blocked
		if (!this.emptyTile(tile.x+dir.x, tile.y+dir.y)) {
			if (passedCenterX) nx = center.x;
			if (passedCenterY) ny = center.y;
		}

		// if we crossed the midpoint of a tile, set exit adjacency
		if (passedCenterX || passedCenterY) {
			this.adjacency[tile.x][tile.y].exits = [{ x: dir.x, y: dir.y }];
			this.refreshBodyTile(tile.x, tile.y);
		}

		// update position
		this.head.x = nx;
		this.head.y = ny;

		// if we are entering a new tile, set its entrance adjacency
		var newTile = getTile(nx,ny);
		if (tile.x != newTile.x || tile.y != newTile.y) {
			this.adjacency[newTile.x][newTile.y].enter = { x: -dir.x, y: -dir.y };
		}

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

