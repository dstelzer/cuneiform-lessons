// Utility functions for DOM manipulation
function make_span(cls){
	let out = document.createElement("span");
	out.setAttribute("class", cls);
	return out;
}
function add_text(parent, text){
	let inner = document.createTextNode(text);
	parent.appendChild(inner);
}

// More utility functions for the dropdowns that change body classes
var dropdown_values = {};
function dropdown_load(id){
	let el = document.getElementById(id);
	let value = el.options[el.selectedIndex].value;
	dropdown_values[id] = value;
	document.body.classList.add(value);
//	alert("Loaded " + id + ", added " + value);
}
function dropdown_change(id){
	let el = document.getElementById(id);
	let value = el.options[el.selectedIndex].value;
	let old = dropdown_values[id];
	dropdown_values[id] = value;
	document.body.classList.remove(old);
	document.body.classList.add(value);
}

var cleanup_regexes = null;
function make_cleanup_regexes(){ // Take the sign_cleanup dictionary and turn it into a list of regexes for speed purposes
	cleanup_regexes = [];
	for(let [key, value] of Object.entries(sign_cleanup)){
		cleanup_regexes.push([new RegExp(key), value]);
	}
}

const SIGN = "(?:\\p{Letter}|\\p{Number}|\\+|:|×)+"; // Any sequence of letters, numbers, and three punctuation marks that can appear in sign names (+, ×, :), using non-capturing groups
const SEPS = "[\\-\\.=\\^]"; // Dash (for phonograms), dot (for logograms), equals (for clitics), caret (for determiners)
const WORD = new RegExp(`((?:${SEPS}*${SIGN})+${SEPS}*)`, "gu"); // We now allow separators optionally at either end, to avoid problems with Akkadograms (which are in their own <em> tags) leaving dangling = and - next to them
const SEPARATOR = new RegExp(`${SEPS}`, "gu");

// Create the element representing a sign: a "sign" span containing a "glyph" span (Unicode) and a "read" span (reading)
function make_sign_element(reading, unicode){
	let sign = make_span("sign");
	let glyph = make_span("glyph");
	add_text(glyph, unicode);
	let read = make_span("read");
	add_text(read, reading);
	sign.appendChild(glyph);
	sign.appendChild(read);
	return sign;
}

// Take a reading and convert it to Unicode characters
function get_unicode_for(reading){
	if(!cleanup_regexes) make_cleanup_regexes();
	
	reading = reading.toUpperCase();
	for(let [key, value] of cleanup_regexes){ // H to Ḫ etc
		reading = reading.replace(key, value);
	}
	
	if(!(reading in name_hzl)){
		console.error("Unrecognized sign name " + reading);
		return hzl_unicode["-1"];
	}
	let hzl = name_hzl[reading];
	if(!(hzl in hzl_unicode)){
		console.error("Unrecognized HZL index " + hzl + " (for " + reading + ")");
		return hzl_unicode["-1"];
	}
	return hzl_unicode[hzl];
}

// Take a word and split it up into signs, returning an array of readings
function divide_signs(word, bound){
	if(bound){
		return word_to_signs(word); // See signbreak.js
	}else{
		return word.split(SEPARATOR); // If it's a transliteration instead of a bound transcription, we only have to split by separators
	}
}

// Take a word, split it into signs, then make an element for each one and return an array of them
function shatter_word(word, bound){
	let signs = divide_signs(word, bound);
	let result = [];
	for(sign of signs){ // Not using .map here because we want to include nothing (actually nothing, not undefined) in the output if we get an empty string
		if(sign){
			result.push(make_sign_element(sign, get_unicode_for(sign)));
		}
	}
	return result;
}

// Take whitespace and embed it in an element, in case we use this for the future I guess
function shatter_whitespace(word){
	let node = make_span("whitespace");
	add_text(node, word);
	return node;
}

// Take a text element and return an array of nodes to replace it with in the translit version
function shatter_text(text, bound){
	let segments = text.split(WORD); // 1, 3, 5, etc will be the words, 0, 2, 4, etc will be whatever's in between them (or at either end)
	console.log("Segments: "+segments);
	let out = [];
	segments.forEach(function(word, index){
		if(!word) ;
		else if(index%2 == 1) out.push(...shatter_word(word, bound));
		else out.push(shatter_whitespace(word));
	});
	console.log(out);
	return out;
}

// Take an element and make two versions of it, "bound" and "translit"
function process_element(element, include_bound=true){
	// First, see if it already has a child of class "translit"
	let child = element.querySelector(".translit");
	if(child) return; // Already done, nothing to do here
	
	// Create a span of class "translit" to be a child of it
	let translit = make_span("translit");
	// And move all children over
	while(element.childNodes.length > 0) translit.appendChild(element.childNodes[0]);
	
	if(include_bound){
		// Then copy it to make "bound"
		let bound = translit.cloneNode(true); // Deep copy
		bound.setAttribute("class", "bound");
		element.appendChild(bound); // Put this first
	}
	
	// Then put them inside the element
	element.appendChild(translit);
	
	// Now we need to find all the TEXT_NODE nodes within this…which we can't do with querySelectorAll! So we need to do this manually, selecting `element` and all its descendants, then scanning the children of each one.
	let elnodes = Array.from(translit.querySelectorAll("*")); // All descendant elements - cannot get text nodes with querySelectorAll sadly
	elnodes.push(translit);
	let textnodes = [];
	for(let i=0; i<elnodes.length; i++){
		let el = elnodes[i];
		for(let j=0; j<el.childNodes.length; j++){
			let ch = el.childNodes[j];
			if(ch.nodeType == Node.TEXT_NODE){
				textnodes.push(ch);
			}
		}
	}
	console.log("Text nodes: " + textnodes.map(node => node.textContent));
	
	textnodes.forEach(node => node.replaceWith(... shatter_text(node.textContent, include_bound)) );
}

// Do this to every line on the page
function process_all(){
	let hittite = document.getElementsByClassName("hittite");
	for(let node of hittite) process_element(node, true);
	
	let signs = document.getElementsByClassName("signs");
	for(let node of signs) process_element(node, false);
}

document.addEventListener("DOMContentLoaded", process_all, false); // Run that when the whole page is ready
