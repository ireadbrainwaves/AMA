#!/usr/bin/env python3
"""
Sprite Pipeline Processor
Takes a Midjourney (or any) image and outputs a game-ready transparent PNG sprite.

Steps:
  1. Background removal (flood-fill from edges, color-key, or AI)
  2. Auto-crop to content bounds
  3. Nearest-neighbor downscale to target resolution
  4. Optional color palette reduction (for retro/SNES aesthetic)
  5. Export as transparent PNG

Usage:
  python process_sprite.py input.png -o sprite.png -s 128 -c 32
  python process_sprite.py input.png -o sprite.png -s 64 -c 16 --padding 4
  python process_sprite.py input.png -o sprite.png --key-color "#1a0a2e"
  python process_sprite.py folder/ -o sprites/ -s 128 -c 32  # batch mode
"""

import argparse
import os
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


def remove_background_floodfill(img: Image.Image, tolerance: int = 50, dark_threshold: int = 80) -> Image.Image:
    """Remove background via flood-fill from image edges.

    How it works:
    1. Start from every edge pixel
    2. Flood-fill inward, marking pixels as transparent if they're
       similar to their neighbors AND are relatively dark (background-like)
    3. Stop when hitting bright/saturated pixels (the character)

    This is ideal for Midjourney game art where:
    - The character is centered
    - The background is a dark arena/environment
    - The subject has brighter/more saturated colors than the background
    """
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()

    # Track which pixels to make transparent
    transparent = [[False] * w for _ in range(h)]
    visited = [[False] * w for _ in range(h)]

    def is_dark(r, g, b):
        """Check if a pixel is dark enough to be background."""
        luminance = 0.299 * r + 0.587 * g + 0.114 * b
        return luminance < dark_threshold

    def colors_similar(c1, c2, tol):
        """Check if two RGB colors are within tolerance."""
        return all(abs(a - b) < tol for a, b in zip(c1[:3], c2[:3]))

    # Seed the flood-fill from all edge pixels
    queue = deque()
    for x in range(w):
        for y in [0, h - 1]:
            queue.append((x, y))
        # Also seed from left/right edges
    for y in range(h):
        for x in [0, w - 1]:
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[y][x]:
            continue
        visited[y][x] = True

        r, g, b, a = pixels[x, y]

        # If the pixel is dark enough, mark as background
        if is_dark(r, g, b):
            transparent[y][x] = True
            # Spread to neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                    nr, ng, nb, _ = pixels[nx, ny]
                    if colors_similar((r, g, b), (nr, ng, nb), tolerance):
                        queue.append((nx, ny))

    # Apply transparency
    for y in range(h):
        for x in range(w):
            if transparent[y][x]:
                pixels[x, y] = (0, 0, 0, 0)

    return img


def remove_background_colorkey(img: Image.Image, key_color: str, tolerance: int = 40) -> Image.Image:
    """Remove background by color-keying a specific color.

    Straightforward approach: any pixel close to the key color becomes transparent.
    Good when you know the exact background color.
    """
    img = img.convert("RGBA")
    pixels = img.load()

    key_color = key_color.lstrip("#")
    kr = int(key_color[0:2], 16)
    kg = int(key_color[2:4], 16)
    kb = int(key_color[4:6], 16)

    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if abs(r - kr) < tolerance and abs(g - kg) < tolerance and abs(b - kb) < tolerance:
                pixels[x, y] = (0, 0, 0, 0)

    return img


def remove_background_ai(img: Image.Image) -> Image.Image:
    """Remove background using rembg AI model.

    Requires: pip install rembg[cpu] --break-system-packages
    First run downloads a ~170MB model.

    Best for complex backgrounds where flood-fill struggles.
    """
    try:
        from rembg import remove
        return remove(img)
    except ImportError:
        print("WARNING: rembg not installed. Install with: pip install rembg[cpu] --break-system-packages")
        print("Falling back to flood-fill method.")
        return remove_background_floodfill(img)


