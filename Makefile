dev:
	bun './app/**/*.html'

tw:
	tailwindcss -i ./static/input.css -o ./static/output.css --watch