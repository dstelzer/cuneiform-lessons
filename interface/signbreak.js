// This is a very direct translation from signbreak.py

const LONG2SHORT = {
	'ā' : 'a',
	'ē' : 'e',
	'ī' : 'i',
	'ō' : 'o',
	'ū' : 'u',
	'â' : 'a',
	'ê' : 'e',
	'î' : 'i',
	'ô' : 'o',
	'û' : 'u',
}

const REPLACE = { // Sometimes the sign used in Hittite isn't the one with the most obvious name; for example, PI isn't used in Hittite (it's Hittite /wa/) and PÍ is used instead
	'pi' : 'pí',
	'bi' : 'bí',
	'pe' : 'pé',
	'be' : 'bé',
	'wi' : 'wi₅',
	'ḫe' : 'ḫé', // These two have both he/ze and hé/zé used in Hittite, but
	'ze' : 'zé', // the second ones are distinct from hi/zi and thus better
}

const SEP = /[\.\-=\^]/u; // . - = ^ are things that can separate signs within a word
const V = "[aeiouāēīōūâêîôû]";
const C = "[bcdfghjklmnpqrstvwxyzšḫṣṭḳśŋĝř]";
const ONLYSEPS = /^[\.\-=\^]*$/u; // Only separators, nothing else

const FIXED = new Set(["pát", "kán", ":"]); // Hittite words written phonetically but with specific signs (and the Glossenkeil which has no Cs or Vs in it)

function syllabify(s){
	// First, we draw the syllable boundaries
	// If a vowel has one or more consonants before it, put a boundary before the first one
	s = s.replace(RegExp(`(${C}${V})`, "gu"), "+$1");
	// Then, if two vowels are next to each other, put a boundary between them
	s = s.replace(RegExp(`(${V})(${V})`, "gu"), "$1+$2");
	// Now we can break our word at these boundaries, and we're *almost* done
	let sylls = s.split("+");
	// But we might have a stray '' at the beginning, if the word started with a consonant
	// We could also have a stray consonant or cluster at the beginning, if words were allowed to start with multiple consonants, but Hittite doesn't allow that (at least not the way it's usually transcribed)
	if(!sylls[0]) sylls.shift();
	console.log(sylls);
	return sylls;
}

// Turn a word into a list of signs
function word_to_signs(s){
	if(ONLYSEPS.test(s)) return []; // If we get a word that's only separators, or is empty, don't try to parse it any further
	
	// If there are sign boundaries inside it, respect them
	let parts = s.split(SEP) // Break it at explicit sign boundaries
	if(parts.length > 1){
		let out = []; // Recurse on the parts, combining the lists it returns
		for(let i=0; i<parts.length; i++){
			out.push(...word_to_signs(parts[i]));
		}
		return out;
	}
	
	// If it's entirely in capitals, it's a sumerogram, don't try to divide it
	if(s == s.toUpperCase()) return [s];
	else s = s.toLowerCase(); // In case someone capitalizes the first letter of a name or whatever
	
	// If it's a "fixed word", that's always written the same way in Hittite, respect that too
	if(FIXED.has(s)) return [s];
	
	// Otherwise, we've got one or more syllables on our hand! Let's try to break them down!
	let sylls = syllabify(s);
	
	// And now, just break down each syllable
	let out = [];
	for(let i=0; i<sylls.length; i++){
		out.push(...syllable_to_signs(sylls[i]));
	}
	
	// And run the replacements just to be safe
	for(let i=0; i<out.length; i++){
		if(out[i] in REPLACE){
			out[i] = REPLACE[out[i]];
		}
	}
	
	return out;
}

function syllable_to_signs(s){
	let pieces = s.split(RegExp(`(${V})`, "gu"));
	if(pieces.length != 3){
		console.error(`PROBLEM: Couldn't break syllable ${s} into onset/nucleus/coda, ended up with ${pieces}!`);
		return ['XXX']; // Error code
	}
	
	let [onset, nucleus, coda] = pieces;
	let plene = false;
	if(nucleus in LONG2SHORT){
		nucleus = LONG2SHORT[nucleus];
		plene = true;
	}
	if(!onset && !coda){ // Gotta include the vowel as its own unit if it wouldn't be included in a CV or VC sign
		plene = true;
	}
	
	// There are no separate Co and oC signs in Hittite, if o even exists
	let o = false;
	if(nucleus == "o"){
		nucleus = "u";
		o = true;
	}
	
	let out = [];
	
	if(onset){
		// A couple defects in the Hittite spelling system require us to be circumspect here
		// Transcriptions generally shouldn't include spellings like "we" but sometimes they do and we should be prepared
		if(onset == "w" && nucleus != "a" && nucleus != "i"){
			out.push("ú");
			plene = true;
		}else if(onset == "y" && nucleus != "a"){
			out.push("i");
			plene = true;
		}else{
			out.push(onset + nucleus); // Can't be more than one consonant in Hittite
		}
	}
	if(plene){
		if(nucleus == "u" && !o){
			out.push("ú") // Use the ú sign for /u/ and the u sign for /o/
		}else if(o){
			out.push("o"); // Disable this if you want to call it "u" instead
		}else{
			out.push(nucleus);
		}
	}
	for(let i=0; i<coda.length; i++){ // Multiple coda consonants are possible
		out.push(nucleus + coda[i]);
	}
	
	return out;
}
