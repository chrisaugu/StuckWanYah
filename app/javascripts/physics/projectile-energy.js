var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var canvas_bg = document.getElementById("canvas_bg");
var context_bg = canvas_bg.getContext("2d");

var ball;

var animId;
var graph;
var m = 1; // particle mass
var g = 10; // gravity due to acceleration
var u = 50; // initial velocity
var groundLevel = 350;
var n = 0;
var tA = new Array();
var hA = new Array();
var peA = new Array();
var keA = new Array();
var teA = new Array();

window.onload = init;

function init() {
	ball = new Ball(10, "#000000", m, 0, true);
	ball.pos2D = new Vector2D(50, groundLevel);
	ball.draw(context);
	setupGraph();
	setupArrays();
	animFrame();
};
function setupGraph() {
	// graph = new Graph(context, xmin, xmax, ymin, ymax, xorig, yorig, xwidth, ywidth);
	graph = new Graph(context_bg, 0, 10, 0, 1500, 50, 350, 450, 300);
	graph.drawgrid(1, 0.5, 500, 100);
	graph.drawaxes('t', 'p.e.(red), k.e.(blue), total(black)');
};
function setupArrays() {
	var t;
	var v;

	for (var i=0; i<100; i++) {
		tA[i] = i*0.1;
		t = tA[i];
		v = u - g*t; // v = u + g * t
		hA[i] = u*t - 0.5*g*t*t; // h = u * t + 1/2 * g * t^2
		peA[i] = m*g*hA[i]; // P.E = m * g * h
		keA[i] = 0.5*m*v*v; // K.E = 1/2 * m * v^2
		teA[i] = peA[i] + keA[i];
		// teA[i] = peA[i];
	}
};
function animFrame() {
	setTimeout(function() {
		animId = requestAnimationFrame(animFrame, canvas);
		animate();
	}, 1000/10);
};
function animate() {
	moveObject();
	plotGraph();
	n++;
	if (n==hA.length) {
		stop();
	}
};
function moveObject() {
	ball.y = groundLevel - hA[n];
	context.clearRect(0, 0, canvas.width, canvas.height);
	ball.draw(context);
};
function plotGraph() {
	graph.plot([tA[n]], [peA[n]], "#ff0000", true, false);
	graph.plot([tA[n]], [keA[n]], "#0000ff", true, false);
	graph.plot([tA[n]], [teA[n]], "#000000", true, false);
};
function stop() {
	cancelAnimationFrame(animId);
}