
from http.server import BaseHTTPRequestHandler, HTTPServer

# Start in the healthy state
website_is_down = False


class TestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/down":
            global website_is_down
            website_is_down = True

        elif self.path == "/up":
            website_is_down = False

        if website_is_down:
            self.send_response(503)
            message = b"Test website is DOWN"
        else:
            self.send_response(200)
            message = b"Test website is UP"

        self.end_headers()
        self.wfile.write(message)

    def log_message(self, format, *args):
        print(format % args)


server = HTTPServer(("127.0.0.1", 9000), TestHandler)
print("Test website running at http://127.0.0.1:9000")
server.serve_forever()
