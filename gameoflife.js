/** Conway's Game of Life - HTML5 Canvas and Javascript Demo
    Alex Luton - https://starcross.dev
*/


/** Colours for each cell */
const cell_color = {
	born : '#006652',
	living : '#258800',
	dying_under : '#9f8500',
	dying_over : '#9f6300',
	dead:'#000'
};


/** Store the status and colour of a cell for quick reference */
class CellUnit {

	constructor(status) {
		this.status = status; // 1 for living 0 for dead
    	this.status_next = status; // The status in the next frame
		this.setColor()
	}

    setColor() {
		if (this.status === 1)
			this.color = cell_color.living;
		else
			this.color = cell_color.dead;
    }
}


/* Canvas with button controls */
class LifeCanvas {

	constructor() {
		this.canvas = document.getElementById("gameoflife");
		this.canvas.setAttribute('width', this.canvas.clientWidth);
		this.canvas.setAttribute('height', this.canvas.clientHeight);
		this.ctx = this.canvas.getContext("2d");

		this.matrix_size = 100; // Number of cells
		this.margin = 1; // this.margin between cells
		this.cell_size = Math.floor(this.canvas.width / this.matrix_size) - this.margin; // Calculate cell size for drawing
		this.cell = [];
		
		this.wrap = true
		this.brushCursor = {}
		this.brush = brushes['Glider'];
	}

	/** Initialise cell array, optionally random */
	initialiseCells(random) {
		
		const cell = this.cell, matrix_size = this.matrix_size
		
		for (let x=-1; x < matrix_size + 1; x++) {
			cell[x] = []; // Initialise next dimension
			for (let y=-1; y < matrix_size + 1; y++) {
				if (x < 0 || y < 0 || x === matrix_size || y === matrix_size)
					cell[x][y] = new CellUnit(0); // Buffer of empty cells around the perimeter
				else
					cell[x][y] = random ? new CellUnit(Math.round(Math.random())) : new CellUnit(0);
				cell[x][y].setColor();
			}
		}
	}

	setBuffer() {

		const cell = this.cell, matrix_size = this.matrix_size
		
		for (let n=0; n < matrix_size; n++) {
			cell[-1][n].status = this.wrap && cell[matrix_size-1][n].status || 0;
			cell[matrix_size][n].status = this.wrap && cell[0][n].status || 0;
			cell[n][-1].status = this.wrap && cell[n][matrix_size-1].status || 0;
			cell[n][matrix_size].status = this.wrap && cell[n][0].status || 0;
		}

	}

	/** Set approx frame rate */
	updateInterval(speed) {
		const interval_rate = 1000/speed;
		// Update frame according to interval in ms
		clearInterval(this.drawTimer);
		this.drawTimer = setInterval(() => {this.drawCells()}, interval_rate);
	}

	/** Calculate and draw all cells for the current frame */
	drawCells() {

		const cell = this.cell

		for (let x=0; x < this.matrix_size; x++) {
			for (let y=0; y < this.matrix_size; y++) {

				cell[x][y].setColor();

				// Calculate number of neighbours and set next cell status and colour for next frame
				const neighbours = cell[x-1][y-1].status + cell[x][y-1].status + cell[x+1][y-1].status
								+ cell[x-1][y].status + cell[x+1][y].status
								+ cell[x-1][y+1].status + cell[x][y+1].status + cell[x+1][y+1].status;
				if (cell[x][y].status === 1 && (neighbours < 2 || neighbours > 3)) {
					cell[x][y].status_next = 0;
					if (neighbours < 2)
						cell[x][y].color = cell_color.dying_under;
					else
						cell[x][y].color = cell_color.dying_over;
				} else if (cell[x][y].status === 0 && neighbours === 3) {
					cell[x][y].status_next = 1;
					cell[x][y].color = cell_color.born;
				}

				// Draw cell on canvas
				this.drawCell(x, y, cell[x][y].color);
			}
		}

		// update the frame
		for (let x=0; x < this.matrix_size; x++) {
			for (let y=0; y < this.matrix_size; y++) {
				cell[x][y].status = cell[x][y].status_next;
			}
		}

		this.setBuffer();

		// Overlay any brush
		this.drawBrush(true, false);

	}