def auto_crop(img: Image.Image, padding: int = 2) -> Image.Image:
    """Crop to the bounding box of non-transparent pixels, with optional padding."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    bbox = img.getbbox()
    if bbox is None:
        return img

    left, upper, right, lower = bbox
    left = max(0, left - padding)
    upper = max(0, upper - padding)
    right = min(img.width, right + padding)
    lower = min(img.height, lower + padding)

    return img.crop((left, upper, right, lower))


def resize_nearest(img: Image.Image, target_size: int) -> Image.Image:
    """Resize to target size using nearest-neighbor (preserves pixel crispness).

    Maintains aspect ratio, fitting within target_size x target_size.
    """
    w, h = img.size
    if w >= h:
        new_w = target_size
        new_h = max(1, int(h * target_size / w))
    else:
        new_h = target_size
        new_w = max(1, int(w * target_size / h))

    return img.resize((new_w, new_h), Image.NEAREST)


def reduce_colors(img: Image.Image, num_colors: int) -> Image.Image:
    """Reduce the color palette to N colors for retro/SNES aesthetic.

    Preserves transparency by separating alpha channel, quantizing RGB,
    then recompositing.
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    r, g, b, a = img.split()

    rgb = Image.merge("RGB", (r, g, b))
    quantized = rgb.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT)
    quantized_rgb = quantized.convert("RGB")

    result = quantized_rgb.convert("RGBA")
    result.putalpha(a)

    return result


def make_square(img: Image.Image) -> Image.Image:
    """Pad image to square dimensions (useful for sprite sheets)."""
    w, h = img.size
    size = max(w, h)
    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset_x = (size - w) // 2
    offset_y = (size - h) // 2
    square.paste(img, (offset_x, offset_y), img)
    return square


