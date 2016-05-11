/** Conway's Game of Life - HTML5 Canvas and Javascript Demo
    Alex Luton - http://starcross.eu
*/


var canvas = document.getElementById("gameoflife");
canvas.setAttribute('width',canvas.clientWidth);
canvas.setAttribute('height',canvas.clientHeight);
var ctx = canvas.getContext("2d");
var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

var cell_color = {born : '#006652',
	              living : '#258800',
	              dying_under : '#9f8500',
	              dying_over : '#9f6300',
	              dead:'#000'}; // Colours for each cell
var matrix_size = 100; // Number of cells
var margin = 1; // Margin between cells
var cell_size = Math.floor(canvas.width / matrix_size) - margin; // Calculate cell size for drawing
var cell = [];


// Store the status and colour of a cell for quick reference
function cellUnit(status) {
    this.status = status; // 1 for living 0 for dead
    this.status_next = status; // The status be in the next frame

    this.setColor = function(){
     if (this.status == 1)
            this.color = cell_color.living;
        else
            this.color = cell_color.dead;
    }
}

// Initialise cell array, optionally random 
function initialiseCells(random) {
    for (x=-1; x < matrix_size + 1; x++) {
        cell[x] = []; // Initialise next dimension
        for (y=-1; y < matrix_size + 1; y++) {
            if (x < 0 || y < 0 || x == matrix_size || y == matrix_size)
                cell[x][y] = new cellUnit(0); // Buffer of empty cells around the perimeter
            else
                cell[x][y] = random && new cellUnit(Math.round(Math.random())) || new cellUnit(0);
            cell[x][y].setColor();
        }
    }
}

function setBuffer() {
	
	for (n=0; n < matrix_size; n++) {
		cell[-1][n].status = wrap && cell[matrix_size-1][n].status || 0; 
		cell[matrix_size][n].status = wrap && cell[0][n].status || 0; 
		cell[n][-1].status = wrap && cell[n][matrix_size-1].status || 0;
		cell[n][matrix_size].status = wrap && cell[n][0].status || 0;
	}

}

// Set approx frame rate
function updateInterval(speed) {
    interval_rate = 1000/speed;
    // Update frame according to interval in ms
    clearInterval(intervalID);
    intervalID = setInterval(function(){drawCells()},interval_rate);
}

function drawCells() {

    for (x=0; x < matrix_size; x++) {
        for (y=0; y < matrix_size; y++) {

			cell[x][y].setColor();

            // Calculate number of neighbours and set next cell status and colour for next frame
            var neighbours = cell[x-1][y-1].status + cell[x][y-1].status + cell[x+1][y-1].status
                            + cell[x-1][y].status + cell[x+1][y].status
                            + cell[x-1][y+1].status + cell[x][y+1].status + cell[x+1][y+1].status;
            if (cell[x][y].status == 1 && (neighbours < 2 || neighbours > 3)) {
                cell[x][y].status_next = 0;
                if (neighbours < 2)
                    cell[x][y].color = cell_color.dying_under;
                else
                    cell[x][y].color = cell_color.dying_over;
            } else if (cell[x][y].status == 0 && neighbours == 3) {
                cell[x][y].status_next = 1;
                cell[x][y].color = cell_color.born;
            }
            
			// Draw cell on canvas
			drawCell(x, y, cell[x][y].color);
        }
    }

    // update the frame
    for (x=0; x < matrix_size; x++) {
        for (y=0; y < matrix_size; y++) {
            cell[x][y].status = cell[x][y].status_next;           
        }
    }

    setBuffer();

	// Overlay any brush
	drawBrush(true, false);

}

// Move the brush on canvas on mouse move event
function moveBrush(e) {

	// Get mouse position relative to canvas
	var rect = canvas.getBoundingClientRect();
	var mouseX = e.clientX - rect.left;
	var mouseY = e.clientY - rect.top;

	var cursorX = Math.floor(mouseX / (cell_size + margin));
	var cursorY = Math.floor(mouseY / (cell_size + margin));

	// Offset to the centre of the brush
    cursorX -= Math.floor(brush[0].length / 2);
    cursorY -= Math.floor(brush.length / 2);

	if ((cursorX == drawBrush.x) && (cursorY == drawBrush.y))
		return; // Position has not changed so do nothing 

	// If the user is dragging with the mouse down, print the brush
	if (e.buttons == 1)
		var paint = true;
	else 
		var paint = false;

	// If the cursor is inside the canvas move it
	if ((0 <= cursorX && cursorX < matrix_size ) && 
	    (0 <= cursorY && cursorY < matrix_size )) {
		if (!paint)
			drawBrush(false, false); // Repaint original cell color, unless dragging
		brushCursor = {
			x : cursorX,
			y : cursorY,
			show: true
		};
		drawBrush(true, paint); // Paint new brush

	} else {
		brushCursor.show = false;
	}
}

