$(document).ready(function() {
	var pages = new Array();
	var files = new Array();
	var titles = new Array();
	
	var ix = 0;
	$(".pages").each(function() {
		pages[ix++] = $(this).html();
	});
	ix = 0;
	$(".files").each(function() {
		files[ix++] = $(this).text();
	});			
	ix = 0;
	$(".titles").each(function() {
		titles[ix++] = $(this).text();
	});			
	$(".content_iframe").attr("src", files[0] + ".html");
	$(".content_text_head").fadeTo(0, 0, function() {
		$(this).html(titles[0]).show().fadeTo(1000, 1); 
	});
	$(".content_text_text").fadeTo(0, 0, function() {
		$(this).html(pages[0]).show().fadeTo(1000, 1); 
	});
		

    var dd = document.createElement('select');
    dd.setAttribute('id', 'dropdownbox');
    dd.setAttribute('class', 'dropdownbox');
//    dd.setAttribute('onchange', '$(".content_iframe").attr("src", document.getElementById("dropdownbox").value + ".html"); $(".content_text_head").fadeTo(500, 0, function() {	$(this).html(titles[ix]).show().fadeTo(1000, 1); }); $(".content_text_text").fadeTo(500, 0, function() { $(this).html(pages[ix]).show().fadeTo(1000, 1); });');
    $('.center_div')[0].appendChild(dd);
	$(".dropdownbox").change(function() {
        var idx = document.getElementById('dropdownbox').value;
        ix = idx;
		$(".content_iframe").attr("src", files[idx] + ".html");
		$(".content_text_head").fadeTo(500, 0, function() {
			$(this).html(titles[idx]).show().fadeTo(1000, 1); 
		});
		$(".content_text_text").fadeTo(500, 0, function() {
			$(this).html(pages[idx]).show().fadeTo(1000, 1); 
		}); 
	});

    for(ix=0; ix < files.length; ix++) {
        var option = document.createElement('option');
        option.appendChild(document.createTextNode(titles[ix]));
        option.setAttribute('value', '' + ix);
    
        dd.appendChild(option);
    }
	
	ix = 0;
	$(".content_nav_left").fadeTo(0, 0.6);
	$(".content_nav_left").mouseover(function() { $(this).fadeTo(500, 1); });
	$(".content_nav_left").mouseout(function() { $(this).fadeTo(500, 0.6); });
	$(".content_nav_left").click(function() {
		ix = ix > 0 ? --ix : pages.length - 1;  
		$(this).fadeOut(500).fadeIn(500);
		$(".content_iframe").attr("src", files[ix] + ".html");
		$(".content_text_head").fadeTo(500, 0, function() {
			$(this).html(titles[ix]).show().fadeTo(1000, 1); 
		});
		$(".content_text_text").fadeTo(500, 0, function() {
			$(this).html(pages[ix]).show().fadeTo(1000, 1); 
		}); 
	});
	$(".content_nav_right").fadeTo(0, 0.6);
	$(".content_nav_right").mouseover(function() { $(this).fadeTo(500, 1); });
	$(".content_nav_right").mouseout(function() { $(this).fadeTo(500, 0.6); });
	$(".content_nav_right").click(function() {
		ix = ix < pages.length - 1 ? ++ix : 0;  
		$(this).fadeOut(500).fadeIn(500);
		$(".content_iframe").attr("src", files[ix] + ".html");
		$(".content_text_head").fadeTo(500, 0, function() {
			$(this).html(titles[ix]).show().fadeTo(1000, 1); 
		});
		$(".content_text_text").fadeTo(500, 0, function() {
			$(this).html(pages[ix]).show().fadeTo(1000, 1); 
		}); 
	});
});