def smooth_alpha_edges(img: Image.Image, iterations: int = 1) -> Image.Image:
    """Clean up jagged transparency edges with a slight blur on the alpha channel.

    Useful after color-key or flood-fill removal to smooth stairstepping.
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    r, g, b, a = img.split()

    for _ in range(iterations):
        a = a.filter(ImageFilter.MedianFilter(3))

    return Image.merge("RGBA", (r, g, b, a))


def process_single(
    input_path: str,
    output_path: str,
    target_size: int = 128,
    num_colors: int | None = None,
    method: str = "flood",  # "flood", "colorkey", "ai", "none"
    key_color: str | None = None,
    color_tolerance: int = 40,
    dark_threshold: int = 80,
    padding: int = 2,
    square: bool = False,
    smooth_edges: bool = True,
) -> dict:
    """Process a single image through the full sprite pipeline."""
    img = Image.open(input_path).convert("RGBA")
    original_size = img.size
    steps = []

    # Step 1: Background removal
    if method == "none":
        steps.append("bg_removal: skipped")
    elif method == "colorkey":
        if not key_color:
            key_color = "#1a0a2e"  # default dark purple (common Midjourney bg)
        img = remove_background_colorkey(img, key_color, color_tolerance)
        steps.append(f"bg_removal: color-key {key_color} (tolerance {color_tolerance})")
    elif method == "ai":
        img = remove_background_ai(img)
        steps.append("bg_removal: rembg AI")
    else:  # flood (default)
        img = remove_background_floodfill(img, tolerance=color_tolerance, dark_threshold=dark_threshold)
        steps.append(f"bg_removal: flood-fill (dark<{dark_threshold}, tolerance {color_tolerance})")

    # Step 1b: Smooth alpha edges
    if smooth_edges and method != "none":
        img = smooth_alpha_edges(img)
        steps.append("edge_smooth: median filter")

    # Step 2: Auto-crop
    img = auto_crop(img, padding=padding)
    steps.append(f"auto_crop: {img.size[0]}x{img.size[1]} (padding {padding})")

    # Step 3: Resize
    img = resize_nearest(img, target_size)
    steps.append(f"resize: {img.size[0]}x{img.size[1]} (nearest-neighbor)")

    # Step 4: Color reduction
    if num_colors:
        img = reduce_colors(img, num_colors)
        steps.append(f"palette: {num_colors} colors")

    # Step 5: Square padding (optional)
    if square:
        img = make_square(img)
        steps.append(f"squared: {img.size[0]}x{img.size[1]}")

    # Export
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    img.save(output_path, "PNG", optimize=True)
    file_size = os.path.getsize(output_path)

    return {
        "input": input_path,
        "output": output_path,
        "original_size": f"{original_size[0]}x{original_size[1]}",
        "final_size": f"{img.size[0]}x{img.size[1]}",
        "file_size_kb": round(file_size / 1024, 1),
        "steps": steps,
    }


def process_batch(input_dir: str, output_dir: str, **kwargs) -> list[dict]:
    """Process all images in a directory."""
    results = []
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extensions = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
    files = sorted(f for f in input_path.iterdir() if f.suffix.lower() in extensions)

    if not files:
        print(f"No image files found in {input_dir}")
        return results

    print(f"Processing {len(files)} images...")
    for i, f in enumerate(files):
        out_file = output_path / f"{f.stem}_sprite.png"
        print(f"  [{i+1}/{len(files)}] {f.name} -> {out_file.name}")
        try:
            result = process_single(str(f), str(out_file), **kwargs)
            results.append(result)
            print(f"    Done: {result['final_size']}, {result['file_size_kb']}KB")
        except Exception as e:
            print(f"    ERROR: {e}")
            results.append({"input": str(f), "error": str(e)})

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Process images into game-ready sprite PNGs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Default: flood-fill bg removal, 128px, 32 colors
  python process_sprite.py gorilla.png -o gorilla_sprite.png -s 128 -c 32

  # Color-key removal for known bg color
  python process_sprite.py gorilla.png -o gorilla_sprite.png --method colorkey --key-color "#1a0a2e"

  # Batch a whole folder
  python process_sprite.py ./downloads/ -o ./sprites/ -s 64 -c 16

  # Skip bg removal (for VFX overlays)
  python process_sprite.py blast.png -o blast_sprite.png --method none -s 64

  # Adjust dark threshold (higher = more aggressive bg removal)
  python process_sprite.py complex.png -o sprite.png --dark-threshold 100
        """,
    )

    parser.add_argument("input", help="Input image file or directory (for batch mode)")
    parser.add_argument("-o", "--output", required=True, help="Output file or directory")
    parser.add_argument("-s", "--size", type=int, default=128, help="Target size in pixels (default: 128)")
    parser.add_argument("-c", "--colors", type=int, default=None, help="Reduce palette to N colors (e.g., 16, 32)")
    parser.add_argument("-m", "--method", choices=["flood", "colorkey", "ai", "none"], default="flood",
                        help="Background removal method (default: flood)")
    parser.add_argument("--key-color", type=str, default=None, help="Hex color for colorkey method (default: #1a0a2e)")
    parser.add_argument("--tolerance", type=int, default=50, help="Color similarity tolerance (default: 50)")
    parser.add_argument("--dark-threshold", type=int, default=80, help="Luminance threshold for flood-fill (default: 80)")
    parser.add_argument("--padding", type=int, default=2, help="Padding around cropped sprite (default: 2)")
    parser.add_argument("--square", action="store_true", help="Pad output to square dimensions")
    parser.add_argument("--no-smooth", action="store_true", help="Skip alpha edge smoothing")

    args = parser.parse_args()

    kwargs = dict(
        target_size=args.size,
        num_colors=args.colors,
        method=args.method,
        key_color=args.key_color,
        color_tolerance=args.tolerance,
        dark_threshold=args.dark_threshold,
        padding=args.padding,
        square=args.square,
        smooth_edges=not args.no_smooth,
    )

    if os.path.isdir(args.input):
        results = process_batch(args.input, args.output, **kwargs)
        succeeded = len([r for r in results if "error" not in r])
        print(f"\nBatch complete: {succeeded}/{len(results)} succeeded")
    else:
        result = process_single(args.input, args.output, **kwargs)
        print(f"Done: {result['output']}")
        print(f"  Original: {result['original_size']}")
        print(f"  Final:    {result['final_size']}")
        print(f"  Size:     {result['file_size_kb']}KB")
        for step in result["steps"]:
            print(f"  Step:     {step}")


if __name__ == "__main__":
    main()
