function Graph(g, coords) {
    this.g = g;
    this.coords = coords;
    var xClr = 0x4444ff;
    var yClr = 0xff4444;
    this.xLinesQ = true;
    this.yLinesQ = true;
    this.xArrowQ = true;
    this.yArrowQ = true;
    this.xValsQ = true;
    this.yValsQ = true;
    this.skewQ = false;
}
function Graph(context, xmin, xmax, ymin, ymax, x0, y0, xwidth, ywidth) {
	this.x;
	this.y;
	this.context = context;
	this.xmin = xmin;
	this.xmax = xmax;
	this.ymin = ymin;
	this.ymax = ymax;
	this.x0 = x0;
	this.y0 = y0;
	this.xwidth = xwidth;
	this.ywidth = ywidth;

	this.drawgrid = function(xmajor, xminor, ymajor, yminor) {
        var c = document.getElementById('grid-canvas');
        var ctx = c.getContext('2d');
        var w = this.xwidth
          , h = this.ywidth;
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < w / xminor; i++) {
            if (i * xminor % xmajor == 0) {
                ctx.fillStyle = 'black';
                ctx.strokeStyle = 'black';
                ctx.fillText(i * xminor, i * xminor, h - 10);
            } else
                ctx.strokeStyle = 'rgba(0,0,0,.3)';
            ctx.beginPath();
            ctx.moveTo(i * xminor, 0);
            ctx.lineTo(i * xminor, h);
            ctx.stroke();
        }
        for (var i = 0; i < h / yminor; i++) {
            ctx.beginPath();
            if (i * yminor % ymajor == 0) {
                ctx.fillStyle = 'black';
                ctx.strokeStyle = 'black';
                ctx.fillText(i * yminor, 0, h - i * yminor);
            } else
                ctx.strokeStyle = 'rgba(0,0,0,.3)';
            ctx.moveTo(0, i * yminor);
            ctx.lineTo(w, i * yminor);
            ctx.stroke();
        }
    };
	this.drawaxes = function(xlabel, ylabel) {
		console.log(xlabel + " " + ylabel);
		context.font = this.width + "" + this.height;
		context.fillStyle = "rgb(000)";
		context.fillText(xlabel, -this.x, 0);
		context.fillText(ylabel, 0, -this.y);
	}
	this.plot = function(x, y, color, dots, line) {
		context.fillStyle = color;
		for (var i = 0; i < x.length; i++) {
			x[i]
			for (var j = 0; j < y.length; j++) {
				y[j]
			}
		}
		if (line)
			context.lineTo(x, y);
		if (dots)
            context.fillStyle = color;
            context.fillRect(this.x, this.y, this.width, this.height);
			context.arc(x, y, radius, startAngle, endAngle, false);
	};
};

Graph.prototype.drawGraph = function() {
    if (coords.xLogQ) {
        this.drawLinesLogX();
    } else {
        if (this.xLinesQ) {
            this.drawLinesX();
        }
    }
    if (coords.yLogQ) {
        this.drawLinesLogY();
    } else {
        if (this.yLinesQ) {
            this.drawLinesY();
        }
    }
    if (!this.skewQ) {
        g.beginPath();
        g.lineWidth = 1;
        g.strokeStyle = "#000000";
        g.rect(coords.left, coords.top, coords.width, coords.height);
        g.stroke();
        g.closePath();
    }
}
Graph.prototype.drawLinesX = function() {
    var xAxisPos = coords.toYPix(0);
    var yAxisPos = coords.toXPix(0);
    var numAtAxisQ = (yAxisPos >= 0 && yAxisPos < coords.width);
    var g = this.g;
    g.lineWidth = 1;
    var ticks = coords.getTicks(coords.xStt, coords.xEnd - coords.xStt);
    for (var i = 0; i < ticks.length; i++) {
        var tick = ticks[i];
        var xVal = tick[0];
        var tickLevel = tick[1];
        if (tickLevel == 0) {
            g.strokeStyle = "rgba(0,0,256,0.3)";
        } else {
            g.strokeStyle = "rgba(0,0,256,0.1)";
        }
        var xPix = coords.toXPix(xVal, false);
        g.beginPath();
        g.moveTo(xPix, coords.toYPix(coords.yStt, false));
        g.lineTo(xPix, coords.toYPix(coords.yEnd, false));
        g.stroke();
        if (tickLevel == 0 && this.xValsQ) {
            g.fillStyle = "#0000ff"
            g.font = "bold 12px Verdana";
            g.textAlign = "center";
            var lbly = 0;
            if (numAtAxisQ && xAxisPos > 0 && xAxisPos < coords.height) {
                lbly = xAxisPos + 15;
            } else {
                lbly = coords.height - 20;
            }
            g.fillText(fmt(xVal), xPix, xAxisPos + 15);
        }
    }
    if (this.skewQ)
        return;
    if (yAxisPos >= 0 && yAxisPos < coords.width) {
        g.lineWidth = 2;
        g.strokeStyle = "#ff0000";
        g.beginPath();
        g.moveTo(yAxisPos, coords.toYPix(coords.yStt, false));
        g.lineTo(yAxisPos, coords.toYPix(coords.yEnd, false));
        g.stroke();
    }
}
Graph.prototype.drawLinesY = function() {
    var xAxisPos = coords.toYPix(0);
    var yAxisPos = coords.toXPix(0);
    var numAtAxisQ = (xAxisPos >= 0 && xAxisPos < coords.height);
    var g = this.g;
    g.lineWidth = 1;
    var ticks = coords.getTicks(coords.yStt, coords.yEnd - coords.yStt);
    for (var i = 0; i < ticks.length; i++) {
        var tick = ticks[i];
        var yVal = tick[0];
        var tickLevel = tick[1];
        if (tickLevel == 0) {
            g.strokeStyle = "rgba(0,0,256,0.3)";
        } else {
            g.strokeStyle = "rgba(0,0,256,0.1)";
        }
        var yPix = coords.toYPix(yVal, false);
        g.beginPath();
        g.moveTo(coords.toXPix(coords.xStt, false), yPix);
        g.lineTo(coords.toXPix(coords.xEnd, false), yPix);
        g.stroke();
        if (tickLevel == 0 && this.yValsQ) {
            g.fillStyle = "#ff0000"
            g.font = "bold 12px Verdana";
            g.textAlign = "right";
            g.fillText(fmt(yVal), yAxisPos - 5, yPix + 5);
        }
    }
    if (this.skewQ)
        return;
    if (xAxisPos >= 0 && xAxisPos < coords.height) {
        g.lineWidth = 2;
        g.strokeStyle = "#0000ff";
        g.beginPath();
        g.moveTo(coords.toXPix(coords.xStt, false), xAxisPos);
        g.lineTo(coords.toXPix(coords.xEnd, false), xAxisPos);
        g.stroke();
    }
};