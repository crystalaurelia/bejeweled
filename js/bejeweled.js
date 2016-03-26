var bejeweled = (function() {
    "use strict";

	var canvasElement = document.getElementById("gameBoard");
	var currentScoreElement = document.getElementById("currentScore");
	var highScoreElement = document.getElementById("highScore");
	var context = canvasElement.getContext("2d");
	
	var tiles = ["white", "#85D9DA","#D3EAEF", "#C2FBEF", "#AEACC3", "#72711F", "#7DAA92"];
	var boardWidth = 8;
	var boardHeight = 8;
	var board = new Array(boardHeight+2); // extra padding for pattern matching
	
	var size=50, numberOfColors=6, picked=0;
	var game_flag = 0, hiScore = 0, score;
	var markedX, markedY;
	
	generateBoard();
	//alert('Please click the "Start" button to start game.');
	
	function markTile(on, selectedX, selectedY) {
		var x = size * selectedX;
		var y = size * selectedY;
		var len = size;
	
		if (on) {
			context.fillStyle = tiles[0];
			context.fillRect(x, y, len, len); //create white square
		
			len = size - 8;
			x += 4;
			y += 4;
		}
		context.fillStyle = tiles[board[selectedY+1][selectedX+1]];
		context.fillRect(x, y, len, len); //refill inner square
	}

	function pickTile(event) {
		if (game_flag == 0) return;
	
		var color, col1, col2, row1, row2;
		var selectedX = Math.floor((event.clientX - canvasElement.offsetLeft) / size);
		var selectedY = Math.floor((event.clientY - canvasElement.offsetTop) / size);
		selectedX = (selectedX >= boardWidth) ? boardWidth-1 : selectedX;
		selectedY = (selectedY >= boardHeight) ? boardHeight-1 : selectedY;
		picked++;
		if (picked == 1) {
			markedX = selectedX; 
			markedY = selectedY; 
			markTile(true, selectedX, selectedY);
		}
		if (picked == 2) {
			if (selectedX == markedX && selectedY == markedY) { 				
				picked = 0;
				markTile(false, selectedX, selectedY); //unmark the previously picked tile
			}
			else {
				if (selectedX < markedX-1 || selectedX > markedX+1 || selectedY < markedY-1 || selectedY > markedY+1 || 
				(selectedX == markedX-1 && selectedY == markedY-1) || (selectedX == markedX+1 && selectedY == markedY+1)  ||
				(selectedX == markedX-1 && selectedY == markedY+1) || (selectedX == markedX+1 && selectedY == markedY-1)) {
					picked = 1;
					alert("Not valid! Pick horizontally or vertically adjacent tile!");
				}
				else { picked = 0;
					col1 = markedX+1; row1 = markedY + 1; 
					col2 = selectedX + 1; row2 = selectedY + 1;
					color = board[row2][col2];
					board[row2][col2] = board[row1][col1];
					board[row1][col1] = color;
					markTile(false, selectedX, selectedY);
					markTile(false, markedX, markedY);
					if (!scanBoard()) {
						alert("Not a valid swap! No 3+ adjacent tiles formed!");
						board[row1][col1] = board[row2][col2];
						board[row2][col2] = color; 	// swap back those two tiles.
						picked = 1;
						markTile(false, selectedX, selectedY);
						markTile(true, markedX, markedY);
					}
					else while (scanBoard()); // re-scan whenever eliminated block.
					checkAlive();
				}
			}
		}
	}
	
	function generateRandomColor(excludeColor) {
		var color;
		while ((color = Math.floor((Math.random() * numberOfColors) + 1)) == excludeColor);
		return color;
	}

	function displayBoard() {
		var x, y=0;
	
		for (var row=1; row <= boardHeight; row++) {
			x = 0;
			for (var col=1; col <= boardWidth; col++) {
				context.fillStyle = tiles[board[row][col]];
				context.fillRect(x, y, size, size);
				x += size;
			}
			y += size;
		}
	}

	function updateScore() {
		currentScoreElement.innerHTML = score;
		if (score > hiScore) {
			hiScore = score;
		}
		highScoreElement.innerHTML = hiScore;
	}

	function generateBoard() {
		for (var row=0; row < boardHeight+2; row++) {
			board[row] = new Array(boardWidth+2);
			if (row == 0 || row == boardHeight+1) {
				for (var col=0; col < boardWidth+2; col++)
					board[row][col] = 0; // extra 2 rows for matching padding.
			}
			else {
				for (var col=1; col < boardWidth+1; col++) {
					board[row][col] = generateRandomColor(0);  
				}
				board[row][0] = board[row][col] = 0; // extra 2 columns for matching padding.
			}
		} 
		score = 0;
		displayBoard();
		updateScore();
	}

	function eliminateHblock(row, start, end) {
		var x, y;
		for (var r=row; r > 1; r--) {
			y = size * (r-1);
			for (var col=start; col <= end; col++) {
				board[r][col] = board[r-1][col];
				context.fillStyle = tiles[board[r][col]];
				x = size * (col-1);
				setTimeout(context.fillRect(x, y, size, size), 3000);
			}
		}	
		y = 0;	// fill in the top row with new colors.
		for (var col=start; col <= end; col++) {
			board[1][col] = generateRandomColor(0);
			context.fillStyle = tiles[board[1][col]];
			x = size * (col-1);
			context.fillRect(x, y, size, size);
		}
		score += end-start+1;
		updateScore();
	}

	function eliminateVblock(col, start, end) {
		var x, y;	
		x = size * (col-1);
		for (var i=0; i <= (start-end); i++) {
			for (var row=start; row > 1; row--) {
				board[row][col] = board[row-1][col];
				context.fillStyle = tiles[board[row][col]];
				y = size * (row-1);
				setTimeout(context.fillRect(x, y, size, size), 3000);
			}
	
			y = 0;	// fill in the top row with new colors.
			board[1][col] = generateRandomColor(0);
			context.fillStyle = tiles[board[1][col]];
			context.fillRect(x, y, size, size);	
		}
		score += start-end+1;
		updateScore();
	}

	function scanHboard() {
		var col, beginIndex, endIndex, color, prevColor;
		var eFlag=false;
	
		for (var row=boardHeight; row > 0; row--) {
			prevColor = beginIndex = endIndex = 0;
			col = 1;
			while (col < boardWidth+2) {
				color = board[row][col];
				if (color == prevColor) {
					endIndex = col;
				}
				else {
					if ((endIndex-beginIndex) > 1) {
						eliminateHblock(row, beginIndex, endIndex);
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
	}

	function scanVboard() {
		var row, beginIndex, endIndex, color, prevColor;
		var eFlag=false;
	
		for (var col=1; col <= boardWidth; col++) {
			prevColor = 0;
			row =  beginIndex = endIndex = boardHeight;
			while (row >= 0) {
				color = board[row][col];
				if (color == prevColor) {
					endIndex = row;
				}
				else {
					if ((beginIndex-endIndex) > 1) {
						eliminateVblock(col, beginIndex, endIndex);
						endIndex = beginIndex = boardHeight; //reset control index.
						eFlag = true;
					}
					prevColor = color;
					beginIndex = row;
				}
				row--;
			}

		} 
		return eFlag;
	}

	function scanBoard() {
		var eFlag = false;
	
		eFlag |= scanHboard();
		eFlag |= scanVboard();
		return eFlag;
	}

	function checkMatch() {
		var color, prevColor, checkColor;
		var row, col, i;
		var byt1, byt2, shift;
	
		// scan for horizontal matches
		for (row=1; row < boardHeight+1; row++) {
			prevColor = 0; 
			for (col=1; col < boardWidth-2; col++) {
				checkColor = board[row][col];
				if (checkColor != prevColor) {
					byt1 = shift = 2; // always place current color in 2nd bit. 
					for (i=col+1; i < col+4; i++) {
						color = board[row][i];
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
							color = board[row+1][i];
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
		for (col=1; col < boardWidth+1; col++) {
			prevColor = 0;
			for (row=1; row < boardHeight-2; row++) {
				checkColor = board[row][col];
				if (checkColor != prevColor) {
					byt1 = shift = 2; // always place current color in 2nd bit. 
					for (i=row+1; i < row+4; i++) {
						color = board[i][col];
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
							color = board[i][col+1];
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
	}

	function checkAlive() {
		if (!checkMatch()) {
			alert("No more valid move, game over!");
			game_flag = 0;
		}
	}

	function startGame() {
		game_flag = 1;
		score = 0;
		while (scanBoard());
		checkAlive();
	}

	function resetGame() {
		game_flag = score = 0;
		generateBoard();
		checkAlive();
	}

	return {
		startGame: startGame,
		resetGame: resetGame,
		pickTile: pickTile
	}

})();
