/* Constants */
var HIGHLIGHT = '#cc00cc';
var REGULAR = '#666666';
var x = 100;
var y = 150;
var w = 100;
var h = 50;
var hspace = 50;
var vspace = 50;
var MAX_X = 3000;
var MAX_Y = 2000;

/* Globals */
var canvas;
var coordStore = [];
var maxY = 0;

/*
{ tag: "n1"},{ tag: "n2", parent: "n1" },{ tag: "n3", parent: "n2" },{ tag: "n9", parent: "n3" },{ tag: "n10", parent: "n3"},{ tag: "n11", parent: "n9" },{ tag: "n4", parent: "n1" },{ tag: "n12", parent: "n4" },{ tag: "n18", parent: "n12" }
*/

/* The JSON tree */
var _tree = [
    { tag: "n1"},
    { tag: "n2", parent: "n1" },
    { tag: "n3", parent: "n2" },
    { tag: "n9", parent: "n3" },
    { tag: "n10", parent: "n3"},
    { tag: "n11", parent: "n9" },
    { tag: "n4", parent: "n1" },
    { tag: "n12", parent: "n4" },
    { tag: "n18", parent: "n12" },
    { tag: "n13", parent: "n4" },
    { tag: "n15", parent: "n4" },
    { tag: "n7", parent: "n1" },
    { tag: "n8", parent: "n7" },
    { tag: "n16", parent: "n7" },
    { tag: "n17", parent: "n16" },
    { tag: "n20", parent: "n16" },
    { tag: "n5" },
    { tag: "n6", parent: "n5" },
    { tag: "n14", parent: "n6" },
    { tag: "n19", parent: "n14" }
];

/* Initialize */
function init() {
    coordStore = [];
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


/* SHAPES */
var SHAPES = {};

SHAPES.line = function(){
    return {
        draw: function(x1,y1,x2,y2) {
            var ctx = canvas.getContext('2d');
            ctx.strokeStyle = REGULAR;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.stroke();
        }
    }
}();

SHAPES.box = function() {
    return {
        draw: function(text, _x, _y, _w, _h) {            
            var ctx = canvas.getContext('2d');
            ctx.strokeStyle = HIGHLIGHT;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(_x, _y, _w, _h);
            ctx.save();

            //Create a drop shadow
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "black";    
            ctx.closePath();
            ctx.fillText(text, _x+(w/2)-10, _y+(h/2)+5);
            ctx.stroke();

            ctx.restore();
        } 
    }
}();

SHAPES.arrowhead = function() {
    return {
        draw: function(x1,y1,x2,y2) {
            var ang = Math.atan2(y2-y1,x2-x1);
            var arrow = [
                [ 2, 0 ],
                [ -10, -4 ],
                [ -10, 4]
            ];
            drawFilledPolygon(translateShape(rotateShape(arrow,ang),x2,y2));
        }
    }

    function drawFilledPolygon(shape) {
        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(shape[0][0],shape[0][1]);

        for(p in shape)
            if (p > 0) ctx.lineTo(shape[p][0],shape[p][1]);

        ctx.lineTo(shape[0][0],shape[0][1]);
        ctx.fill();
    };

    function translateShape(shape,x,y) {
        var rv = [];
        for(p in shape)
            rv.push([ shape[p][0] + x, shape[p][1] + y ]);
        return rv;
    };

    function rotateShape(shape,ang) {
        var rv = [];
        for(p in shape)
            rv.push(rotatePoint(ang,shape[p][0],shape[p][1]));
        return rv;
    };

    function rotatePoint(ang,x,y) {
        return [
            (x * Math.cos(ang)) - (y * Math.sin(ang)),
            (x * Math.sin(ang)) + (y * Math.cos(ang))
        ];
    };

}();


SHAPES.grid = function() {
    return {
        draw: function (scale) {
            var ctx = canvas.getContext("2d");
            ctx.font = "bold 12px verdana";
            ctx.lineCap  = "round";
            ctx.lineJoin = "round";
        
            for (var x = 0.5; x < MAX_X; x += 10) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, MAX_X);
            }

            for (var y = 0.5; y < MAX_Y; y += 10) {
                ctx.moveTo(0, y);
                ctx.lineTo(MAX_Y, y);
            }
        
            ctx.save();

            ctx.scale(1/scale, 1/scale);
            ctx.strokeStyle = "#eee";
            ctx.stroke();
        
            ctx.restore();
        }
    }
}();


