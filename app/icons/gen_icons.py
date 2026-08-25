#!/usr/bin/env python3
# 纯标准库生成考研管家 PWA 图标（无第三方依赖）
# 绘制：奶油黄圆角底 + 薄荷绿书形（封面/书页/书签），品牌色一致
import zlib, struct, math, os

CREAM = (255, 248, 224)      # --bg  #fff8e0
MINT  = (95, 184, 120)       # --accent #5fb878
MINTD = (74, 156, 95)        # --accent-d #4a9c5f
PINK  = (255, 138, 166)      # --pink #ff8aa6
INK   = (61, 57, 41)         # --border #3d3929
WHITE = (255, 255, 255)

def new_canvas(s):
    # RGBA, 初始透明
    return [[(0, 0, 0, 0) for _ in range(s)] for _ in range(s)]

def put_px(c, x, y, color, alpha=255):
    if 0 <= x < len(c) and 0 <= y < len(c):
        c[y][x] = (color[0], color[1], color[2], alpha)

def fill_rect(c, x0, y0, x1, y1, color, alpha=255):
    for y in range(int(y0), int(y1)):
        for x in range(int(x0), int(x1)):
            put_px(c, x, y, color, alpha)

def fill_rounded_rect(c, x0, y0, x1, y1, r, color, alpha=255):
    for y in range(int(y0), int(y1)):
        for x in range(int(x0), int(x1)):
            # 圆角判定
            cx = x0 + r if x < x0 + r else (x1 - r if x > x1 - r else x)
            cy = y0 + r if y < y0 + r else (y1 - r if y > y1 - r else y)
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r or (x0 + r <= x <= x1 - r) or (y0 + r <= y <= y1 - r):
                put_px(c, x, y, color, alpha)

def disc(c, cx, cy, rad, color, alpha=255):
    for y in range(int(cy - rad), int(cy + rad) + 1):
        for x in range(int(cx - rad), int(cx + rad) + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad:
                put_px(c, x, y, color, alpha)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def write_png(path, c):
    s = len(c)
    raw = bytearray()
    for y in range(s):
        raw.append(0)  # filter type 0
        for x in range(s):
            r, g, b, a = c[y][x]
            raw += bytes((r, g, b, a))
    comp = zlib.compress(bytes(raw), 9)
    def chunk(typ, data):
        return struct.pack('>I', len(data)) + typ + data + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', s, s, 8, 6, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(sig)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', comp))
        f.write(chunk(b'IEND', b''))

def draw_icon(size, maskable=False):
    c = new_canvas(size)
    # 背景：maskable 需留安全区（约 80% 内容居中），普通铺满
    if maskable:
        # maskable: 与普通一致（OS 自行遮罩成圆/方），内容已在安全区内
        fill_rounded_rect(c, 0, 0, size, size, size * 0.18, CREAM)
        ox = oy = 0
        s2 = size
    else:
        # 圆角方块奶油黄底
        fill_rounded_rect(c, 0, 0, size, size, size * 0.18, CREAM)
        ox = oy = 0
        s2 = size

    # 书主体：薄荷绿圆角（居中偏上）
    bx0 = ox + s2 * 0.20
    by0 = oy + s2 * 0.24
    bx1 = ox + s2 * 0.80
    by1 = oy + s2 * 0.82
    fill_rounded_rect(c, bx0, by0, bx1, by1, s2 * 0.10, MINT)
    # 书脊（左侧深绿条）
    fill_rounded_rect(c, bx0, by0, bx0 + s2 * 0.10, by1, s2 * 0.06, MINTD)
    # 书页（白色线，右侧几道）
    for i in range(3):
        px = bx0 + s2 * (0.30 + i * 0.13)
        fill_rect(c, px, by0 + s2 * 0.10, px + s2 * 0.012, by1 - s2 * 0.10, WHITE, 230)
    # 书签（粉色三角/条，从中上垂下）
    rx = bx1 - s2 * 0.16
    fill_rect(c, rx, by0 - s2 * 0.02, rx + s2 * 0.07, by0 + s2 * 0.30, PINK)
    # 书签尾部三角
    for t in range(int(s2 * 0.08)):
        yy = int(by0 + s2 * 0.30) + t
        xx0 = int(rx + t * (s2 * 0.07) / (s2 * 0.08))
        xx1 = int(rx + s2 * 0.07 - t * (s2 * 0.07) / (s2 * 0.08))
        for x in range(xx0, xx1):
            put_px(c, x, yy, PINK)
    # 描边：手绘风深咖外框
    # 顶部/底部/左右各画 2px 深咖边
    bw = max(2, int(size * 0.012))
    for y in range(size):
        for x in range(size):
            # 检测是否邻近非透明边缘
            pass
    return c

def draw_icon_outlined(size, maskable=False):
    c = draw_icon(size, maskable)
    # 加手绘描边：对不透明像素的外侧透明邻域描深咖
    s = len(c)
    snap = [row[:] for row in c]
    for y in range(s):
        for x in range(s):
            if snap[y][x][3] == 0:
                # 看四周是否有不透明
                near = False
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < s and 0 <= ny < s and snap[ny][nx][3] > 0:
                        near = True; break
                if near:
                    c[y][x] = (INK[0], INK[1], INK[2], 255)
    return c

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    specs = [
        ('icon-192.png', 192, False),
        ('icon-512.png', 512, False),
        ('icon-maskable-512.png', 512, True),
    ]
    for name, sz, m in specs:
        c = draw_icon_outlined(sz, m)
        write_png(os.path.join(here, name), c)
        print('生成', name, sz, 'maskable=', m)
    # SVG 源
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="0" y="0" width="512" height="512" rx="92" fill="#fff8e0"/>
  <rect x="102" y="123" width="308" height="266" rx="30" fill="#5fb878" stroke="#3d3929" stroke-width="8"/>
  <rect x="102" y="123" width="31" height="266" rx="14" fill="#4a9c5f"/>
  <rect x="163" y="153" width="6" height="206" fill="#fff" opacity="0.9"/>
  <rect x="196" y="153" width="6" height="206" fill="#fff" opacity="0.9"/>
  <rect x="229" y="153" width="6" height="206" fill="#fff" opacity="0.9"/>
  <rect x="350" y="118" width="29" height="92" fill="#ff8aa6" stroke="#3d3929" stroke-width="4"/>
  <polygon points="350,210 364.5,236 379,210" fill="#ff8aa6" stroke="#3d3929" stroke-width="4"/>
</svg>'''
    with open(os.path.join(here, 'icon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)
    print('生成 icon.svg')

if __name__ == '__main__':
    main()
