import "./styles.scss";
import URLSearchParams from '@ungap/url-search-params';


const urlParams = new URLSearchParams(window.location.search)
const PLO = urlParams.has('plo')?`plo${urlParams.get('plo')}`:"dummy";

// set the dimensions and margins of the diagram
var margin = { top: 20, right: 90, bottom: 30, left: 90 },
    width = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;


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

    const drawTree = (node, position) => {

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
            .attr("r", 10);

        // adds the text to the node
        node.append("text")
            .attr("dy", ".35em")
            .attr("x", function (d) { return d.children ? -13 : 13; })
            .style("text-anchor", function (d) {
                return d.children ? "end" : "start";
            })
            .text(function (d) { return d.data.name; });

    };

    drawTree(node_left, "left");
    drawTree(node_right, "right");

});