var map,stlist,stListRd,stftSet,cWord,cChars,smb,eCnt,initExtent;
require(["dojo/ready", "esri/map", "esri/tasks/query"], function() {
  var options = {basemap:"national-geographic",center:[-140, 50],zoom:3};
  map = new esri.Map("map", options);
  dojo.connect(map, "onLoad", mapLoad);
  $('.keyboard li').click(function() {
    if(cChars.length!=0&&$.inArray($(this).text(),cChars)!=-1||eCnt==6)return;
    validadeRound(cChars.push($(this).html()));    
  });
  $('.nextRound').click(function() { nextRound(); });
  $('.restart').click(function() {
    startRound($('.results').addClass('hOverlay'));
  });
});
function mapLoad() {
  initExtent = map.extent;
  smb = new esri.symbol.SimpleFillSymbol("solid", 
  new esri.symbol.SimpleLineSymbol("solid", 
  new dojo.Color([191,91,4,0.75]),1),new dojo.Color([191,91,4,0.75]));    
  var queryTask = new esri.tasks.QueryTask($('#serviceUrl').val());
  var query = new esri.tasks.Query(); 
  query.returnGeometry = true;
  query.where = "ObjectID >= 1"; 
  query.outSpatialReference = {"wkid":102100};
  dojo.connect(queryTask, "onComplete", function(ftSet) {
    stlist = new Array();
	for(var i = 0; i < ftSet.features.length; i++)
	stlist.push(ftSet.features[i].attributes['STATE_NAME']);
	startRound(stftSet = ftSet);
  });
  queryTask.execute(query);
}
function startRound() {   
  stListRd = $.shuffle(stlist.slice());
  nextRound();  
  $('.loadLbl').hide(); 
  $('.ginfo').show();
}
function nextRound() {
  eCnt = 0;
  addGraphics(stftSet.features, smb);
  drawWord(cWord = stListRd.shift().toUpperCase(),cChars = new Array());
  map.setExtent(initExtent);
  $("#mistakes").removeClass();
  $('#next').hide();
}
function validadeRound() {    
  if(!hasChars(cWord, cChars)) { Error(); return;  }
  drawWord(cWord, cChars); 
  addGraphics(getFeaturesByChars(cChars), smb);   
  if(!isWord(cWord)) return;
  var corretFeature = getFeatureByStateName(cWord.toUpperCase());
  addGraphics([corretFeature], smb); 
  map.setExtent(corretFeature.geometry.getExtent().expand(1.8));
  stListRd.length==0 ? $('#win').removeClass('hOverlay'):$('#next').show();
}
function Error() {
  cChars.pop();
  $('.answer').text(cWord);
  $("#mistakes").removeClass().addClass('hangman' + ++eCnt);
  if(eCnt==6)setTimeout(function(){$('#fail').removeClass('hOverlay');},850);
}
function getFeatureByStateName(name) {
  for(var i=0; i < stftSet.features.length; i++)
    if(stftSet.features[i].attributes['STATE_NAME'].toUpperCase() == name)
	  return stftSet.features[i];
}
function getFeaturesByChars(chars) {
  var ftList = new Array();
  dojo.forEach(stftSet.features, function(ft) {
    if(hasChars(ft.attributes['STATE_NAME'],chars)) ftList.push(ft);
  }); 
  return ftList;
}
function hasChars(word, chList) {
  var result = word.match(RegExp('['+chList.join('+')+']','gi'));
  if(result == null) return false;
  return result.filter(function(itm,i,a){ return i==a
  .indexOf(itm)}).length==chList.length;
}
function drawWord(word, c) {
  var charList = '';
  for(var i = 0, len = word.length; i < len; i++) {
   charList += '<li '+ (word[i] == ' ' ? 'class="space"':'') +'>'
   +($.inArray(word[i].toUpperCase(),c)==-1?'':word[i].toUpperCase())+'</li>';
  }; 
  $('#word').empty().html(charList);
}
function isWord(world) {
  var userWord = '';
  $('#word li').each(function() { userWord += $(this).html(); });
  return (userWord == world.toUpperCase().replace(/\s/g,''))
}
function addGraphics(src, symbol) {
  map.graphics.clear();
  for(var i=0;i<src.length;i++) map.graphics.add(src[i].setSymbol(symbol));
}