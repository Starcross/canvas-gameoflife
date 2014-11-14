/** Conway's Game of Life - HTML5 Canvas and Javascript Demo
    Alex Luton - aluton@gmail.com
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

// Initialise cell array and populate randomly
function initialiseCells() {
    for (x=-1; x < matrix_size + 1; x++) {
        cell[x] = []; // Initialise next dimension
        for (y=-1; y < matrix_size + 1; y++) {
            if (x < 0 || y < 0 || x == matrix_size || y == matrix_size)
                cell[x][y] = new cellUnit(0); // Buffer of empty cells around the perimeter
            else
                cell[x][y] = new cellUnit(Math.round(Math.random()));
            cell[x][y].setColor();
        }
    }
}

// Set approx frame rate
function updateInterval(speed) {
    interval_rate = 1000/speed.value;
    // Update frame according to interval in ms
    clearInterval(intervalID);
    intervalID = setInterval(function(){drawCells()},interval_rate);
}

function drawCells() {

    for (x=0; x < matrix_size; x++) {
        for (y=0; y < matrix_size; y++) {
            var x_pos = (x * cell_size) + (x * margin);
            var y_pos = (y * cell_size) + (y * margin);
            // Calculate number of neighbours and set next cell status and colour for next frame
            var neighbours = cell[x-1][y-1].status + cell[x][y-1].status + cell[x+1][y-1].status
                            + cell[x-1][y].status + cell[x+1][y].status
                            + cell[y+1][x-1].status + cell[y+1][x].status + cell[y+1][x+1].status;
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
            ctx.fillStyle = cell[x][y].color;
            ctx.fillRect(x_pos, y_pos, cell_size, cell_size);
        }
    }

    // update the frame
    for (x=0; x < matrix_size; x++) {
        for (y=0; y < matrix_size; y++) {
            cell[x][y].status = cell[x][y].status_next;
            cell[x][y].setColor();
        }
    }

}

speed = document.getElementById("speed");
randomise = document.getElementById("randomise");
var intervalID = 0;
initialiseCells();
updateInterval(speed);
speed.addEventListener('input', function(){ updateInterval(this); }, false);
randomise.addEventListener('click', initialiseCells, false);

