// modified from http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
function getUrlVars(){var e=[],t,n=window.location.href.slice(window.location.href.indexOf("?")+1).split("&");for(var r=0;r<n.length;r++){t=n[r].split("=");e.push(t[0]);e[t[0]]=decodeURIComponent(t[1])}return e}var searchPrompt="Search by ingredient name...";jQuery(document).ready(function(){$("#searchField").val(searchPrompt).addClass("empty");$("#searchField").focus(function(){$(this).val()===searchPrompt&&$(this).val("").removeClass("empty")});$("#searchField").blur(function(){$(this).val()===""&&$(this).val(searchPrompt).addClass("empty")});$("#searchField").keyup(function(){var e=$("#searchField").val(),t=e.toLowerCase().split(" ")[0],n=$("#searchResultsFull"),r=0;e.length>0?$("#resetsearch").css("opacity","1.0"):$("#resetsearch").css("opacity","0.5");if(e.length>1)$.getJSON("/search/ing/"+e,function(i){n.empty();if(i.length>0){n.append('<p class="text-success">'+i.length+" unique matches for “"+e+"”</p>");n.append("<p>Matches that start with “"+e+"”</p>");n.append($('<ul class="unstyled">'));for(var s=0;s<i.length;s++)if(i[s].name.toLowerCase().indexOf(t)===0){r+=1;n.append($('<li><a href="/tree/ing-'+i[s].iid+'.html">'+i[s].name+"</a> ("+i[s].context+")</li>"))}r>0&&n.append($('</ul><br /><ul class="unstyled">'));n.append("<p>Matches that contain with “"+e+"”</p>");for(s=0;s<i.length;s++)i[s].name.toLowerCase().indexOf(t)!==0&&n.append($('<li><a href="/tree/ing-'+i[s].iid+'.html">'+i[s].name+"</a> ("+i[s].context+")</li>"));n.append($("</ul>"));n.show()}else{n.append($('<p class="text-error"><em>No matches. Try searching on the first few letters of a product or category.</em></p>'));n.show()}});else{n.empty();n.hide()}});$("#resetsearch").click(function(){$("#searchResultsFull").empty().hide();$("#searchField").val("");$("#resetsearch").css("opacity","0.5")});if(getUrlVars().q){$("#searchField").val(getUrlVars().q.replace("+"," "));$("#searchField").keyup()}});