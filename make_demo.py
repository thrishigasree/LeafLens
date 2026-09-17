from pathlib import Path
import math
import subprocess

out = Path('/home/ubuntu/webdev-static-assets/signspeak-frames')
out.mkdir(parents=True, exist_ok=True)
points = [(180,270),(205,238),(230,202),(252,165),(270,130),(218,215),(235,175),(250,137),(265,103),(205,220),(200,181),(198,143),(196,108),(195,225),(183,190),(171,157),(160,129),(187,233),(168,207),(150,185),(132,169)]
bones = [(0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),(0,9),(9,10),(10,11),(11,12),(0,13),(13,14),(14,15),(15,16),(0,17),(17,18),(18,19),(19,20),(5,9),(9,13),(13,17)]
for i in range(192):
    t = i / 191
    pulse = 1 + 0.08 * math.sin(t * math.pi * 8)
    drift = math.sin(t * math.pi * 2) * 8
    circles = ''.join(f'<circle cx="{x + drift:.1f}" cy="{y * pulse + 25:.1f}" r="5" />' for x,y in points)
    lines = ''.join(f'<line x1="{points[a][0]+drift:.1f}" y1="{points[a][1]*pulse+25:.1f}" x2="{points[b][0]+drift:.1f}" y2="{points[b][1]*pulse+25:.1f}" />' for a,b in bones)
    wave = ''.join(f'<rect x="{620 + n*10}" y="{410 - (8 + 18*abs(math.sin(t*18+n*.7))):.1f}" width="5" height="{8 + 18*abs(math.sin(t*18+n*.7)):.1f}" rx="2" />' for n in range(26))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#0b0c0e"/><rect x="54" y="54" width="1172" height="612" fill="#101215" stroke="#30343a"/><path d="M54 170H1226M54 550H1226M380 54V666M900 54V666" stroke="#1e2227"/><text x="88" y="104" fill="#ff7a33" font-family="monospace" font-size="16">SIGNSPEAK / LIVE DEMO</text><text x="1040" y="104" fill="#b8c0c9" font-family="monospace" font-size="14">SIGNAL / TRACKING</text><circle cx="1208" cy="98" r="6" fill="#ff7a33"/><g fill="none" stroke="#ff7a33" stroke-width="3" opacity=".9">{lines}</g><g fill="#ece def">{circles}</g><circle cx="230" cy="250" r="170" fill="none" stroke="#ff7a33" stroke-opacity=".16"/><circle cx="230" cy="250" r="230" fill="none" stroke="#88919b" stroke-opacity=".18" stroke-dasharray="3 10"/><text x="94" y="604" fill="#b8c0c9" font-family="monospace" font-size="14">21 LANDMARKS / LOCAL PROCESSING</text><rect x="620" y="170" width="500" height="250" fill="#0b0c0e" stroke="#30343a"/><text x="660" y="220" fill="#87929e" font-family="monospace" font-size="13">RECOGNIZED GESTURE</text><text x="660" y="315" fill="#ece def" font-family="sans-serif" font-size="74" font-weight="700">PEACE</text><text x="660" y="355" fill="#ff7a33" font-family="monospace" font-size="15">meaning: “peace”</text><g fill="#ff7a33">{wave}</g><text x="660" y="455" fill="#87929e" font-family="monospace" font-size="13">VOICE OUTPUT READY</text><text x="660" y="520" fill="#ece def" font-family="sans-serif" font-size="20">Your hands have a voice.</text></svg>'''
    (out / f'frame_{i:04d}.svg').write_text(svg)
subprocess.run(['ffmpeg','-y','-framerate','24','-i',str(out/'frame_%04d.svg'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','-vf','scale=1280:-2','/home/ubuntu/webdev-static-assets/signspeak-demo.mp4'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print('/home/ubuntu/webdev-static-assets/signspeak-demo.mp4')
