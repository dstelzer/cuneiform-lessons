%.html: %.md _head.html _top.html _bottom.html
	pandoc -s --toc \
	--from markdown+smart+auto_identifiers+pandoc_title_block
	-c style.css -H _head.html -B _top.html -A _bottom.html \
	%.md -o %.html

# Enabled by default: +fenced_divs+bracketed_spans+inline_notes
