import os, re, sys
GA = "G-6X5S109XKM"
repo, site = sys.argv[1], sys.argv[2]
snip = ('<!-- Google tag (gtag.js) — GA4 chung của TJ, nhãn site=%s -->\n'
        '<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>\n'
        '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'%s\',{site:\'%s\'});</script>\n') % (site, GA, GA, site)
done = skipped = replaced = 0
for root, dirs, files in os.walk(repo):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules")]
    for f in files:
        if not f.lower().endswith(".html"): continue
        p = os.path.join(root, f)
        rel = os.path.relpath(p, repo)
        s = open(p, encoding="utf-8", errors="surrogateescape").read()
        if "googletagmanager.com/gtag" in s or "gtag('config'" in s:
            n = s
            n = re.sub(r"G-[A-Z0-9]{10}", GA, n)
            n = re.sub(r"gtag\(\s*'config'\s*,\s*'%s'\s*\)" % GA, "gtag('config', '%s', {site:'%s'})" % (GA, site), n)
            if n != s: open(p, "w", encoding="utf-8", errors="surrogateescape").write(n); replaced += 1; print("đổi mã:", rel)
            else: skipped += 1
            continue
        if 'http-equiv="refresh"' in s or "location.replace" in s[:3000]:
            skipped += 1; print("bỏ qua (trang chuyển hướng):", rel); continue
        if rel.startswith("old/") or "/old/" in rel:
            skipped += 1; continue
        m = re.search(r"<head[^>]*>", s, re.I)
        if m: n = s[:m.end()] + "\n" + snip + s[m.end():]
        else:
            m = re.search(r"<html[^>]*>", s, re.I)
            n = (s[:m.end()] + "\n<head>\n" + snip + "</head>\n" + s[m.end():]) if m else (snip + s)
        open(p, "w", encoding="utf-8", errors="surrogateescape").write(n); done += 1
print(repo, "gắn mới:", done, "đổi mã:", replaced, "bỏ qua:", skipped)
