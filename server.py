#!/usr/bin/env python3
import os
import re
import tempfile
from urllib.parse import urlparse

import requests
from flask import Flask, Response, jsonify, request, send_from_directory, stream_with_context

ROOT = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=ROOT, static_url_path="")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA})
MEDIA_EXT = {
    ".mp4", ".webm", ".mkv", ".mov", ".mp3", ".m4a", ".wav", ".ogg",
    ".pdf", ".zip", ".7z", ".rar", ".iso", ".png", ".jpg", ".jpeg", ".webp", ".gif",
}


def normalize_url(raw):
    url = (raw or "").strip()
    if not url:
        return ""
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return ""
    return url


def is_direct_file(url):
    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in MEDIA_EXT)


def safe_filename(name, fallback="download.mp4"):
    name = re.sub(r"[^\w.\- ()\[\]]+", "_", name or "")[:120].strip(" ._")
    return name or fallback


def format_duration(seconds):
    try:
        seconds = int(seconds)
    except (TypeError, ValueError):
        return ""
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def format_size(n):
    try:
        n = int(n)
    except (TypeError, ValueError):
        return ""
    if n >= 1024 ** 3:
        return f"{n / 1024 ** 3:.1f} GB"
    if n >= 1024 ** 2:
        return f"{n / 1024 ** 2:.1f} MB"
    if n >= 1024:
        return f"{n / 1024:.0f} KB"
    return f"{n} B"


def ytdlp_extract(url):
    from yt_dlp import YoutubeDL

    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "extract_flat": False,
        "http_headers": {"User-Agent": UA},
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
    }
    with YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def pick_formats(info):
    rows = []
    seen = set()
    items = info.get("formats") or []
    progressive = []
    audio_only = []
    for fmt in items:
        vcodec = (fmt.get("vcodec") or "none")
        acodec = (fmt.get("acodec") or "none")
        dl = fmt.get("url")
        if not dl:
            continue
        height = fmt.get("height") or 0
        ext = (fmt.get("ext") or "mp4").lower()
        if vcodec != "none" and acodec != "none":
            progressive.append((height, ext, fmt, dl))
        elif vcodec == "none" and acodec != "none":
            audio_only.append((fmt.get("abr") or 0, ext, fmt, dl))

    progressive.sort(key=lambda x: x[0], reverse=True)
    for height, ext, fmt, dl in progressive:
        quality = f"{height}p" if height else (fmt.get("format_note") or "Video")
        key = ("mp4", quality)
        if key in seen:
            continue
        seen.add(key)
        rows.append({
            "fmt": ext.upper() if ext else "MP4",
            "quality": quality,
            "size": format_size(fmt.get("filesize") or fmt.get("filesize_approx")),
            "url": dl,
            "mp3": False,
            "filename": safe_filename((info.get("title") or "video") + f"-{quality}.mp4"),
        })
        if len(rows) >= 5:
            break

    audio_only.sort(key=lambda x: x[0], reverse=True)
    if audio_only:
        abr, ext, fmt, dl = audio_only[0]
        q = f"{int(abr)}kbps" if abr else "Audio"
        rows.append({
            "fmt": "MP3" if ext in ("mp3", "m4a") else ext.upper(),
            "quality": q,
            "size": format_size(fmt.get("filesize") or fmt.get("filesize_approx")),
            "url": dl,
            "mp3": True,
            "filename": safe_filename((info.get("title") or "audio") + ".mp3"),
        })
    return rows


def analyze_direct(url):
    name = os.path.basename(urlparse(url).path) or "file"
    size = ""
    ctype = ""
    try:
        head = SESSION.head(url, timeout=12, allow_redirects=True)
        if head.ok:
            size = format_size(head.headers.get("Content-Length"))
            ctype = head.headers.get("Content-Type", "")
            cd = head.headers.get("Content-Disposition") or ""
            m = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)', cd, re.I)
            if m:
                name = m.group(1).strip()
    except requests.RequestException:
        pass
    ext = (os.path.splitext(name)[1] or "").lstrip(".").upper() or "FILE"
    kind = "video" if ext.lower() in ("mp4", "webm", "mkv", "mov") else (
        "audio" if ext.lower() in ("mp3", "m4a", "wav", "ogg") else "file"
    )
    return {
        "ok": True,
        "kind": kind,
        "title": name,
        "host": urlparse(url).hostname or "",
        "thumbnail": url if kind == "video" else "",
        "duration": "",
        "formats": [{
            "fmt": ext,
            "quality": "Original",
            "size": size or ctype,
            "url": url,
            "mp3": kind == "audio",
            "filename": safe_filename(name, "download"),
        }],
    }