function drawBrush(fill, print) {
	if (!brushCursor.show) return;	
	for (x=0; x < brush[0].length; x++) { // Assume the first line is the correct width
		for (y=0; y < brush.length; y++) {
			if (brush[y][x]) { // Is this a filled cell for the brush
				var offsetX = brushCursor.x + x; 
				var offsetY = brushCursor.y + y;
				// If the canvas wraps do the same to the brush
				if (wrap) {
					offsetX %= matrix_size;
					offsetY %= matrix_size;
				}
				// In case we are not wrapping clip the edges of the brush
				if ((0 <= offsetX && offsetX < matrix_size) && (0 <= offsetY && offsetY < matrix_size)) {
					// Either draw original or new cell
					var color = fill && cell_color.born || cell[offsetX][offsetY].color; 
					drawCell(offsetX, offsetY, color); 

					if (print) { // Add this as an actual cell?
						cell[offsetX][offsetY].status = 1;
						cell[offsetX][offsetY].status_next = 1;
						cell[offsetX][offsetY].setColor();
					}
				}
			}
		}
	}
}

function rotateBrush() {

	/**for (x = 0; x < brush.length; x++) { // Reverse
		brush[x] = brush[x].reverse();
	}
	for (y = 0; y < brush.length; y++) { // Transpose
		for (x = 0; x < y; x++) {
			var newCell = brush[x][y]
			brush[x][y] = brush[y][x];
			brush[y][x] = newCell;
		}
	}*/

	var newBrush = new Array();



	for (x = 0; x < brush[0].length; x++) {
		newBrush.push(new Array());
			for (y = 0; y < brush.length; y++) { 	
			newBrush[x].push(brush[y][x]);
		}
	}
	
	for (x = 0; x < newBrush.length; x++) { // Reverse
		newBrush[x] = newBrush[x].reverse();
	}

	brush = newBrush;

}

// Draw cell on canvas
function drawCell(cell_x, cell_y, color) {
	// Calculate position in pixels
	var x_pos = (cell_x * cell_size) + (cell_x * margin);
	var y_pos = (cell_y * cell_size) + (cell_y * margin);
	// Draw rectangle on canvas
    ctx.fillStyle = color;
    ctx.fillRect(x_pos, y_pos, cell_size, cell_size);
}

// Initialise controls and start life
document.addEventListener("DOMContentLoaded", function() {

	speedRange = document.getElementById("speed");
	playButton = document.getElementById("play");
	var randomiseButton = document.getElementById("randomise");
	var blankButton = document.getElementById("blank");
	var wrapBox = document.getElementById("wrap");
	wrap = wrapBox.checked;
	var brushSelect = document.getElementById("brush");

	intervalID = 0;
	
	brushCursor = {
		x : 0,
		y : 0,
		show : false
	};

	brush = brushes['Glider'];

	for (b in brushes) {
		var option = document.createElement('option');
		option.value = option.text = b;
		brushSelect.add(option);
	}


	initialiseCells(false); // Initially Blank
	updateInterval(speedRange.value);
	
	// Event listeners for controls
	speedRange.addEventListener('input', function() { 
		if (playButton.value=='Pause') // No way to find if the interval is set
			updateInterval(speedRange.value); 
	}, false);

	playButton.addEventListener('click', function() { // Play and pause button
		if (playButton.value=='Play') {
			updateInterval(speedRange.value);
			playButton.value = 'Pause';
		} else if (playButton.value=='Pause') {
			clearInterval(intervalID);
			playButton.value = 'Play';
		}
	}, false);
	
	randomiseButton.addEventListener('click', function() {
		initialiseCells(true);
		drawCells();
	}, false);
	blankButton.addEventListener('click', function() {
		initialiseCells(false);
		drawCells();
	}, false);
	
	wrapBox.addEventListener('change',function(){ wrap = wrapBox.checked; });

	brushSelect.addEventListener('change',function(){ 
		brush = brushes[brushSelect.value];
	});

	// Event listener for mouse brush
	window.addEventListener('mousemove', moveBrush, false);
	
	// Event listener for brush print
	canvas.addEventListener('mousedown', function(e) { 
		switch (e.button) {
			case 0: // Left button
				drawBrush(true, true);
				break;
			case 2: // Right button
				rotateBrush();
				break;
		}
			
	}, false);

	// Event listener for mouse brush
	canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); }, false);

});


