var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var numPoints=1001;
var numGrad=50;
var xRange=6;
var xStep;
var graph = new Graph(context,-4,4,-10,10,275,210,450,350);

// var graph = new Graph(context, -4, 4, 0, 20, 275, 380, 450, 350);
// graph.drawgrid(-16, 6, 5, 16);
// graph.drawaxes('x','y');

// var xvals = new Array(-4,-3,-2,-1,0,1,2,3,4);
// var yvals = new Array(16,9,4,1,0,1,4,9,16);
// graph.plot(xvals, yvals);

var xA = new Array();
var yA = new Array();
for (var i=0; i<=100; i++){
	xA[i] = (i-50)*0.08;
	yA[i] = xA[i]*xA[i];
}
graph.plot(xA, yA, "0xff0000", false, true);

graph.drawgrid(1,0.2,5,1);
graph.drawaxes('x','y');
var xA = new Array();
var yA = new Array();
for (var i=0; i<=100; i++){
	xA[i] = (i-50)*0.08;
	yA[i] = f(xA[i]);
}
graph.plot(xA,yA,'#ff0000',false,true);
function f(x){
	var y;
	y = 2*x + 1;
	return y;
}

graph.drawgrid(1,0.2,2,0.5);
graph.drawaxes('x','y');
var xA = new Array();
var yA = new Array();
// calculate function
xStep = xRange/(numPoints-1);
for (var i=0; i<numPoints; i++){
	xA[i] = (i-numPoints/2)*xStep;
	yA[i] = f(xA[i]);
}
graph.plot(xA,yA,'#ff0000',false,true); // plot function
// calculate gradient function using forward method
var xAr = new Array();
var gradA = new Array();
for (var j=0; j<numPoints-numGrad; j++){
	xAr[j] = xA[j];
	gradA[j] = grad(xA[j],xA[j+numGrad]);
}
graph.plot(xAr,gradA,'#0000ff',false,true); // plot gradient function
function f(x){
	var y;
	y = x*x;
	return y;
}
function grad(x1,x2){
	return (f(x1)-f(x2))/(x1-x2);
}