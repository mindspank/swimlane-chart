//Swimlane Chart
//Created by Alexander Karlsson - akl@qlik.com - Qlik Inc
//Courtesy of Qlik Developer Relations
//Tested on QV11
//
//QlikTech takes no responsbility for any code.
//Use at your own risk.
//Do not submerge in water.
//Do not taunt Happy Fun Ball.

//Constants
var EXTENSION_NAME = 'Swimlane';
var PATH = Qva.Remote + '?public=only&name=Extensions/' + EXTENSION_NAME + '/';

//Load scripts in the array
var scripts = [PATH + 'd3.min.js', PATH + 'd3-tip.js'];


function init() {

	Qva.AddExtension('Swimlane', function() {
    Qva.LoadCSS(PATH + 'style.css');
    
    var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
      console.log(d, html)
      var html = [
        'Study: ' + d.study,
        'Task: ' + d.task,
        'Date: ' + d.startdateraw
      ].join('<br>');
      
      return html; 
    });
    
		$(this.Element).empty().addClass('swimlane');
		var $element = this.Element;
    var $this = this;
    
    var h = $this.GetHeight();
    var w = $this.GetWidth();

    var tempdata = this.Data.Rows.map(function(d) {
      return {
        task: d[4].text,
        study: d[0].text,
        enddateraw: d[1].text,
        startdateraw: d[2].text,
        enddate: new Date(d[1].text),
        startdate: new Date(d[2].text),
        isStart: d[3].text.match(/Start/gi) ? true : false,
        isEnd: d[3].text.match(/End/gi) ? true : false,
        color: d[5].text
      }
    });
                  
    var startenddata = d3.nest()
      .key(function(d) { return d.study; })
      .entries(tempdata.filter(function(d) {
        return d.isStart || d.isEnd;
    }))
    
    var data = d3.nest()
      .key(function(d) {return d.study})
      .entries(tempdata)
    
    var minDate = d3.min(tempdata, function(d) {
      return d.startdate;
    });
    
    var maxDate = d3.max(tempdata, function(d) {
      return d.enddate;
    });
    
    var maxBarHeight = 100;
    
    var margin = {top: 5, right: 150, bottom: 80, left: 150};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;
	  var margin2 = {top: h - 40, right: 130, bottom: 20, left: 150};
    var height2 = h - margin2.top - margin2.bottom;
        
    var x = d3.time.scale().range([0, width]).domain([minDate,maxDate]);
    var x2 = d3.time.scale().range([0, width]).domain([minDate,maxDate]);
    var y = d3.scale.ordinal().domain(data.map(function(d) { return d.key; })).rangeRoundBands([0, data.length < 5 ? data.length * maxBarHeight : height], 0.4, 0.1);
    
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var xAxis2 = d3.svg.axis().scale(x2).orient("bottom");
    
    var tasks = tempdata.reduce(function(p, c) {
        if (p.indexOf(c.task) < 0 && !c.isStart && !c.isEnd) p.push(c.task);
        return p;
    }, []);
    
    var colors = d3.scale.category20();
    var symbolscale = d3.scale.ordinal().range([0,1,3,4,5]).domain(tasks)
    
    var brush = d3.svg.brush()
        .x(x2)
        .extent([minDate,maxDate])
        .on("brush", brushed);

    var svg = d3.select($element).append('svg:svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
        
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    // Main plot element
    var focus = svg.append("g")
        .attr("class", "focus")
        .attr('clip-path', 'url(#clip)')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    svg.call(tip);
    
    // Group for labels
    var glabels = svg.append("g")
        .attr("class", "labels")
        .attr("transform", "translate(10," + 0 + ")");
    
    
    // Main element for Brush
    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
            
    // Group element for brush       
    context.append("g")
        .attr("class", "x brush")
        .call(brush)
    .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);
    
    // X-Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + margin.left + "," + (height + 10) + ")")
        .call(xAxis)
    
    // Second X-Axis for context
    context.append("g")
        .attr("class", "x2 axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);


    // draw the lanes for the main chart
    focus.selectAll('.laneLines')
        .data(data)
        .enter()
     .append('line')
        .attr('x1', 0)
        .attr('y1', function(d) { return y(d.key) ; })
        .attr('y2', function(d) { return y(d.key) ; })
        .attr('x2', width)
        .attr('stroke-width', 0.5)
        .attr('stroke', 'lightgray');

    // Add lane labels
    glabels.selectAll('.laneText')
        .data(data)
        .enter()
      .append('text')
        .text(function(d) { return d.key; })
        .attr('x', 0)
        .attr('y', function(d) { return y(d.key) + (y.rangeBand() / 2); })
        .attr('dy', '10px')
        .attr('text-anchor', 'start')
        .attr('class', 'laneText')
        .call(wrap, margin.left)

    // Draw bars
    focus.selectAll('rect')
        .data(startenddata)
        .enter()
        .append('rect')
        .attr('y', function(d) {
            return y(d.key) + y.rangeBand() / 4;
        })
        .attr('x', function(d) {
          var start = d.values[0].isStart ? d.values[0].startdate : d.values[1].startdate;
          return x(start);     
        })
        .attr("width", function(d, i) {
          var start = d.values[0].isStart ? d.values[0].startdate : d.values[1].startdate;
          var end = d.values[0].isEnd ? d.values[0].enddate : d.values[1].enddate;
          return x(end) - x(start);
        })
        .style('fill', function(d) { return d.values[0].color; })
        .attr('height', y.rangeBand())
    
    // Draw milestones
    focus.selectAll(".pointlayer")
        .data(data)
        .enter()
      .append("g")
        .attr("transform", function(d) { return "translate(0," + y(d.key) + ")"; })
        .each(function(d,i) {
      
          var $this = d3.select(this);
          d.values.forEach(function(inlinedata) {
              if(!inlinedata.isStart && !inlinedata.isEnd) {
                
                var pointHeight = data.length < 5 ? maxBarHeight * data.length : height;
                
                $this.append('path')
                .datum(inlinedata)
                .attr('class', 'point')
                .style('fill', function(d) {
                    return colors(tasks.indexOf(inlinedata.task))
                })
                .attr("d", function() { 
                    return d3.svg.symbol().type(d3.svg.symbolTypes[symbolscale(tasks.indexOf(inlinedata.task))])(); 
                })
                .attr("transform", function() { return "translate("+ x(inlinedata.startdate) +"," + (pointHeight / data.length) / 2 + ")"; })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .append("svg:title")
                .text(inlinedata.task)

              }
          })
      
    });

    // Paint legend
    var legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + (w - margin.right) + ',' + 30 + ')');
    
    tasks.forEach(function(d, i) {      
      legend.append('text')
        .text(d)
      .attr('x', 40)
      .attr('y', i * 20)
      .attr('dy', '0.5ex')
      .attr('text-anchor', 'start')
      .attr('class', 'legendItem');
        
      legend.append('path')
        .attr('class', 'point')
        .style('fill', function() {
            return colors(tasks.indexOf(d))
        })
        .attr("d", function() { 
            return d3.svg.symbol().type(d3.svg.symbolTypes[symbolscale(tasks.indexOf(d))])(); 
        })
        .attr("transform", function() { return "translate(20," + i * 20 + ")"; });
    });
    
    function brushed() {
      x.domain(brush.empty() ? x2.domain() : brush.extent());
      svg.select(".x.axis").call(xAxis);
      
      var pointHeight = data.length < 5 ? maxBarHeight * data.length : height;
      
      focus.selectAll('rect').attr('x', function(d) {
            var start = d.values[0].isStart ? d.values[0].startdate : d.values[1].startdate;
            return x(start);     
        })
        .attr("width", function(d, i) {
            var start = d.values[0].isStart ? d.values[0].startdate : d.values[1].startdate;
            var end = d.values[0].isEnd ? d.values[0].enddate : d.values[1].enddate;
            return x(end) - x(start);
        });
        
      focus.selectAll('.point')
        .attr("transform", function(d) {
            return "translate("+ x(d.startdate) +"," + (pointHeight / data.length) / 2 + ")"; 
        });
        
    };
    
    
// Wrap labels
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 11, // ems
        y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "px");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "px").text(word);
      }
    }
  });
}

	});
};

/* load external libs - callback init() */
function loadScripts() {
	if (typeof d3 === 'undefined') {
		Qv.LoadExtensionScripts(scripts, init);
	} else {
		init()
	};
};
loadScripts();