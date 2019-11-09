import SvgSaver from 'svgsaver';
var svg = d3.select("svg"),
width = +svg.attr("width"),
height = +svg.attr("height"),
g = svg.append("g").attr("transform", "translate(" + (width / 2 + 30) + "," + (height / 2 -60) + ")");


var tree = d3.tree()
.size([360, 450])
.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

d3.csv("data/all.csv", function(error, flatData) {
if (error) throw error;
  // assign null correctly
  flatData.forEach(function (d) {
    if (d.parent == "null") { d.parent = null };
});


var stratify = d3.stratify()
    .id(function (d) { return d.name; })
    .parentId(function (d) { return d.parent; })

var root = tree(stratify(flatData));

var link = g.selectAll(".link")
.data(root.descendants().slice(1))
.enter().append("path")
  .attr("class", "link")
  .attr("d", function(d) {
    return "M" + project(d.x, d.y)
        + "C" + project(d.x, (d.y + d.parent.y) / 2)
        + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
        + " " + project(d.parent.x, d.parent.y);
  });

var node = g.selectAll(".node")
.data(root.descendants())
.enter().append("g")
  .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
  .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

node.append("circle")
  .attr("r", 2.5);

node.append("text")
  .attr("dy", ".31em")
  .attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
  .style("text-anchor", function(d) { return d.x < 180 === !d.children ? "start" : "end"; })
  .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
  .text(function(d) { 
      console.log(d.data.title);
    //   console.log(d.id.substring(d.id.lastIndexOf(".") + 1));
      return d.id.substring(d.id.lastIndexOf(".") + 1) + ": " + d.data.title; 
    });
});

function project(x, y) {
var angle = (x - 90) / 180 * Math.PI, radius = y;
return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

var svgsaver = new SvgSaver();
var html = d3.select("svg").on('click',function() {
    svgsaver.asSvg(this, "epicyclicGearing.svg");
  });
