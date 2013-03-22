dojo.require("dojo.parser");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.dijit.Legend");
dojo.require("esri.map");
dojo.addOnLoad(init);
var map;
var perguntaIndex = 0;
function init() {
    map = new esri.Map("map",{
        basemap:"hybrid",
        center:[-52.866667, -15.098889], 
        zoom:4,
        sliderStyle: "large"
    });
    $.ajax('questions/questions_en.json', {
        async: false,
        dataType: "json", 
        success: function(data) {
            questions = data;
        },
        error: function(jqXHR, textStatus, errorThrown ) {
            alert("Error while trying to retrive questions\n"+errorThrown);
        }
    });
    console.log(questions);
    registerEvents();
    firstrun = true;
    newQuestion();    
}
function registerEvents() {
    dojo.connect(map, 'onLoad', function(map) { 
        dojo.connect(dijit.byId('map'), 'resize', resizeMap);
    });
    $('#responde').click(function() 
    {
        answer();
        return false;
    });
}
function resizeMap() {
    var resizeTimer;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        map.resize();
        map.reposition();
    }, 500);
}
function newQuestion() {
    var container = $('#perguntasDiv');
    container.html('');
    var question = questions[perguntaIndex];
    $('<b>'+question.enunciado+'</b><br /><br />').appendTo(container);
    for(var i = 0; i < 4; i++) {
        $('<input type="radio" id="resposta'+(i+1)+'" name="resposta" value="'
            +(i+1)+'" /><label for="resposta'+(i+1)+'">'
            +question['resposta'+(i+1)]+'</label><br/>').appendTo(container);
    }
    $('#responde').show();
}
function answer() {
    var checado = $('[name=resposta]:checked');
    if (checado.length != 1) {
        alert('Select a valid answer.');
        return;
    }
    showResult(checado.val());
}
function showResult(option) {
    var container = $('#perguntasDiv');
    container.html('Close the info window on the map to proceed.');
    $('#responde').hide();
    var question = questions[perguntaIndex];
    if (option == question.resposta) {
        map.infoWindow.setTitle("Correct:");
    } else {
        map.infoWindow.setTitle("The correct answer is:");
    }
    var point = esri.geometry.geographicToWebMercator(
        esri.geometry.Point(question.location.x, question.location.y));
    map.infoWindow.setContent(question.licao);
    map.infoWindow.setContent(question.licao);
    map.infoWindow.show(point);
    if(firstrun) {
        dojo.connect(map.infoWindow, "onHide", function() {
            fechaResultado();
        });
        firstrun = false;
    }
    map.centerAndZoom(point, question.zoom);
}
function fechaResultado() {
    perguntaIndex++;
    if (questions.length > perguntaIndex)
        newQuestion();
    else if (confirm('You have answered all questions, start again?')) {
        perguntaIndex = 0;
        newQuestion();
    }
}