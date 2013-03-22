/*global require define esri document setTimeout d3*/
(function() {
    'use strict';
    define('d3', function() { return d3; });
    define('app.symbols', ['esri/symbol', 'dojo/_base/Color'],
        function(Symbol, Color){
            var outline = new Symbol.SimpleLineSymbol()
                                .setColor(Color.fromHex('#fff'));
            return new Symbol.SimpleFillSymbol()
                        .setColor(new Color([0, 80, 239, 0.4]))
                        .setOutline(outline);
    });
    require(['d3','dojo/_base/connect','esri/layers/FeatureLayer',
        'app.symbols','dojo/domReady!'
        ], function (d3, connect, FeatureLayer, fillSymbol) {
            var map = new esri.Map('map', {
                basemap: 'gray',
                center: [-89.22383998577513, 35.80008954151037],
                zoom: 6,
                slider: false
            }),
            score = 0,
            delay = 500,
            $score = document.getElementById('score');
            connect.connect(map, 'onLoad', function () {
                var renderer = new esri.renderer.SimpleRenderer(fillSymbol),
                    featureLayer = new FeatureLayer('http://sampleserver6.'+
                        'arcgisonline.com/arcgis/rest/services/USA/MapServer/3', {
                            mode: FeatureLayer.MODE_ONDEMAND
                        }),
                    handler = function (e) {
                        var target = e.target;
                        $score.innerHTML = score;
                        if (e.graphic) {
                            score++;
                            if (score >= 100 && score < 150) {
                                $score.classList.add('score-good');
                            } else if (score >= 150) {
                                $score.classList.remove('score-good');
                                $score.classList.add('score-awesome');
                            }
                        } else {
                            $score.classList.remove('score-good');
                            $score.classList.remove('score-awesome');
                            $score.classList.add('score-fail');
                            $score.innerHTML = 'Not bad, you cleared ' +
                                score + ' counties!';
                            this.removeEventListener('mouseover',
                                    handler, false);
                        }
                        target.classList.add('infected');
                        setTimeout(function (){
                            target.classList.remove('infected');
                        }, delay);
                    };
                featureLayer.setRenderer(renderer);

                connect.connect(featureLayer, 'onUpdateEnd', function(){
                    d3.selectAll('path')
                        .on('mouseover', function () {
                            d3.select(this).transition()
                                .delay(function (d, i) {return delay;})
                                .duration(300)
                                .attr('transform', function(d, i) {
                                    return 'translate(' +
                                        Math.floor(Math.random()*(30))+
                                        ','+
                                        (Math.random()<0.5?'-':'') +
                                        Math.floor(Math.random()*(20))+1+
                                        '), rotate('+
                                        (Math.random()<0.5?'-':'') +
                                        Math.floor(Math.random()*(20))+')';
                                });
                        });
                    document.getElementById('map_gc')
                                .addEventListener('mouseover', handler, false);
                });
                map.addLayer(featureLayer);
            });
        });

}).call(this);
