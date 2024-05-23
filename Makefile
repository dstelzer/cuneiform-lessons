%.html: %.md _head.html _top.html _bottom.html
	pandoc -s --toc \
	--filter pandoc-sidenote \
	-c style.css -H _head.html -B _top.html -A _bottom.html \
	--from markdown+smart+auto_identifiers+pandoc_title_block \
	cuneiform.md -o cuneiform.html
#	%.md -o %.html

all: cuneiform.html

# Enabled by default: +fenced_divs+bracketed_spans+inline_notes
