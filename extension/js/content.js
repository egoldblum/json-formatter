/* global d3,_,traverse */
/* jshint browser: true */
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name content.js
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/chrome_extensions.js
// @js_externs var console = {assert: function(){}};
// @formatting pretty_print
// ==/ClosureCompiler==

/** @license
  JSON Formatter | MIT License
  Copyright 2012 Callum Locke

  Permission is hereby granted, free of charge, to any person obtaining a copy of
  this software and associated documentation files (the "Software"), to deal in
  the Software without restriction, including without limitation the rights to
  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
  of the Software, and to permit persons to whom the Software is furnished to do
  so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

 */

/*jshint eqeqeq:true, forin:true, strict:true */
/*global chrome, console */

(function() {

  "use strict" ;

  var jfContent,
      jfContainer,
      jfChart,
      jfMeta,
      pre,
      jfStyleEl,
      slowAnalysisTimeout,
      port,
      startTime = +(new Date()),
      domReadyTime,
      isJsonTime,
      exitedNotJsonTime,
      displayedFormattedJsonTime
  ;

  // Open the port "jf" now, ready for when we need it
    // console.time('established port') ;
    port = chrome.extension.connect({name: 'jf'}) ;

  // Add listener to receive response from BG when ready
    port.onMessage.addListener( function (msg) {
      // console.log('Port msg received', msg[0], (""+msg[1]).substring(0,30)) ;

      switch (msg[0]) {
        case 'NOT JSON' :
          pre.hidden = false ;
          // console.log('Unhidden the PRE') ;
          document.body.removeChild(jfContent) ;
          exitedNotJsonTime = +(new Date()) ;
          break ;

        case 'FORMATTING' :
          isJsonTime = +(new Date()) ;

          // It is JSON, and it's now being formatted in the background worker.

          // Clear the slowAnalysisTimeout (if the BG worker had taken longer than 1s to respond with an answer to whether or not this is JSON, then it would have fired, unhiding the PRE... But now that we know it's JSON, we can clear this timeout, ensuring the PRE stays hidden.)
            clearTimeout(slowAnalysisTimeout) ;

          // Insert CSS
            jfStyleEl = document.createElement('style') ;
            jfStyleEl.id = 'jfStyleEl' ;
            //jfStyleEl.innerText = 'body{padding:0;}' ;
            document.head.appendChild(jfStyleEl) ;

            jfStyleEl.insertAdjacentHTML(
              'beforeend',
              'body{-webkit-user-select:text;overflow-y:scroll !important;margin:0;position:relative}#optionBar{-webkit-user-select:none;display:block;position:absolute;top:9px;right:17px}#buttonFormatted,#buttonPlain{-webkit-border-radius:2px;-webkit-box-shadow:0px 1px 3px rgba(0,0,0,0.1);-webkit-user-select:none;background:-webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);border:1px solid #aaa;color:#444;font-size:12px;margin-bottom:0px;min-width:4em;padding:3px 0;position:relative;z-index:10;display:inline-block;width:80px;text-shadow:1px 1px rgba(255,255,255,0.3)}#buttonFormatted{margin-left:0;border-top-left-radius:0;border-bottom-left-radius:0}#buttonPlain{margin-right:0;border-top-right-radius:0;border-bottom-right-radius:0;border-right:none}#buttonFormatted:hover,#buttonPlain:hover{-webkit-box-shadow:0px 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#fefefe, #f8f8f8 40%, #e9e9e9);border-color:#999;color:#222}#buttonFormatted:active,#buttonPlain:active{-webkit-box-shadow:inset 0px 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#f4f4f4, #efefef 40%, #dcdcdc);color:#333}#buttonFormatted.selected,#buttonPlain.selected{-webkit-box-shadow:inset 0px 1px 5px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#e4e4e4, #dfdfdf 40%, #dcdcdc);color:#333}#jsonpOpener,#jsonpCloser{padding:4px 0 0 8px;color:black;margin-bottom:-6px}#jsonpCloser{margin-top:0}#formattedJson{padding-left:28px;padding-top:6px}pre{padding:36px 5px 5px 5px}.kvov{display:block;padding-left:20px;margin-left:-20px;position:relative}.collapsed{white-space:nowrap}.collapsed>.blockInner{display:none}.collapsed>.ell:after{content:"…";font-weight:bold}.collapsed>.ell{margin:0 4px;color:#888}.collapsed .kvov{display:inline}.e{width:20px;height:18px;display:block;position:absolute;left:-2px;top:1px;z-index:5;background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAD1JREFUeNpiYGBgOADE%2F3Hgw0DM4IRHgSsDFOzFInmMAQnY49ONzZRjDFiADT7dMLALiE8y4AGW6LoBAgwAuIkf%2F%2FB7O9sAAAAASUVORK5CYII%3D");background-repeat:no-repeat;background-position:center center;display:block;opacity:0.15}.collapsed>.e{-webkit-transform:rotate(-90deg);width:18px;height:20px;left:0px;top:0px}.e:hover{opacity:0.35}.e:active{opacity:0.5}.collapsed .kvov .e{display:none}.blockInner{display:block;padding-left:24px;border-left:1px dotted #bbb;margin-left:2px}#formattedJson,#jsonpOpener,#jsonpCloser{color:#333;font:13px/18px monospace}#formattedJson{color:#444}.b{font-weight:bold}.s{color:#0B7500;word-wrap:break-word}a:link,a:visited{text-decoration:none;color:inherit}a:hover,a:active{text-decoration:underline;color:#050}.bl,.nl,.n{font-weight:bold;color:#1A01CC}.k{color:black}#formattingMsg{font:13px "Lucida Grande", "Segoe UI", "Tahoma";padding:10px 0 0 8px;margin:0;color:#333}#formattingMsg>svg{margin:0 7px;position:relative;top:1px}[hidden]{display:none !important}span{white-space:pre-wrap}@-webkit-keyframes spin{from{-webkit-transform:rotate(0deg)}to{-webkit-transform:rotate(360deg)}}#spinner{-webkit-animation:spin 2s 0 infinite}*{-webkit-font-smoothing:antialiased} path { stroke: #fff; fill-rule: evenodd; }'
            ) ;

            // Add custom font name if set - FROM FUTURE
              // if (typeof settings.fontName === 'string') {
              //   jfStyleEl.insertAdjacentHTML(
              //     'beforeend',
              //     '#formattedJson,#jsonpOpener,#jsonpCloser{font-family: "' + settings.fontName + '"}'
              //   ) ;
              // }

          // Show 'Formatting...' spinner
            // jfContent.innerHTML = '<p id="formattingMsg"><img src="data:image/gif;base64,R0lGODlhEAALAPQAAP%2F%2F%2FwAAANra2tDQ0Orq6gYGBgAAAC4uLoKCgmBgYLq6uiIiIkpKSoqKimRkZL6%2BviYmJgQEBE5OTubm5tjY2PT09Dg4ONzc3PLy8ra2tqCgoMrKyu7u7gAAAAAAAAAAACH%2BGkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAALAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAALAAAFLSAgjmRpnqSgCuLKAq5AEIM4zDVw03ve27ifDgfkEYe04kDIDC5zrtYKRa2WQgAh%2BQQACwABACwAAAAAEAALAAAFJGBhGAVgnqhpHIeRvsDawqns0qeN5%2By967tYLyicBYE7EYkYAgAh%2BQQACwACACwAAAAAEAALAAAFNiAgjothLOOIJAkiGgxjpGKiKMkbz7SN6zIawJcDwIK9W%2FHISxGBzdHTuBNOmcJVCyoUlk7CEAAh%2BQQACwADACwAAAAAEAALAAAFNSAgjqQIRRFUAo3jNGIkSdHqPI8Tz3V55zuaDacDyIQ%2BYrBH%2BhWPzJFzOQQaeavWi7oqnVIhACH5BAALAAQALAAAAAAQAAsAAAUyICCOZGme1rJY5kRRk7hI0mJSVUXJtF3iOl7tltsBZsNfUegjAY3I5sgFY55KqdX1GgIAIfkEAAsABQAsAAAAABAACwAABTcgII5kaZ4kcV2EqLJipmnZhWGXaOOitm2aXQ4g7P2Ct2ER4AMul00kj5g0Al8tADY2y6C%2B4FIIACH5BAALAAYALAAAAAAQAAsAAAUvICCOZGme5ERRk6iy7qpyHCVStA3gNa%2F7txxwlwv2isSacYUc%2Bl4tADQGQ1mvpBAAIfkEAAsABwAsAAAAABAACwAABS8gII5kaZ7kRFGTqLLuqnIcJVK0DeA1r%2Fu3HHCXC%2FaKxJpxhRz6Xi0ANAZDWa%2BkEAA7AAAAAAAAAAAA"> Formatting...</p>' ;
            // jfContent.innerHTML = '<p id="formattingMsg">Formatting...<br><progress/></p>' ;
            jfContent.innerHTML = '<p id="formattingMsg"><svg id="spinner" width="16" height="16" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" version="1.1"><path d="M 150,0 a 150,150 0 0,1 106.066,256.066 l -35.355,-35.355 a -100,-100 0 0,0 -70.711,-170.711 z" fill="#3d7fe6"></path></svg> Formatting...</p>' ;


            var formattingMsg = document.getElementById('formattingMsg') ;
            // TODO: set formattingMsg to visible after about 300ms (so faster than this doesn't require it)
            formattingMsg.hidden = true ;
            setTimeout(function(){
              formattingMsg.hidden = false ;
            }, 250) ;


          // Create option bar
            var optionBar = document.createElement('div') ;
            optionBar.id = 'optionBar' ;


          // Show options link, if needed - FROM FUTURE
            // if (settings.enableOptionsLink) {
            //   var optionsLink = document.createElement('a') ;
            //   optionsLink.id = 'optionsLink' ;
            //   optionsLink.innerText = 'Options' ;
            //   optionsLink.href = settings['optionsUrl'] ;
            //   optionsLink.target = '_BLANK' ;
            //   optionBar.appendChild(optionsLink) ;
            // }

          // Create toggleFormat button
            var buttonPlain = document.createElement('button'),
              buttonFormatted = document.createElement('button') ;
            buttonPlain.id = 'buttonPlain' ;
            buttonPlain.innerText = 'Raw' ;
            buttonFormatted.id = 'buttonFormatted' ;
            buttonFormatted.innerText = 'Parsed' ;
            buttonFormatted.classList.add('selected') ;

            var plainOn = false ;
            buttonPlain.addEventListener(
              'click',
              function () {
                // When plain button clicked...
                if (!plainOn) {
                  plainOn = true ;
                  pre.hidden = false ;
                  jfContent.hidden = true ;

                  buttonFormatted.classList.remove('selected') ;
                  buttonPlain.classList.add('selected') ;
                }
              },
              false
            ) ;

            buttonFormatted.addEventListener(
              'click',
              function () {
                // When formatted button clicked...
                if (plainOn) {
                  plainOn = false ;
                  pre.hidden = true ;
                  jfContent.hidden = false ;

                  buttonFormatted.classList.add('selected') ;
                  buttonPlain.classList.remove('selected') ;
                }
              },
              false
            ) ;

            // Put it in optionBar
              optionBar.appendChild(buttonPlain) ;
              optionBar.appendChild(buttonFormatted) ;

          // Attach event handlers
            document.addEventListener(
              'click',
              generalClick,
              false // No need to propogate down
            ) ;

          // Put option bar in DOM
            document.body.insertBefore(optionBar, pre) ;

          break ;

        case 'FORMATTED' :
          // Insert HTML content
            jfContent.innerHTML = msg[1] ;

          displayedFormattedJsonTime = Date.now() ;

          // Log times
            //console.log('DOM ready took '+ (domReadyTime - startTime) +'ms' ) ;
            //console.log('Confirming as JSON took '+ (isJsonTime - domReadyTime) +'ms' ) ;
            //console.log('Formatting & displaying JSON took '+ (displayedFormattedJsonTime - isJsonTime) +'ms' ) ;
            // console.log('JSON detected and formatted in ' + ( displayedFormattedJsonTime - domReadyTime ) + ' ms') ;
            // console.markTimeline('JSON formatted and displayed') ;

          // Export parsed JSON for easy access in console
            setTimeout(function () {
              var script = document.createElement("script") ;
              var j = JSON.parse(JSON.stringify(msg[2]));
              script.innerHTML = 'window.json = ' + j + ';' ;
              document.head.appendChild(script) ;
              console.log('JSON Formatter: Type "json" to inspect.') ;
              initializeChart(j);
            }, 100) ;

          break ;

        default :
          throw new Error('Message not understood: ' + msg[0]) ;
      }
    });

    // console.timeEnd('established port') ;

  function initializeChart(j) {
    console.log('chart init begin');
    var width = 960,
        height = 700,
        radius = Math.min(width, height) / 2;

    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);

    var y = d3.scale.sqrt()
        .range([0, radius]);

    var color = d3.scale.category20c();

    var svg = d3.select("#jfChart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

    var partition = d3.layout.partition()
        .value(function (d) {
          var val = JSON.stringify(d._original).length;
          return val;
        })
        .children(function (d) {
          return _.values(d._original);
        });

    var arc = d3.svg.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

    function click(d) {
      path.transition()
        .duration(750)
        .attrTween("d", arcTween(d));
    }

    function hover(d, i) {
      var key = d._name;
      var depth = d._depth;

      d3.select(jfMeta).html(d._path + " " + d.value);

      var selector,
          selection;

      // ctrl shows all instances of this key at this depth
      if (d3.event.ctrlKey) {
        selector = "[key='" + key + "'][depth='" + depth + "']";
      }

      // meta shows all instances of this key at all depths
      if (d3.event.metaKey) {
        selector = "[key='" + key + "']";
      }

      if (selector) {
        selection = d3.selectAll(selector).classed("active", true);
      }

      d3.select(this).classed("active", true);
      d3.select(this).on("mouseout", function (d, i) {
        d3.select(this).on("mouseout", null);
        if (selection) {
          selection.classed("active", false);
        }
        d3.select(this).classed("active", false);
      });
    }

    function computeTextRotation(d) {
      var angle = x(d.x + d.dx / 2) - Math.PI / 2;
      return angle / Math.PI * 180;
    }


    var metadata = {};

    var mapped = traverse(JSON.parse(j)).map(function () {

      var nodeList = metadata[this.key] || [];
      var obj = {
        key: this.key,
        weight: JSON.stringify(this.node).length,
        depth: this.level
      };
      nodeList.push(obj);
      metadata[this.key] = nodeList;

      this.after(function () {
        this.update({
          _original: this.node,
          _name: this.key,
          _path: this.path,
          _depth: this.level
        });
      });
    });

    var keyWeights = _.map(metadata, function (keyName, nodeList) {
      var totalWeight = _.reduce(nodeList, function (sum, node) {
        return sum + node.weight;
      }, 0);
      var count = nodeList.length;

      return {
        totalWeight: totalWeight,
        count: count
      };
    });

    var g = svg.selectAll("path")
        .data(partition.nodes(mapped))
        .enter()
        .append("g");

    var path = g.append("path")
        .attr("d", arc)
        .attr("key", function (d, i) {
          return d._name;
        })
        .attr("depth", function (d, i) {
          return d._depth;
        })
        .on("click", click)
        .on("mouseover", hover);

    // Interpolate the scales!
    function arcTween(d) {
      var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
          yd = d3.interpolate(y.domain(), [d.y, 1]),
          yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
      return function(d, i) {
        return i ? function(t) { return arc(d); } : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
      };
    }
  }

  function ready () {

    domReadyTime = Date.now() ;

    // First, check if it's a PRE and exit if not
      var bodyChildren = document.body.childNodes ;
      pre = bodyChildren[0] ;
      var jsonLength = (pre && pre.innerText || "").length ;
      if (
        bodyChildren.length !== 1 ||
        pre.tagName !== 'PRE' ||
        jsonLength > (3000000) ) {

        // console.log('Not even text (or longer than 3MB); exiting') ;
        // console.log(bodyChildren.length,pre.tagName, pre.innerText.length) ;

        // Disconnect the port (without even having used it)
          port.disconnect() ;

        // EXIT POINT: NON-PLAIN-TEXT PAGE (or longer than 3MB)
      }
      else {
        // This is a 'plain text' page (just a body with one PRE child).
        // It might be JSON/JSONP, or just some other kind of plain text (eg CSS).

        // Hide the PRE immediately (until we know what to do, to prevent FOUC)
          pre.hidden = true ;
          //console.log('It is text; hidden pre at ') ;
          slowAnalysisTimeout = setTimeout(function(){
            pre.hidden = false ;
          }, 1000) ;

        // Send the contents of the PRE to the BG script
          // Add jfContent DIV, ready to display stuff
            jfContent = document.createElement('div') ;
            jfContent.id = 'jfContent' ;
            jfContent.style['flex-grow'] = 1;
            jfContent.style.width = '50%';

            jfChart = document.createElement('div') ;
            jfChart.id = 'jfChart' ;
            jfChart.style['flex-grow'] = 1;
            jfContent.style.width = '50%';

            jfMeta = document.createElement('div');
            jfMeta.id = 'jfMeta';
            jfChart.appendChild(jfMeta);

            jfContainer = document.createElement('div') ;
            jfContainer.id = 'jfContainer' ;
            jfContainer.style.display = 'flex';

            jfContainer.appendChild(jfContent);
            jfContainer.appendChild(jfChart);
            document.body.appendChild(jfContainer);

          // Post the contents of the PRE
            port.postMessage({
              type: "SENDING TEXT",
              text: pre.innerText,
              length: jsonLength
            });

          // Now, this script will just wait to receive anything back via another port message. The returned message will be something like "NOT JSON" or "IS JSON"
      }
  }

  document.addEventListener("DOMContentLoaded", ready, false);

  var lastKvovIdGiven = 0 ;
  function collapse(elements) {
    // console.log('elements', elements) ;

    var el, i, blockInner, count ;

    for (i = elements.length - 1; i >= 0; i--) {
      el = elements[i] ;
      el.classList.add('collapsed') ;

      // (CSS hides the contents and shows an ellipsis.)

      // Add a count of the number of child properties/items (if not already done for this item)
        if (!el.id) {
          el.id = 'kvov' + (++lastKvovIdGiven) ;

          // Find the blockInner
            blockInner = el.firstElementChild ;
            while ( blockInner && !blockInner.classList.contains('blockInner') ) {
              blockInner = blockInner.nextElementSibling ;
            }
            if (!blockInner)
              continue ;

          // See how many children in the blockInner
            count = blockInner.children.length ;

          // Generate comment text eg "4 items"
            var comment = count + (count===1 ? ' item' : ' items') ;
          // Add CSS that targets it
            jfStyleEl.insertAdjacentHTML(
              'beforeend',
              '\n#kvov'+lastKvovIdGiven+'.collapsed:after{color: #aaa; content:" // '+comment+'"}'
            ) ;
        }
    }
  }
  function expand(elements) {
    for (var i = elements.length - 1; i >= 0; i--)
      elements[i].classList.remove('collapsed') ;
  }

  var mac = navigator.platform.indexOf('Mac') !== -1,
      modKey ;
  if (mac)
    modKey = function (ev) {
      return ev.metaKey ;
    } ;
  else
    modKey = function (ev) {
      return ev.ctrlKey ;
    } ;

  function generalClick(ev) {
    // console.log('click', ev) ;

    if (ev.which === 1) {
      var elem = ev.target ;

      if (elem.className === 'e') {
        // It's a click on an expander.

        ev.preventDefault() ;

        var parent = elem.parentNode,
            div = jfContent,
            prevBodyHeight = document.body.offsetHeight,
            scrollTop = document.body.scrollTop,
            parentSiblings
        ;

        // Expand or collapse
          if (parent.classList.contains('collapsed')) {
            // EXPAND
              if (modKey(ev))
                expand(parent.parentNode.children) ;
              else
                expand([parent]) ;
          }
          else {
            // COLLAPSE
              if (modKey(ev))
                collapse(parent.parentNode.children) ;
              else
                collapse([parent]) ;
          }

        // Restore scrollTop somehow
          // Clear current extra margin, if any
            div.style.marginBottom = 0 ;

          // No need to worry if all content fits in viewport
            if (document.body.offsetHeight < window.innerHeight) {
              // console.log('document.body.offsetHeight < window.innerHeight; no need to adjust height') ;
              return ;
            }

          // And no need to worry if scrollTop still the same
            if (document.body.scrollTop === scrollTop) {
              // console.log('document.body.scrollTop === scrollTop; no need to adjust height') ;
              return ;
            }

          // console.log('Scrolltop HAS changed. document.body.scrollTop is now '+document.body.scrollTop+'; was '+scrollTop) ;

          // The body has got a bit shorter.
          // We need to increase the body height by a bit (by increasing the bottom margin on the jfContent div). The amount to increase it is whatever is the difference between our previous scrollTop and our new one.

          // Work out how much more our target scrollTop is than this.
            var difference = scrollTop - document.body.scrollTop  + 8 ; // it always loses 8px; don't know why

          // Add this difference to the bottom margin
            //var currentMarginBottom = parseInt(div.style.marginBottom) || 0 ;
            div.style.marginBottom = difference + 'px' ;

          // Now change the scrollTop back to what it was
            document.body.scrollTop = scrollTop ;

        return ;
      }
    }
  }

})();
