"""Asset-only development server for the static Y. M. Devnikar storefront.

Accepts the Arena preview host, but never exposes Git, tooling, source docs,
folder listings or files outside this repository's public asset locations.
"""

from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
PUBLIC_PAGES = {"/", "/index.html", "/favicon.svg"}
ASSET_FOLDERS = {"css", "js", "images", "fonts"}
ASSET_SUFFIXES = {".css", ".js", ".svg", ".webp", ".png", ".jpg", ".jpeg", ".woff2", ".woff", ".ico"}


class StoreHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        try:
            path = unquote(urlsplit(self.path).path)
            parts = PurePosixPath(path).parts
            if any(part.startswith(".") for part in parts):
                raise ValueError("Private or traversal path")
            target = (ROOT / path.lstrip("/")).resolve()
            target.relative_to(ROOT)
            if path not in PUBLIC_PAGES:
                if not (len(parts) > 2 and parts[1] in ASSET_FOLDERS and target.suffix.lower() in ASSET_SUFFIXES and target.is_file()):
                    raise ValueError("Not a public asset")
        except (ValueError, OSError):
            self.send_error(404, "Not found")
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404, "Not found")
        return None

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main():
    parser = ArgumentParser(description="Serve the Y. M. Devnikar website assets")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", default=8000, type=int)
    args = parser.parse_args()
    handler = partial(StoreHandler, directory=str(ROOT))
    with ThreadingHTTPServer((args.host, args.port), handler) as server:
        print(f"Y. M. Devnikar storefront listening on {args.host}:{args.port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