def analyze_media(url):
    if is_direct_file(url):
        return analyze_direct(url)
    try:
        info = ytdlp_extract(url)
    except Exception as exc:
        return {"ok": False, "error": str(exc).split("\n")[0][:240]}
    if info.get("_type") == "playlist" and info.get("entries"):
        info = info["entries"][0] or {}
    formats = pick_formats(info)
    if not formats:
        direct = info.get("url")
        if direct:
            formats = [{
                "fmt": (info.get("ext") or "MP4").upper(),
                "quality": "Best",
                "size": "",
                "url": direct,
                "mp3": False,
                "filename": safe_filename((info.get("title") or "video") + ".mp4"),
            }]
    if not formats:
        return {"ok": False, "error": "No downloadable MP4 found for this link."}
    thumb = ""
    if info.get("thumbnail"):
        thumb = info["thumbnail"]
    elif info.get("thumbnails"):
        thumb = info["thumbnails"][-1].get("url") or ""
    return {
        "ok": True,
        "kind": "audio" if info.get("vcodec") == "none" else "video",
        "title": info.get("title") or "Video",
        "host": urlparse(info.get("webpage_url") or url).hostname or "",
        "thumbnail": thumb,
        "duration": format_duration(info.get("duration")),
        "formats": formats,
    }


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


@app.post("/api/analyze")
def api_analyze():
    data = request.get_json(silent=True) or {}
    url = normalize_url(data.get("url") or request.form.get("url"))
    if not url:
        return jsonify({"ok": False, "error": "Enter a valid http or https URL."}), 400
    result = analyze_media(url)
    code = 200 if result.get("ok") else 422
    return jsonify(result), code


@app.get("/api/file")
def api_file():
    url = normalize_url(request.args.get("url"))
    filename = safe_filename(request.args.get("filename") or "download.mp4")
    if not url:
        return jsonify({"ok": False, "error": "Missing file URL."}), 400
    headers = {"User-Agent": UA, "Accept": "*/*"}
    ref = request.args.get("referer")
    host = (urlparse(url).hostname or "").lower()
    if ref:
        headers["Referer"] = ref
    elif "googlevideo.com" in host or "youtube.com" in host:
        headers["Referer"] = "https://www.youtube.com/"
    elif "tiktok" in host:
        headers["Referer"] = "https://www.tiktok.com/"
    elif "instagram" in host or "cdninstagram" in host:
        headers["Referer"] = "https://www.instagram.com/"
    try:
        upstream = SESSION.get(url, headers=headers, stream=True, timeout=30, allow_redirects=True)
        upstream.raise_for_status()
    except requests.RequestException as exc:
        return jsonify({"ok": False, "error": f"Could not fetch file: {exc}"}), 502
    ctype = upstream.headers.get("Content-Type") or "application/octet-stream"
    if "text/html" in ctype:
        upstream.close()
        return jsonify({"ok": False, "error": "This link is a webpage, not a media file."}), 422

    def generate():
        try:
            for chunk in upstream.iter_content(chunk_size=1024 * 64):
                if chunk:
                    yield chunk
        finally:
            upstream.close()

    resp = Response(stream_with_context(generate()), status=200, content_type=ctype)
    resp.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    cl = upstream.headers.get("Content-Length")
    if cl:
        resp.headers["Content-Length"] = cl
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.post("/api/save")
def api_save():
    url = normalize_url((request.get_json(silent=True) or {}).get("url") or request.form.get("url"))
    quality = request.args.get("q") or (request.get_json(silent=True) or {}).get("quality") or "best"
    if not url:
        return jsonify({"ok": False, "error": "Missing URL."}), 400
    if is_direct_file(url):
        return api_file()
    from yt_dlp import YoutubeDL
    tmp = tempfile.mkdtemp(prefix="fetchora_")
    outtmpl = os.path.join(tmp, "%(title).80s.%(ext)s")
    fmt = "bv*+ba/b"
    if quality.endswith("p") and quality[:-1].isdigit():
        h = quality[:-1]
        fmt = f"bv*[height<={h}]+ba/b[height<={h}]/b"
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "format": fmt,
        "merge_output_format": "mp4",
        "outtmpl": outtmpl,
        "http_headers": {"User-Agent": UA},
    }
    try:
        with YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            path = ydl.prepare_filename(info)
            if not os.path.exists(path):
                base, _ = os.path.splitext(path)
                for ext in (".mp4", ".webm", ".mkv", ".m4a", ".mp3"):
                    if os.path.exists(base + ext):
                        path = base + ext
                        break
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc).split("\n")[0][:240]}), 422
    if not os.path.exists(path):
        return jsonify({"ok": False, "error": "Download failed."}), 500
    folder, name = os.path.split(path)
    return send_from_directory(folder, name, as_attachment=True, download_name=safe_filename(name))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), debug=False)