SHAPES.tree = function() {
    return {
        draw: function() {
            var parents = findParents();
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];
                if (i == 0) {    // first parent
                    drawParent(50, parent);
                } else {
                    drawParent(maxY+h+vspace, parent);
                }
                var children = findChildren(parent);
                if (children.length > 0) {
                    drawChildren(parent, children);
                }
            }
        }
    }

    /* finders */
    function findParents() {
        var l; 
        var parents  = [];
        var j = 0;
        for (var i = 0; i < _tree.length; i++) {
            l = _tree[i];
            if (l.parent) continue;
            parents[j] = l;
            j++;
        }
        return parents;
    }

    function findChildren(parent) {
        var l;
        var children = [];
        var j = 0;
        for (var i = 0; i < _tree.length; i++) {
            l = _tree[i];
            if (l.parent && l.parent == parent.tag) {
                children[j] = l;
                j++;
            }
        }
        return children;
    }

    function updateMaxY(_y) {
        if (maxY >= _y) return;
        maxY = _y;
    }

    function updateCoords(node, _x, _y) {
        node.coords = {};
        node.coords.mx = _x;    
        node.coords.my = _y;    
        updateMaxY(_y);
        coordStore[coordStore.length] = {
            '_x': _x,
            '_y': _y
        };
    }

    function isCoordTaken(_x, _y) {
        for (var i = 0; i < coordStore.length; i++) {
            if (coordStore[i]._y == _y && coordStore[i]._x == _x) {
                return true;
            }    
        }
        return false;
    }

    function drawParent(_y, parent) {
        updateCoords(parent, x, _y);
        SHAPES.box.draw(parent.tag, x, _y, w, h);
    }

    function drawChild(childNumber, parent, child) {
        var _x = parent.coords.mx+w+hspace;
        var _y = parent.coords.my+((h+vspace)*childNumber);

        if (isCoordTaken(_x, _y)) {
            _y = maxY + h + vspace;
        }
    
        updateCoords(child, _x, _y);
        SHAPES.box.draw(child.tag, _x, _y, w, h);
    }

    function drawChildren(parent, children) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            drawChild(i, parent, child);
            drawPath(parent, child);
            var grandchildren = findChildren(child);
            if (grandchildren.length > 0) {
                drawChildren(child, grandchildren);
            }
        }    
    }

    function drawPath(parent, child) {
        var _startx = parent.coords.mx + w
        var _starty = parent.coords.my + (h/2)
        var _endx = child.coords.mx;
        var _endy = child.coords.my + (h/2);
        SHAPES.line.draw(_startx, _starty, _endx, _endy);
        SHAPES.arrowhead.draw(_startx, _starty, _endx, _endy);
    }

}();



/*
   On window load...
*/
$(window).load(function() {
    $("#message").keypress( function(e) {
        if (e.keyCode != 13) return;
        init();
        var message = $("#message").attr("value").replace("\n", "");
        _tree = eval(message);
        SHAPES.grid.draw(1);
        SHAPES.tree.draw();
    });
    fireOnLoad();
});

function fireOnLoad() {
    canvas = document.getElementById('v3map');

    var scale = 1;
    var bg = new Image(MAX_X, MAX_Y);

    function findNode(ev) {
        var _x = (ev.clientX+window.pageXOffset)/scale;
        var _y = (ev.clientY+window.pageYOffset-(canvas.offsetTop))/scale;
        for (var i = _tree.length-1; i >= 0; i--) {
            if (_x >= _tree[i].coords.mx && _x <= _tree[i].coords.mx+w &&
                _y >= _tree[i].coords.my && _y <= _tree[i].coords.my+h)
                return _tree[i];
        }
        return undefined;
    };

    function previewNode(l) {
        preview.style.left = (l.coords.mx*scale)+'px';
        preview.style.top = (l.coords.my*scale+canvas.offsetTop+h)+'px';
        preview.style.display = 'block';
        preview.style.font = 'bold 12px verdana';
        preview.style.background = 'yellow';
        preview.innerHTML = l.tag;
    };
    
    bg.onload = function() {
        canvas.getContext("2d").scale(scale, scale);
        SHAPES.grid.draw(scale);

        canvas.onmousemove = function(ev) {
            var node = findNode(ev);
            if (node) {
                canvas.style.cursor = 'pointer';
                previewNode(node);
            } else {
                preview.style.display = 'none';
                canvas.style.cursor = 'default';
            }
        };
    };

    bg.onerror = function() {
        alert('Failed to load background image.');
    };

    bg.src = 's.gif';
};
