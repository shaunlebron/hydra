
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

function getDeadBodyIndexFromDir(dir) {
	if (dir.x == -1) {
		return 15;
	}
	else if (dir.x == 1) {
		return 13;
	}
	else if (dir.y == -1) {
		return 8;
	}
	else if (dir.y == 1) {
		return 14;
	}
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

var allDirs = [
	{ x:  0, y:  1 },
	{ x:  0, y: -1 },
	{ x:  1, y:  0 },
	{ x: -1, y:  0 },
];

var STATUS_ALIVE = 0;
var STATUS_DYING = 1;
var STATUS_WAITING = 2;
var STATUS_SPAWNING = 3;
var STATUS_REWIND = 4;

var BODY_EMPTY = 16; // spritesheet cell for empty

var PERSON_IDLE = 0;
var PERSON_EATEN = 1;
var PERSON_LEAVING = 2;

var LITTLE_HERE = 0;
var LITTLE_BOMB = 3;
var LITTLE_GONE = 6;

var playState = {

	create: function() {
		this.gameOver = false;

		this.createWorld();

		this.initBodyParts();
		this.initDeadEnds();

		this.numPlayers = 2;
		this.players = [];
		this.initPlayers();
		this.setupPlayerControls();

		this.initPerson();
		this.teleportPerson();

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

	makeDeadEndSprite: function(tileX, tileY) {
		var size = game.global.tileSize;
		var x = tileX*size;
		var y = tileY*size;
		var s = game.add.sprite(x, y, 'LittleMan');
		s.frame = LITTLE_GONE;
		return s;
	},

	initDeadEnds: function() {
		var deadEnds = [];
		var x,y;
		for (x=0; x<this.map.width; x++) {
			deadEnds[x] = [];
			for (y=0; y<this.map.height; y++) {
				var s = null;
				if (this.canPersonTeleportHere(x,y)) {
					s = this.makeDeadEndSprite(x,y);
				}
				deadEnds[x][y] = { sprite: s };
			}
		}
		this.deadEnds = deadEnds;
	},

	initPerson: function() {
		this.person = {
			tileX: null,
			tileY: null,
			status: PERSON_IDLE,
		};
	},

	teleportPerson: function() {
		if (this.person.status == PERSON_EATEN) {
			return;
		}

		var tiles = this.getTeleportableTiles();
		if (tiles.length > 0) {

			try {
				this.deadEnds[this.person.tileX][this.person.tileY].sprite.frame = LITTLE_GONE;
			}
			catch (e) {}

			var i = Math.floor(Math.random() * tiles.length);
			var tile = tiles[i];

			this.person.tileX = tile.x;
			this.person.tileY = tile.y;

			this.deadEnds[tile.x][tile.y].sprite.frame = LITTLE_HERE;

			var delay = Math.random()*3000 + 1000;
			setTimeout(this.teleportPerson.bind(this), delay);
		}
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

	makePlayerTurner: function(pi, angle) {
		return function() {
			if (this.players[pi].status == STATUS_ALIVE) {
				this.tryTurn(pi, angle);
			}
		};
	},

	setupPlayerControls: function() {

		this.keyArrowUp = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		this.keyArrowDown = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		this.keyArrowLeft = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		this.keyArrowRight = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

		this.keyArrowUp.onDown.add(   this.makePlayerTurner(1,0), this);
		this.keyArrowDown.onDown.add( this.makePlayerTurner(1,180), this);
		this.keyArrowLeft.onDown.add( this.makePlayerTurner(1,270), this);
		this.keyArrowRight.onDown.add(this.makePlayerTurner(1,90), this);

		this.keyW = game.input.keyboard.addKey(Phaser.Keyboard.W);
		this.keyS = game.input.keyboard.addKey(Phaser.Keyboard.S);
		this.keyA = game.input.keyboard.addKey(Phaser.Keyboard.A);
		this.keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);

		this.keyW.onDown.add(this.makePlayerTurner(0,0), this);
		this.keyS.onDown.add(this.makePlayerTurner(0,180), this);
		this.keyA.onDown.add(this.makePlayerTurner(0,270), this);
		this.keyD.onDown.add(this.makePlayerTurner(0,90), this);
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

		// add exit to previous body tile if applicable
		try {
			var tx = tile.x-dir.x;
			var ty = tile.y-dir.y;
			this.bodyParts[tx][ty].exits.push({
				x: dir.x,
				y: dir.y,
			});
			this.refreshBodySprite(tx,ty);
		}
		catch (e) {}

		// create head sprite
		var spawn = getSpawnPixel(dir, tile);
		player.head = game.add.sprite(spawn.x, spawn.y, game.global.playerHeads[i]);
		player.head.anchor.setTo(0.5,0.5);
		player.head.frame = 0;
		player.head.animations.add('eat', [0,1],8,true);
		player.head.animations.play('eat');
		player.head.angle = dirToAngle(dir);

		this.updatePreviousHeadCounts(dir, tile, 1);

		this.enterNewTile(player, dir, tile);

		// bring to life
		player.status = STATUS_ALIVE;
		this.spawnSound = game.add.sound('Spawn',0.75,false);
		this.spawnSound.play();
	},

	makeBodySprite: function(pi, tileX, tileY) {
		var size = game.global.tileSize;
		var x = tileX*size;
		var y = tileY*size;
		var s = game.add.sprite(x, y, game.global.playerBodies[pi]);
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
					heads: 0,
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

		bodyPart.heads++;
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

	isPathTile: function(tileX, tileY) {
		var collide = this.map.getTile(tileX, tileY, this.collideLayer);
		if (collide) {
			collide = collide.index;
		}
		return (collide === 1);
	},

	isEdgeTile: function(tileX, tileY) {
		return (
				tileX == 0 ||
				tileY == 0 ||
				tileX == (this.map.width - 1) ||
				tileY == (this.map.height - 1));
	},

	isBodyTile: function(tileX, tileY) {
		var body = null;
		try {
			body = this.bodyParts[tileX][tileY].enter;
		}
		catch (e) {}
		return body != null;
	},

	canPersonTeleportHere: function(tileX, tileY) {
		return (
				this.isEmptyPathTile(tileX, tileY) &&
				!this.isEdgeTile(tileX, tileY) &&
				this.getPathDirections(tileX, tileY).length == 1);
	},

	getTeleportableTiles: function() {
		var x,y;
		var tiles = [];
		for (x=0; x<this.map.width; x++) {
			for (y=0; y<this.map.height; y++) {
				if (this.canPersonTeleportHere(x,y)) {
					tiles.push({x: x, y: y});
				}
			}
		}
		return tiles;
	},

	isEmptyPathTile: function(tileX, tileY) {
		return (
				this.isPathTile(tileX, tileY) &&
				!this.isBodyTile(tileX, tileY));
	},

	getPathDirections: function(tileX, tileY) {
		var dirs = [];
		for (i=0; i<4; i++) {
			var dir = allDirs[i];
			if (this.isPathTile(tileX+dir.x, tileY+dir.y)) {
				dirs.push(dir);
			}
		}
		return dirs;
	},

	getAvailableDirections: function(tileX, tileY) {
		var dirs = [];
		for (i=0; i<4; i++) {
			var dir = allDirs[i];
			if (this.isEmptyPathTile(tileX+dir.x, tileY+dir.y)) {
				dirs.push(dir);
			}
		}
		return dirs;
	},

	debugHeadCounts: function() {
		var x,y;
		console.log("========================================");
		for (y=0; y<this.map.height; y++) {
			var s = "";
			for (x=0; x<this.map.width; x++) {
				s += " " + this.bodyParts[x][y].heads;
			}
			console.log(s);
		}
	},

	updatePreviousHeadCounts: function(dir, tile, delta) {

		// create temps
		var tileX = tile.x;
		var tileY = tile.y;
		var dirX = -dir.x;
		var dirY = -dir.y;

		while (true) {
			// move tile
			tileX += dirX;
			tileY += dirY;

			// try to get bodyPart if inside map, exit if not
			var bodyPart;
			try {
				bodyPart = this.bodyParts[tileX][tileY];
			}
			catch (e) {
				return;
			}

			bodyPart.heads += delta;
			dirX = bodyPart.enter.x;
			dirY = bodyPart.enter.y;
		}

	},

	tweenTurn: function(player, targetAngle) {
		var head = player.head;

		var a = normalizeAngle(head.angle);
		var da = shortenAngleDistance(targetAngle - a);

		game.add.tween(head).to({angle: head.angle+da}, 100, Phaser.Easing.Linear.None, true);
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
		if (!this.isEmptyPathTile(tile.x+dir.x, tile.y+dir.y)) {
			player.nextAngle = targetAngle;
			return;
		}

		player.dir.x = dir.x;
		player.dir.y = dir.y;

		this.tweenTurn(player, targetAngle);
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

	addDeadHead: function(dir, tile) {
		var sprite = this.bodyParts[tile.x][tile.y].sprite;
		sprite.frame = getDeadBodyIndexFromDir(dir);
		this.deadHeads.push({
			x: tile.x,
			y: tile.y,
		});
		this.deadSound = game.add.sound('Dead',0.75,false);
		this.deadSound.play();
	},

	killPlayer: function(player, tile) {
		// TODO: kick off bomb animation
		player.status = STATUS_WAITING;

		this.bodyParts[tile.x][tile.y].heads--;
		this.updatePreviousHeadCounts(player.dir, tile, -1);

		setTimeout(function(){
			player.head.kill();

			this.addDeadHead(player.dir, tile);

			setTimeout(function(){
				if (!this.gameOver) {
					this.spawnQueue.push(player.index);
				}
			}.bind(this), 500);

		}.bind(this), 300);

	},

	crownWinner: function(player, tile) {
		this.gameOver = true;
		this.person.status = PERSON_EATEN;
		var i,p;
		for (i=0; i<this.numPlayers; i++) {
			p = this.players[i];
			if (player.status == STATUS_ALIVE) {

				// REWIND STATE
				p.status = STATUS_REWIND;
				var tile = getTile(p.head.x, p.head.y);
				this.bodyParts[tile.x][tile.y].heads--;

			}
		}
		// game.state.start("end");
		game.global.playerScores[player.index]++;
		// this.scoreSound = game.add.sound('Score',0.75,false);
		// this.scoreSound.play();
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
		if (!this.isEmptyPathTile(tile.x+dir.x, tile.y+dir.y)) {
			if (passedCenterX) nx = center.x;
			if (passedCenterY) ny = center.y;

			if (this.getAvailableDirections(tile.x, tile.y).length == 0) {
				if (tile.x == this.person.tileX && tile.y == this.person.tileY) {
					this.crownWinner(player);
				}
				else {
					this.killPlayer(player, tile);
				}

				// EXIT EARLY
				return;
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

	dismemberDeadBodyParts: function(tileX, tileY) {
		// TODO: dismember surrounding dead body parts (with head = 0)
	},

	rewindPlayer: function(pi, dt) {

		var player = this.players[pi];
		if (player.status != STATUS_REWIND) {
			return;
		}

		var x = player.head.x;
		var y = player.head.y;
		var dir = player.dir;
		var dx = -dir.x * player.speed * dt; // reversing here
		var dy = -dir.y * player.speed * dt;

		var tile = getTile(x,y);
		var center = getCenterPixel(x,y);

		// next position
		var nx = x+dx;
		var ny = y+dy;

		// determine if we have passed the center of the tile
		var passedCenterX = (dx > 0 && nx > center.x) || (dx < 0 && nx < center.x);
		var passedCenterY = (dy > 0 && ny > center.y) || (dy < 0 && ny < center.y);

		var bodyPart = this.bodyParts[tile.x][tile.y];
		var enter = bodyPart.enter;

		// GAME OVER after done rewinding
		if (!this.isPathTile(tile.x+enter.x, tile.y+enter.y)) {
			game.state.start("end");
			return;
		}

		// pause conditions
		var aboutToTurn = -enter.x != dir.x || -enter.y != dir.y;
		var waitingOnOtherHead = bodyPart.heads > 0;
		if (aboutToTurn || waitingOnOtherHead) {

			if (passedCenterX) nx = center.x;
			if (passedCenterY) ny = center.y;

			if (aboutToTurn) {
				dir.x = -bodyPart.enter.x;
				dir.y = -bodyPart.enter.y;
				this.tweenTurn(player, dirToAngle(dir));
			}
		}

		// determine if we have passed the critical drawing point of the tile.
		var pad = -8;
		var passedDrawX = (dx > 0 && nx > (center.x+pad)) || (dx < 0 && nx < (center.x-pad));
		var passedDrawY = (dy > 0 && ny > (center.y+pad)) || (dy < 0 && ny < (center.y-pad));

		// if we crossed the drawing point of a tile, dismember dead attached
		// bodies and retract this body part
		if (passedDrawX || passedDrawY) {
			bodyPart.sprite.frame = BODY_EMPTY;
			this.dismemberDeadBodyParts(tile.x, tile.y);
		}

		// update position
		player.head.x = nx;
		player.head.y = ny;

		// if we are entering a new tile, set its entrance adjacency
		var newTile = getTile(nx,ny);
		if (tile.x != newTile.x || tile.y != newTile.y) {
			this.bodyParts[newTile.x][newTile.y].heads--;
		}

		// keep player on track
		if (dy != 0) {
			this.pullTowardTrack(player, 'x', center.x, dt);
		}
		if (dx != 0) {
			this.pullTowardTrack(player, 'y', center.y, dt);
		}
	},

	update: function() {

		// delta time (seconds)
		var dt = game.time.elapsed / 1000;

		var i;
		for (i=0; i<this.numPlayers; i++) {
			this.movePlayer(i, dt);
			this.rewindPlayer(i, dt);
		}

		this.dispatchSpawn();
	},
};

