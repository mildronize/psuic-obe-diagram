import "./styles.scss";
import URLSearchParams from '@ungap/url-search-params';
import { saveAs } from 'file-saver';
import SvgSaver from 'svgsaver';

// import * as textwrap from 'd3-textwrap';


const urlParams = new URLSearchParams(window.location.search)
const PLO = urlParams.has('plo') ? `plo${urlParams.get('plo')}` : "all";

const is_wrap = false;
//  for indiviual 

// set the dimensions and margins of the diagram
// var margin = { top: 20, right: 90, bottom: 30, left: 700 },
//     width = 1900 - margin.left - margin.right,
//     height = 1000 - margin.top - margin.bottom;

var margin = { top: 20, right: 0, bottom: 30, left: 1408 },
    width = 3000 - margin.left - margin.right,
    height = 3400 - margin.top - margin.bottom;


// https://stackoverflow.com/questions/24784302/wrapping-text-in-d3
function wrap(text, width) {
    if (is_wrap){
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
    }    
}


// load the external data
d3.csv(`data/${PLO}.csv`, function (error, flatData) {
    if (error) throw error;

    // assign null correctly
    flatData.forEach(function (d) {
        if (d.parent == "null") { d.parent = null };
    });

    // convert the flat data into a hierarchy 
    var treeData = d3.stratify()
        .id(function (d) { return d.name; })
        .parentId(function (d) { return d.parent; })
        (flatData);

    // console.log(treeData);

    // assign the name to each node
    treeData.each(function (d) {
        console.log(d.id);
        d.name = d.id;
    });

    //  assigns the data to a hierarchy using parent-child relationships
    const hierarchyByPosition = (treeData, position) => {
        let data = {
            "name": treeData.name,
            "children": treeData.children.filter((d) => d.data.position == position)
        };
        console.log(data);
        return d3.hierarchy(data, d => (d.children));
    };

    let node_left = hierarchyByPosition(treeData, "left");
    let node_right = hierarchyByPosition(treeData, "right");

    const drawTree = (node, position, isHideRoot) => {

        var SWITCH_CONST;
        switch (position) {
            case "left": SWITCH_CONST = -1; break;
            case "right": SWITCH_CONST = 1; break;
            default: throw error();
        }

        const calculated_width = width + margin.left + margin.right;
        const calculated_height = height + margin.top + margin.bottom;

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = d3.select("svg")
            .attr("width", calculated_width)
            .attr("height", calculated_height),
            g = svg.append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")")
                .attr("transform", "translate(" + calculated_width / 2 + ",0)");

        // declares a tree layout and assigns the size
        // Set the size
        // Remember the tree is rotated
        // so the height is used as the width
        // and the width as the height
        var treemap = d3.tree()
            .size([height, SWITCH_CONST * (width - 150) / 2]);

        // maps the node data to the tree layout
        var nodes = treemap(node);

        // adds the links between the nodes
        var link = g.selectAll(".link")
            .data(nodes.descendants().slice(1))
            .enter().append("path")
            .attr("class", "link")
            .attr("d", function (d) {
                return "M" + d.y + "," + d.x
                    + "C" + (d.y + d.parent.y) / 2 + "," + d.x
                    + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
                    + " " + d.parent.y + "," + d.parent.x;
            });

        // adds each node as a group
        var node = g.selectAll(".node")
            .data(nodes.descendants())
            .enter().append("g")
            .attr("class", function (d) {
                return "node" +
                    (d.children ? " node--internal" : " node--leaf");
            })
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // adds the circle to the node
        node.append("circle")
            .attr("r", 8);

        // adds the text to the node
        node.append("text")
            .attr("font-size", "12")
            .attr("dy", ".35em")
            .attr("x", function (d) { 
                const margin = 20;
                if( isHideRoot & d.depth == 0)return margin;
                return SWITCH_CONST * margin;
             })
            .style("text-anchor", function (d) {
                if( isHideRoot & d.depth == 0)return "start";
                if(position == "left")
                    return "end";
                else {
                    return "start";
                }
                // else return d.children ? "end" : "start";
            })
            .text((d) => { 
                const title = d.data.data?d.data.data.title:"";
                // console.log(d.data.data?d.data.data.title:"");
                if(title == d.data.name) return d.data.name; 
                if(title == "") return d.data.name; 
                else return d.data.name + ": " + title; 
            })
            .call(wrap, 400);

    };

    drawTree(node_left, "left", true);
    drawTree(node_right, "right", false);

    var svgsaver = new SvgSaver();
    var html = d3.select("svg").on('click',function() {
        svgsaver.asSvg(this, "epicyclicGearing.svg");
      });

});

