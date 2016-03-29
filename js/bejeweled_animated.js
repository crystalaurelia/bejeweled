
(function() {

	window.Bejeweled = function() {
		this.canvasElement = document.getElementById("gameBoard");
		this.bufferElement = document.getElementById("bufferBoard");
		this.screenContext = this.canvasElement.getContext("2d");
		this.bufferContext = this.bufferElement.getContext("2d");
		
		this.currentScoreElement = document.getElementById("currentScore");
		this.highScoreElement = document.getElementById("highScore");
		this.startElement = document.getElementById("start");
		this.resetElement = document.getElementById("reset");		
	
		this.tiles = ["white", "#85D9DA","#D3EAEF", "#C2FBEF", "#AEACC3", "#72711F", "#7DAA92"];
		this.boardWidth = 8;
		this.boardHeight = 8;
		this.board = new Array(this.boardHeight+2); // extra padding for pattern matching
	
		this.tileSize = 50;
		this.numberOfColors = 6;
		this.picked = 0;
		
		this.gameFlag = 0; 
		
		this.hiScore = 0; 
		this.score = 0;
		
		this.markedX; 
		this.markedY;
		
		//For board animations
		this.block = {direction:'', row:0, col:0, len:0};
		this.drawTile = {step:5, sx:0, sy:0, swidth:0, sheight:0, x:0, y:0, window:0, height:0};
		this.BoardEvent;
		this.eTimer = null;
		this.milliseconds = 40;
		this.inAnimation = false;
		
		this.init();
	};
	
	window.Bejeweled.prototype.init = function() {		
		this.startElement.addEventListener("click", this.start_onclick.bind(this),false);
		this.resetElement.addEventListener("click", this.reset_onclick.bind(this),false);		
		this.canvasElement.addEventListener("click", this.canvas_onclick.bind(this),false);
		
		this.BoardEvent = new CustomEvent (
			"scanBoardMsg",
			{
				detail: { callerId: "Start Button!" },
				bubbles: true,
				cancelable: true
		});		
		this.bufferElement.addEventListener("scanBoardMsg", this.scanBoard.bind(this));
		
		this.generateBoard();					
	}
	
	window.Bejeweled.prototype.generateBoard = function() {
			
		for (var row=0; row < this.boardHeight+2; row++) {
			this.board[row] = new Array(this.boardWidth+2);
			if (row == 0 || row == this.boardHeight+1) {
				for (var col=0; col < this.boardWidth+2; col++)
					this.board[row][col] = 0; // extra 2 rows for matching padding.
			}
			else {
				for (var col=1; col < this.boardWidth+1; col++) {
					this.board[row][col] = this.generateRandomColor(0);  
				}
				this.board[row][0] = this.board[row][col] = 0; // extra 2 columns for matching padding.
			}
		} 
		this.score = 0;
		this.displayBoard();
		this.updateScore(0);
	};
	
	window.Bejeweled.prototype.generateRandomColor = function(excludeColor) {
		var color;
		while ((color = Math.floor((Math.random() * this.numberOfColors) + 1)) == excludeColor);
		return color;
	};
	
	window.Bejeweled.prototype.drawBufferCanvas = function() {
		var x, y=0;
	
		for (var row=1; row <= this.boardHeight; row++) {
			x = 0;
			for (var col=1; col <= this.boardWidth; col++) {
				this.bufferContext.fillStyle = this.tiles[this.board[row][col]];
				this.bufferContext.fillRect(x, y, this.tileSize, this.tileSize);
				x += this.tileSize;
			}
			y += this.tileSize;
		}
	};
	
	window.Bejeweled.prototype.displayBoard = function() {
		this.drawBufferCanvas();
		this.screenContext.drawImage(this.bufferContext.canvas, 0, 0);
	};
	
	window.Bejeweled.prototype.updateScore = function(points) {
		this.score += points;
		this.currentScoreElement.innerHTML = this.score;
		if (this.score > this.hiScore) {
			this.hiScore = this.score;
		}
		this.highScoreElement.innerHTML = this.hiScore;
	};
	
	window.Bejeweled.prototype.markTile = function(on, selectedX, selectedY) {
		var canvasX = this.tileSize * (selectedX-1);
		var canvasY = this.tileSize * (selectedY-1);
		var len = this.tileSize;
	
		if (on) {
			this.screenContext.fillStyle = this.tiles[0];
			this.screenContext.fillRect(canvasX, canvasY, len, len); //create white square
		
			len = this.tileSize - 8;
			canvasX += 4;
			canvasY += 4;
		}

		this.screenContext.fillStyle = this.tiles[this.board[selectedY][selectedX]];
		this.screenContext.fillRect(canvasX, canvasY, len, len); //refill inner square
	};
	
	window.Bejeweled.prototype.canvas_onclick = function(event) {
		if (this.gameFlag == 0 || this.inAmination) return;

		var color, col1, col2, row1, row2;
		var found = false;
		var selectedX = event.clientX + window.scrollX - this.canvasElement.offsetLeft;
		var selectedY = event.clientY + window.scrollY - this.canvasElement.offsetTop;
		selectedX = Math.floor(selectedX / this.tileSize);
		selectedY = Math.floor(selectedY / this.tileSize);
		selectedX = (selectedX >= this.boardWidth) ? this.boardWidth-1 : selectedX;
		selectedY = (selectedY >= this.boardHeight) ? this.boardHeight-1 : selectedY;
		selectedX += 1; selectedY += 1;
		
		this.picked++;
		if (this.picked == 1) {
			this.markedX = selectedX; 
			this.markedY = selectedY; 
			this.markTile(true, selectedX, selectedY);
		}
		if (this.picked == 2) {
			if (selectedX == this.markedX && selectedY == this.markedY) { 				
				this.picked = 0;
				this.markTile(false, selectedX, selectedY); //unmark the previously picked tile
			}
			else {
				if (selectedX < this.markedX-1 || selectedX > this.markedX+1 || selectedY < this.markedY-1 || selectedY > this.markedY+1 || 
				(selectedX == this.markedX-1 && selectedY == this.markedY-1) || (selectedX == this.markedX+1 && selectedY == this.markedY+1)  ||
				(selectedX == this.markedX-1 && selectedY == this.markedY+1) || (selectedX == this.markedX+1 && selectedY == this.markedY-1)) {
					this.picked = 1;
					alert("Not valid! Pick horizontally or vertically adjacent tile!");
				}
				else { 
					this.picked = 0;
					col1 = this.markedX; row1 = this.markedY; 
					col2 = selectedX; row2 = selectedY;
					color = this.board[row2][col2];
					this.board[row2][col2] = this.board[row1][col1];
					this.board[row1][col1] = color;
					this.markTile(false, selectedX, selectedY);
					this.markTile(false, this.markedX, this.markedY);
					found |= this.scanRows(row1, row2, this.boardWidth);
					found |= this.scanCols(col1, col2, this.boardHeight);
					if (!found) {
						alert("Not a valid swap! No 3+ adjacent tiles formed!");
						this.board[row1][col1] = this.board[row2][col2];
						this.board[row2][col2] = color; 	// swap back those two tiles.
						this.picked = 1;
						this.markTile(false, selectedX, selectedY);
						this.markTile(true, this.markedX, this.markedY);
					}
					else {
						// trigger bloacks scan whenever there is one.
						this.triggerBoardScan('canvas_onclick');
					} 
				}
			}
		}
	};
	
	window.Bejeweled.prototype.scanBoard = function(event) {
		var that = this; // save Bejeweled object scope here; otherwise, setInterval won't work.
		if (this.inAnimation) return false;
		
		var col, row;
		for (row=this.boardHeight; row > 0; row--) {
			if (this.scanRows(row, row, this.boardWidth)) {	
				// 3+ consecutive block found in this row 
				col = this.block.col+this.block.len-1;
				this.eliminateHblock(this.block.row, this.block.col, col);
				this.inAnimation = true;
				this.eTimer = setInterval(this.animateTiles.bind(that), this.milliseconds);
				this.updateScore(this.block.len);
				return true;
			}
		}
		for (col=1; col<=this.boardWidth; col++) {
			if (this.scanCols(col, col, this.boardHeight)) {	
				// 3+ consecutive block found in this col 
				row = this.block.row-this.block.len+1;
				this.eliminateVblock(this.block.col, this.block.row, row);
				this.inAnimation = true;
				this.eTimer = setInterval(this.animateTiles.bind(that), this.milliseconds);
				this.updateScore(this.block.len);
				return true;
			}
		}
		if (event.detail.callerId == 'eTimer') { 
			//animation done
			this.inAnimation = false;
			this.checkAlive();
		}
	};
	
	
	window.Bejeweled.prototype.scanRows = function(fromRow, toRow, rowWidth) {
		var row, col, beginIndex, endIndex, color, prevColor;
	
		// always scan from bottom up, left to right.
		if (fromRow < toRow) {
			row = fromRow; fromRow = toRow; toRow = row;
		}
		for (row=fromRow; row >= toRow; row--) {
			prevColor = beginIndex = endIndex = 0;
			col = 1;
			while (col < rowWidth+2) {
				color = this.board[row][col];
				if (color == prevColor) {
					endIndex = col;
				}
				else {
					if ((endIndex-beginIndex) > 1) { //3+ consecutive matches found
						//save block info
						this.block.direction = "H";
						this.block.row = row;
						this.block.col = beginIndex;
						this.block.len = endIndex-beginIndex+1;
						return true;
					}
					prevColor = color;
					beginIndex = col;
				}
				col++;
			}
		} 
		return false;
	};

	window.Bejeweled.prototype.scanCols = function(fromCol, toCol, colHeight) {
		var col, row, beginIndex, endIndex, color, prevColor;		
		
		// always from bottom up, left to right.
		if (fromCol > toCol) {
			col = fromCol; fromCol = toCol; toCol = col;
		}
		for (col=fromCol; col <= toCol; col++) {
			prevColor = 0;
			row =  beginIndex = endIndex = colHeight;
			while (row >= 0) {
				color = this.board[row][col];
				if (color == prevColor) {
					endIndex = row;
				}
				else {
					if ((beginIndex-endIndex) > 1) { // 3+ consecutive matches found
						//save block info
						this.block.direction = "V";
						this.block.row = beginIndex;
						this.block.col = col;
						this.block.len = beginIndex-endIndex+1;
						return true;
					}
					prevColor = color;
					beginIndex = row;
				}
				row--;
			}

		} 
		return false;
	};
	
	window.Bejeweled.prototype.eliminateHblock = function(row, start, end) {
		var col, x, y;			
		for (var r=row; r >= 1; r--) {
			y = this.tileSize * (r-1);
			for (col=start; col <= end; col++) {
				this.board[r][col] = this.board[r-1][col];
				this.bufferContext.fillStyle = this.tiles[this.board[r][col]];
				x = this.tileSize * (col-1);
				this.bufferContext.fillRect(x, y, this.tileSize, this.tileSize);
			}
		}	
		y = 0;	// fill in the top row with new colors.
		for (col=start; col <= end; col++) {
			this.board[1][col] = this.generateRandomColor(0);
			this.bufferContext.fillStyle = this.tiles[this.board[1][col]];
			x = this.tileSize * (col-1);
			this.bufferContext.fillRect(x, y, this.tileSize, this.tileSize);
		}
		
		this.drawTile.height = this.drawTile.y = 0;
		this.drawTile.window = this.tileSize;
		this.drawTile.sx = this.drawTile.x = this.tileSize * (start-1);
		this.drawTile.sheight = this.tileSize * (row-1);
		this.drawTile.sy = this.tileSize * row - this.drawTile.sheight;
		this.drawTile.swidth = this.tileSize * (end-start+1);
	};

	window.Bejeweled.prototype.eliminateVblock = function(col, start, end) {
		var x, y;	
		x = this.tileSize * (col-1);
		for (var i=0; i <= (start-end); i++) {
			for (var row=start; row > 1; row--) {
				this.board[row][col] = this.board[row-1][col];
				this.bufferContext.fillStyle = this.tiles[this.board[row][col]];
				y = this.tileSize * (row-1);
				this.bufferContext.fillRect(x, y, this.tileSize, this.tileSize);
			}
	
			y = 0;	// fill in the top row with new colors.
			this.board[1][col] = this.generateRandomColor(0);
			this.bufferContext.fillStyle = this.tiles[this.board[1][col]];
			this.bufferContext.fillRect(x, y, this.tileSize, this.tileSize);	
		}
		
		this.drawTile.swidth = this.tileSize;
		this.drawTile.height = this.drawTile.y = 0;
		this.drawTile.sx = this.drawTile.x = this.tileSize * (col-1);
		this.drawTile.sheight = this.tileSize * (end-1);
		this.drawTile.window = this.tileSize * (start-end+1); 
		this.drawTile.sy = this.tileSize * start - this.drawTile.sheight;

	};	
	
	window.Bejeweled.prototype.animateTiles = function() {
		if (!this.inAnimation) return;

		this.drawTile.sy -= this.drawTile.step;
		this.drawTile.sheight += this.drawTile.step;
		
		this.screenContext.drawImage(this.bufferContext.canvas, 
			this.drawTile.sx, this.drawTile.sy, this.drawTile.swidth, this.drawTile.sheight, 
			this.drawTile.x, this.drawTile.y, this.drawTile.swidth, this.drawTile.sheight);
			
		if (this.drawTile.sy <= 0) { 
			this.inAnimation = false;
			clearInterval(this.eTimer);
			this.triggerBoardScan('eTimer');
		}	
	
	};
	
	window.Bejeweled.prototype.triggerBoardScan = function(callid) {
		this.BoardEvent.detail.callerId = callid;
		this.bufferElement.dispatchEvent(this.BoardEvent);
	};

	window.Bejeweled.prototype.checkMatch = function() {
		var color, prevColor, checkColor;
		var row, col, i;
		var byt1, byt2, shift;
	
		// scan for horizontal matches
		for (row=1; row < this.boardHeight+1; row++) {
			prevColor = 0; 
			for (col=1; col < this.boardWidth-2; col++) {
				checkColor = this.board[row][col];
				if (checkColor != prevColor) {
					byt1 = shift = 2; // always place current color in 2nd bit. 
					for (i=col+1; i < col+4; i++) {
						color = this.board[row][i];
						if (color == checkColor) {
							byt1 |= 1 << shift;
						}
						shift++;
					}
					if (byt1 > 18) return true; // swappable match found.
					else {	
						// check the next row for possible swapping.
						byt2 = shift = 0;
						for (i=col-1; i < col+3; i++) { // check previous col 1st in next row.
							color = this.board[row+1][i];
							if (color == checkColor) {
								byt2 |= 1 << shift;
							}
							shift++;
						}
						byt1 |= byt2; // check if there is a swappable match. 
						if ((byt1 & 7)==7 || (byt1 & 14)==14) return true; 
					}
				}
				prevColor = checkColor;
			}
		}
		// scan for vertical matches
		for (col=1; col < this.boardWidth+1; col++) {
			prevColor = 0;
			for (row=1; row < this.boardHeight-2; row++) {
				checkColor = this.board[row][col];
				if (checkColor != prevColor) {
					byt1 = shift = 2; // always place current color in 2nd bit. 
					for (i=row+1; i < row+4; i++) {
						color = this.board[i][col];
						if (color == checkColor) {
							byt1 |= 1 << shift;
						}
						shift++;
					}
					if (byt1 > 18) return true; // swappable match found.
					else {	
						// check the next row for possible swapping.
						byt2 = shift = 0;
						for (i=row-1; i < row+3; i++) { // check previous row 1st in next col.
							color = this.board[i][col+1];
							if (color == checkColor) {
								byt2 |= 1 << shift;
							}
							shift++;
						}
						byt1 |= byt2; // check if there is a swappable match. 
						if ((byt1 & 7)==7 || (byt1 & 14)==14) return true; 
					}
				}
				prevColor = checkColor;
			}
		}
		return false;
	};

	window.Bejeweled.prototype.checkAlive = function() {
		if (!this.checkMatch()) {
			alert("No more valid moves, game over!");
			this.gameFlag = 0;
		}
	};

	window.Bejeweled.prototype.start_onclick = function(event) {
		if (this.gameFlag == 1) return;
		this.canvasElement.removeAttribute("class");
		this.gameFlag = 1;
		this.score = 0;
		this.inAnimation = false;
		this.triggerBoardScan("start_onclick");
	};

	window.Bejeweled.prototype.reset_onclick = function(event) {
		if (this.eTimer != null) {
			clearInterval(this.eTimer); 
			this.eTimer = null;
		}
		this.gameFlag = this.score = 0;
		this.inAnimation = false;
		this.generateBoard();
	};

})();

(function(win) {
	this.game = new Bejeweled();
})(window);