	/** Move the brush on canvas on mouse move event */
	moveBrush(e) {

		// Get mouse position relative to canvas
		const rect = this.canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		let cursorX = Math.floor(mouseX / (this.cell_size + this.margin));
		let cursorY = Math.floor(mouseY / (this.cell_size + this.margin));

		// Offset to the centre of the brush
		cursorX -= Math.floor(this.brush[0].length / 2);
		cursorY -= Math.floor(this.brush.length / 2);

		if ((cursorX === this.brushCursor.x) && (cursorY === this.brushCursor.y))
			return; // Position has not changed so do nothing

		// If the user is dragging with the mouse down, print the brush
		const paint = (e.buttons === 1);

		// If the cursor is inside the canvas move it
		if ((0 <= cursorX && cursorX < this.matrix_size ) &&
			(0 <= cursorY && cursorY < this.matrix_size )) {
			if (!paint)
				this.drawBrush(false, false); // Repaint original cell color, unless dragging
			this.brushCursor = {
				x : cursorX,
				y : cursorY,
				show: true
			};
			this.drawBrush(true, paint); // Paint new brush

		} else {
			this.brushCursor.show = false;
		}
	}

	drawBrush(fill, print) {

		const brush = this.brush, brushCursor = this.brushCursor, cell = this.cell

		if (!brushCursor.show) return;
		for (let x=0; x < brush[0].length; x++) { // Assume the first line is the correct width
			for (let y=0; y < brush.length; y++) {
				if (brush[y][x]) { // Is this a filled cell for the brush
					let offsetX = brushCursor.x + x;
					let offsetY = brushCursor.y + y;
					// If the canvas wraps do the same to the brush
					if (this.wrap) {
						offsetX %= this.matrix_size;
						offsetY %= this.matrix_size;
					}
					// In case we are not this.wrapping clip the edges of the brush
					if ((0 <= offsetX && offsetX < this.matrix_size) && (0 <= offsetY && offsetY < this.matrix_size)) {
						// Either draw original or new cell
						const color = fill && cell_color.born || cell[offsetX][offsetY].color;
						this.drawCell(offsetX, offsetY, color);

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

	/** Rotate selected brush clockwise 90 degrees */
	rotateBrush() {

		const brush = this.brush
		let newBrush = [];

		for (let x = 0; x < brush[0].length; x++) {
			newBrush.push([]);
				for (let y = 0; y < brush.length; y++) {
				newBrush[x].push(brush[y][x]);
			}
		}

		for (let x = 0; x < newBrush.length; x++) { // Reverse
			newBrush[x] = newBrush[x].reverse();
		}

		this.brush = newBrush;

	}

	/** Draw cell on the canvas */
	drawCell(cell_x, cell_y, color) {
		// Calculate position in pixels
		const x_pos = (cell_x * this.cell_size) + (cell_x * this.margin);
		const y_pos = (cell_y * this.cell_size) + (cell_y * this.margin);
		// Draw rectangle on canvas
		this.ctx.fillStyle = color;
		this.ctx.fillRect(x_pos, y_pos, this.cell_size, this.cell_size);
	}

	/** Initialise controls and begin life simulation */
	start() {

		const speedRange = document.getElementById("speed");
		const playButton = document.getElementById("play");
		const randomiseButton = document.getElementById("randomise");
		const blankButton = document.getElementById("blank");
		const wrapBox = document.getElementById("wrap");
		this.wrap =  wrapBox.checked;
		const brushSelect = document.getElementById("brush");

		this.drawTimer = 0;

		this.brushCursor = {
			x : 0,
			y : 0,
			show : false
		};

		for (const b in brushes) {
			const option = document.createElement('option');
			option.value = option.text = b;
			brushSelect.add(option);
		}

		this.initialiseCells(false); // Initially Blank
		this.updateInterval(speedRange.value);

		// Event listeners for controls
		speedRange.addEventListener('input', () => {
			if (playButton.value==='Pause') // No way to find if the interval is set
				this.updateInterval(speedRange.value);
		}, false);

		playButton.addEventListener('click', () => { // Play and pause button
			if (playButton.value==='Play') {
				this.updateInterval(speedRange.value);
				playButton.value = 'Pause';
			} else if (playButton.value==='Pause') {
				clearInterval(this.drawTimer);
				playButton.value = 'Play';
			}
		}, false);

		randomiseButton.addEventListener('click', () => {
			this.initialiseCells(true);
			this.drawCells();
		}, false);
		blankButton.addEventListener('click', () => {
			this.initialiseCells(false);
			this.drawCells();
		}, false);

		wrapBox.addEventListener('change',() => { this.wrap = wrapBox.checked; });

		brushSelect.addEventListener('change',() => {
			this.brush = brushes[brushSelect.value];
		});

		// Event listener for mouse brush
		window.addEventListener('mousemove', (e) => {this.moveBrush(e)}, false);

		// Event listener for brush print
		this.canvas.addEventListener('mousedown', (e) => {
			switch (e.button) {
				case 0: // Left button
					this.drawBrush(true, true);
					break;
				case 2: // Right button
					this.rotateBrush();
					break;
			}

		}, false);

		// Event listener for mouse brush
		this.canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); }, false);

	}

}

const lifeCanvas = new LifeCanvas()
document.addEventListener("DOMContentLoaded", () => {
	lifeCanvas.start()
});


