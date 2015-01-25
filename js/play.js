
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

function shortenAngleDistance(da) {
	if (da > 180) {
		da -= 360;
	}
	else if (da < -180) {
		da += 360;
	}
	return da;
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

function dirToAngle(dir) {
	if (dir.x == -1) {
		return 270;
	}
	else if (dir.x == 1) {
		return 90;
	}
	else if (dir.y == -1) {
		return 0;
	}
	else if (dir.y == 1) {
		return 180;
	}
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
		15: 12, // no tile for this yet (choosing a T)
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

function getSpawnPixel(dir, tile) {
	var size = game.global.tileSize;

	var dx,dy;
	if (dir.x == -1) {
		dx = size-1;
		dy = size/2;
	}
	else if (dir.x == 1) {
		dx = 0;
		dy = size/2;
	}
	else if (dir.y == -1) {
		dx = size/2;
		dy = size-1;
	}
	else if (dir.y == 1) {
		dx = size/2;
		dy = 0;
	}

	return {
		x: tile.x * size + dx,
		y: tile.y * size + dy,
	};
}

// source: http://stackoverflow.com/a/2450976/142317
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var STATUS_ALIVE = 0;
var STATUS_DYING = 1;
var STATUS_WAITING = 2;
var STATUS_SPAWNING = 3;

var BODY_EMPTY = 13; // spritesheet cell for empty

var playState = {

	create: function() {
		this.createWorld();

		this.initBodyParts();

		this.numPlayers = 2;
		this.players = [];
		this.initPlayers();
		this.setupPlayerControls();

		this.deadHeads = [];
		this.spawnQueue = [];
		this.spawnLocations = [
			{
				dir: {x: 1, y: 0},
				tile: {x: 0, y: 6},
			}
		];
		this.initSpawnQueue();

		this.dispatchSpawn();
	},

	makePlayer: function(i) {
		return {
			index: i,
			head: null,
			dir: null,
			speed: 400,
			frame: 0,
			status: STATUS_WAITING,
		};
	},

	initSpawnQueue: function() {
		var i;
		for (i=0; i<this.numPlayers; i++) {
			this.spawnQueue.push(i);
		}
	},

	initPlayers: function() {
		var i;
		for (i=0; i<this.numPlayers; i++) {
			this.players[i] = this.makePlayer(i);
		}
	},

	setupPlayerControls: function() {

		this.keyArrowUp = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		this.keyArrowDown = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		this.keyArrowLeft = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		this.keyArrowRight = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

		this.keyArrowUp.onDown.add(function() {    this.tryTurn(0,0); }, this);
		this.keyArrowDown.onDown.add(function() {  this.tryTurn(0,180); }, this);
		this.keyArrowLeft.onDown.add(function() {  this.tryTurn(0,270); }, this);
		this.keyArrowRight.onDown.add(function() { this.tryTurn(0,90); }, this);

		this.keyW = game.input.keyboard.addKey(Phaser.Keyboard.W);
		this.keyS = game.input.keyboard.addKey(Phaser.Keyboard.S);
		this.keyA = game.input.keyboard.addKey(Phaser.Keyboard.A);
		this.keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);

		this.keyW.onDown.add(function() { this.tryTurn(1,0); }, this);
		this.keyS.onDown.add(function() { this.tryTurn(1,180); }, this);
		this.keyA.onDown.add(function() { this.tryTurn(1,270); }, this);
		this.keyD.onDown.add(function() { this.tryTurn(1,90); }, this);
	},

	createWorld: function() {
		this.map = game.add.tilemap('map01');
		this.map.addTilesetImage('HydraTile');
		this.map.addTilesetImage('Walls');
		this.collideLayer = this.map.createLayer('Collide');
		this.wallLayer = this.map.createLayer('Walls');
	},

	dispatchSpawn: function() {
		while (true) {
			var loc = this.spawnLocations[0];
			var pi  = this.spawnQueue[0];
			if (loc == null || pi == null) {
				break;
			}

			this.spawnQueue.shift();
			this.spawnLocations.shift();

			var dir = loc.dir;
			var tile = loc.tile;

			this.spawnPlayer(pi, dir, tile);
		}
	},

	spawnPlayer: function(i, dir, tile) {

		var player = this.players[i];
		player.dir = { x: dir.x, y: dir.y };

		// create head sprite
		var spawn = getSpawnPixel(dir, tile);
		player.head = game.add.sprite(spawn.x, spawn.y, 'head');
		player.head.anchor.setTo(0.5,0.5);
		player.head.frame = 0;
		player.head.animations.add('eat', [0,1],8,true);
		player.head.animations.play('eat');
		player.head.angle = dirToAngle(dir);

		this.enterNewTile(player, dir, tile);

		// bring to life
		player.status = STATUS_ALIVE;
	},

	makeBodySprite: function(pi, tileX, tileY) {
		var size = game.global.tileSize;
		var x = tileX*size;
		var y = tileY*size;
		var s = game.add.sprite(x, y, game.global.playerColors[pi]);
		s.frame = BODY_EMPTY;
		return s;
	},

	initBodyParts: function() {
		var bodyParts = [];
		var x,y;
		for (x=0; x<this.map.width; x++) {
			bodyParts[x] = [];
			for (y=0; y<this.map.height; y++) {
				bodyParts[x][y] = {
					enter: null,
					exits: [],
					sprite: null,
				};
			}
		}
		this.bodyParts = bodyParts;
	},

	refreshBodySprite: function(tileX, tileY) {
		var bodyPart = this.bodyParts[tileX][tileY];
		var index = tileIndexFromAdjacency(bodyPart)-1;
		bodyPart.sprite.frame = index;
	},

	enterNewTile: function(player, dir, tile) {
		var bodyPart = this.bodyParts[tile.x][tile.y];

		bodyPart.sprite = this.makeBodySprite(player.index, tile.x, tile.y);
		bodyPart.enter = {x: -dir.x, y: -dir.y};

		// make sure head is over the new body part
		player.head.bringToTop();
	},

	addSpawnLocations: function(tileX, tileY) {
		var dirs = this.getAvailableDirections(tileX, tileY);
		for (i=0; i<dirs.length; i++) {
			var dir = dirs[i];
			this.spawnLocations.push({
				dir: { x: dir.x, y: dir.y },
				tile: {
					x: tileX + dir.x,
					y: tileY + dir.y,
				},
			});
		}
		shuffle(this.spawnLocations);
	},

	emptyTile: function(tileX, tileY) {
		var collide = this.map.getTile(tileX, tileY, this.collideLayer);
		if (collide) {
			collide = collide.index;
		}
		var body;
		try {
			body = this.bodyParts[tileX][tileY].enter;
		}
		catch (e) {}
		
		var onPath =		 (collide === 1);
		var bodyAbsent = (body == null);

		return (onPath && bodyAbsent);
	},

	getAvailableDirections: function(tileX, tileY) {
		var dirsToCheck = [
			{ x:  0, y:  1 },
			{ x:  0, y: -1 },
			{ x:  1, y:  0 },
			{ x: -1, y:  0 },
		];
		var dirs = [];
		for (i=0; i<4; i++) {

			var dir = dirsToCheck[i];
			if (this.emptyTile(tileX+dir.x, tileY+dir.y)) {
				dirs.push(dir);
			}
		}
		return dirs;
	},

	tryTurn: function(pi, targetAngle) {

		var player = this.players[pi];
		if (player.status != STATUS_ALIVE) {
			return;
		}

		var head = player.head;
		player.nextAngle = null;

		var dir = angleToDir(targetAngle);
		var tile = getTile(head.x, head.y);
		if (!this.emptyTile(tile.x+dir.x, tile.y+dir.y)) {
			player.nextAngle = targetAngle;
			return;
		}

		player.dir.x = dir.x;
		player.dir.y = dir.y;

		var a = normalizeAngle(head.angle);
		var da = shortenAngleDistance(targetAngle - a);

		game.add.tween(head).to({angle: head.angle+da}, 100, Phaser.Easing.Linear.None, true);
	},

	pullTowardTrack: function(player, dim, trackX, dt) {
		var head = player.head;

		var x = head[dim];
		var dx = 2 * player.speed * dt;

		if (x > trackX) {
			head[dim] = Math.max(trackX, x - dx);
		}
		else if (x < trackX) {
			head[dim] = Math.min(trackX, x + dx);
		}
	},

	addDeadHead: function(tileX, tileY) {
	},

	killPlayer: function(player) {
		player.status = STATUS_WAITING;
		// TODO: remove player.head from game
		// TODO: this.addDeadHead();
		setTimeout(function(){
			this.spawnQueue.push(player.index);
		}.bind(this), 500);
	},

	movePlayer: function (pi, dt) {

		var player = this.players[pi];
		if (player.status != STATUS_ALIVE) {
			return;
		}

		var x = player.head.x;
		var y = player.head.y;
		var dir = player.dir;
		var dx = dir.x * player.speed * dt;
		var dy = dir.y * player.speed * dt;

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

			if (this.getAvailableDirections(tile.x, tile.y).length == 0) {
				// TODO: win if found person
				this.killPlayer(player);
			}
		}

		// determine if we have passed the critical drawing point of the tile.
		var pad = 8; // FIXME: get a bigger head (no pad size works here)
		var passedDrawX = (dx > 0 && nx > (center.x+pad)) || (dx < 0 && nx < (center.x-pad));
		var passedDrawY = (dy > 0 && ny > (center.y+pad)) || (dy < 0 && ny < (center.y-pad));

		// if we crossed the drawing point of a tile, set exit adjacency
		if (passedDrawX || passedDrawY) {
			this.bodyParts[tile.x][tile.y].exits = [{ x: dir.x, y: dir.y }];
			this.refreshBodySprite(tile.x, tile.y);
		}

		// update position
		player.head.x = nx;
		player.head.y = ny;

		// if we are entering a new tile, set its entrance adjacency
		var newTile = getTile(nx,ny);
		if (tile.x != newTile.x || tile.y != newTile.y) {
			this.enterNewTile(player, dir, newTile);
			this.addSpawnLocations(tile.x, tile.y);
		}

		// keep player on track
		if (dy != 0) {
			this.pullTowardTrack(player, 'x', center.x, dt);
		}
		if (dx != 0) {
			this.pullTowardTrack(player, 'y', center.y, dt);
		}

		// try last failed attempted turn if it is available now
		if (player.nextAngle != null) {
			this.tryTurn(player.index, player.nextAngle);
		}

	},

	update: function() {

		// delta time (seconds)
		var dt = game.time.elapsed / 1000;

		var i;
		for (i=0; i<this.numPlayers; i++) {
			this.movePlayer(i, dt);
		}

		this.dispatchSpawn();
	},
};

