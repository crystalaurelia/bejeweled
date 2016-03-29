(function() {

	window.Bejeweled = function() {
		this.canvasElement = document.getElementById("gameBoard");
		this.currentScoreElement = document.getElementById("currentScore");
		this.highScoreElement = document.getElementById("highScore");
		this.startElement = document.getElementById("start");
		this.resetElement = document.getElementById("reset");
		this.context = this.canvasElement.getContext("2d");
	
		this.tiles = ["white", "#85D9DA","#D3EAEF", "#C2FBEF", "#AEACC3", "#72711F", "#7DAA92"];
		this.boardWidth = 8;
		this.boardHeight = 8;
		this.board = new Array(this.boardHeight+2); // extra padding for pattern matching
	
		this.size=50;
		this.numberOfColors=6;
		this.picked=0;
		
		this.game_flag = 0; 
		
		this.hiScore = 0;
		this.score;
		
		this.markedX; 
		this.markedY;
		
		this.generateBoard();
		this.startElement.addEventListener("click", this.start_onclick.bind(this));
		this.resetElement.addEventListener("click", this.reset_onclick.bind(this));
	};
	
	window.Bejeweled.prototype.generateBoard = function() {
		this.canvasElement.addEventListener("click", this.canvas_onclick.bind(this));
			
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
		this.updateScore();
	};
	
	window.Bejeweled.prototype.generateRandomColor = function(excludeColor) {
		var color;
		while ((color = Math.floor((Math.random() * this.numberOfColors) + 1)) == excludeColor);
		return color;
	};
	
	window.Bejeweled.prototype.displayBoard = function() {
		var x, y=0;
	
		for (var row=1; row <= this.boardHeight; row++) {
			x = 0;
			for (var col=1; col <= this.boardWidth; col++) {
				this.context.fillStyle = this.tiles[this.board[row][col]];
				this.context.fillRect(x, y, this.size, this.size);
				x += this.size;
			}
			y += this.size;
		}
	};
	
	window.Bejeweled.prototype.updateScore = function() {
		this.currentScoreElement.innerHTML = this.score;
		if (this.score > this.hiScore) {
			this.hiScore = this.score;
		}
		this.highScoreElement.innerHTML = this.hiScore;
	};
	
	window.Bejeweled.prototype.markTile = function(on, selectedX, selectedY) {
		var x = this.size * selectedX;
		var y = this.size * selectedY;
		var len = this.size;
	
		if (on) {
			this.context.fillStyle = this.tiles[0];
			this.context.fillRect(x, y, len, len); //create white square
		
			len = this.size - 8;
			x += 4;
			y += 4;
		}
		this.context.fillStyle = this.tiles[this.board[selectedY+1][selectedX+1]];
		this.context.fillRect(x, y, len, len); //refill inner square
	};
	
	window.Bejeweled.prototype.canvas_onclick = function(event) {
		if (this.game_flag == 0) return;
	
		var color, col1, col2, row1, row2;
		var selectedX = Math.floor((event.clientX + window.scrollX - this.canvasElement.offsetLeft) / this.size);
		var selectedY = Math.floor((event.clientY + window.scrollY  - this.canvasElement.offsetTop) / this.size);
		selectedX = (selectedX >= this.boardWidth) ? this.boardWidth-1 : selectedX;
		selectedY = (selectedY >= this.boardHeight) ? this.boardHeight-1 : selectedY;
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
				else { this.picked = 0;
					col1 = this.markedX+1; row1 = this.markedY + 1; 
					col2 = selectedX + 1; row2 = selectedY + 1;
					color = this.board[row2][col2];
					this.board[row2][col2] = this.board[row1][col1];
					this.board[row1][col1] = color;
					this.markTile(false, selectedX, selectedY);
					this.markTile(false, this.markedX, this.markedY);
					if (!this.scanBoard()) {
						alert("Not a valid swap! No 3+ adjacent tiles formed!");
						this.board[row1][col1] = this.board[row2][col2];
						this.board[row2][col2] = color; 	// swap back those two tiles.
						this.picked = 1;
						this.markTile(false, selectedX, selectedY);
						this.markTile(true, this.markedX, this.markedY);
					}
					else while (this.scanBoard()); // re-scan whenever eliminated block.
					this.checkAlive();
				}
			}
		}
	};
		
	window.Bejeweled.prototype.scanBoard = function() {
		var eFlag = false;
	
		eFlag |= this.scanHboard();
		eFlag |= this.scanVboard();
		return eFlag;
	};
	
	window.Bejeweled.prototype.scanHboard = function() {
		var col, beginIndex, endIndex, color, prevColor;
		var eFlag=false;
	
		for (var row=this.boardHeight; row > 0; row--) {
			prevColor = beginIndex = endIndex = 0;
			col = 1;
			while (col < this.boardWidth+2) {
				color = this.board[row][col];
				if (color == prevColor) {
					endIndex = col;
				}
				else {
					if ((endIndex-beginIndex) > 1) {
						this.eliminateHblock(row, beginIndex, endIndex);
						endIndex = beginIndex = 0; //rest control index values.
						eFlag = true;
					}
					prevColor = color;
					beginIndex = col;
				}
				col++;
			}
		} 
		return eFlag;
	};

	window.Bejeweled.prototype.scanVboard = function() {
		var row, beginIndex, endIndex, color, prevColor;
		var eFlag=false;
	
		for (var col=1; col <= this.boardWidth; col++) {
			prevColor = 0;
			row =  beginIndex = endIndex = this.boardHeight;
			while (row >= 0) {
				color = this.board[row][col];
				if (color == prevColor) {
					endIndex = row;
				}
				else {
					if ((beginIndex-endIndex) > 1) {
						this.eliminateVblock(col, beginIndex, endIndex);
						endIndex = beginIndex = this.boardHeight; //reset control index.
						eFlag = true;
					}
					prevColor = color;
					beginIndex = row;
				}
				row--;
			}

		} 
		return eFlag;
	};
	

	window.Bejeweled.prototype.eliminateHblock = function(row, start, end) {
		var x, y;
		for (var r=row; r > 1; r--) {
			y = this.size * (r-1);
			for (var col=start; col <= end; col++) {
				this.board[r][col] = this.board[r-1][col];
				this.context.fillStyle = this.tiles[this.board[r][col]];
				x = this.size * (col-1);
				setTimeout(this.context.fillRect(x, y, this.size, this.size), 3000);
			}
		}	
		y = 0;	// fill in the top row with new colors.
		for (var col=start; col <= end; col++) {
			this.board[1][col] = this.generateRandomColor(0);
			this.context.fillStyle = this.tiles[this.board[1][col]];
			x = this.size * (col-1);
			this.context.fillRect(x, y, this.size, this.size);
		}
		this.score += end-start+1;
		this.updateScore();
	};

	window.Bejeweled.prototype.eliminateVblock = function(col, start, end) {
		var x, y;	
		x = this.size * (col-1);
		for (var i=0; i <= (start-end); i++) {
			for (var row=start; row > 1; row--) {
				this.board[row][col] = this.board[row-1][col];
				this.context.fillStyle = this.tiles[this.board[row][col]];
				y = this.size * (row-1);
				setTimeout(this.context.fillRect(x, y, this.size, this.size), 3000);
			}
	
			y = 0;	// fill in the top row with new colors.
			this.board[1][col] = this.generateRandomColor(0);
			this.context.fillStyle = this.tiles[this.board[1][col]];
			this.context.fillRect(x, y, this.size, this.size);	
		}
		this.score += start-end+1;
		this.updateScore();
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
			this.game_flag = 0;
		}
	};

	window.Bejeweled.prototype.start_onclick = function() {
		this.game_flag = 1;
		this.score = 0;
		while (this.scanBoard());
		this.checkAlive();
	};

	window.Bejeweled.prototype.reset_onclick = function() {
		this.game_flag = this.score = 0;
		this.generateBoard();
		this.checkAlive();
	};

})();

(function(win) {
	this.game = new Bejeweled();
})(window);
