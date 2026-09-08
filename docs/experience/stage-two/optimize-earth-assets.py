"""Rebuild delivery maps from downloaded NASA originals; never serve sources/."""
from pathlib import Path
from PIL import Image
import argparse
parser=argparse.ArgumentParser()
parser.add_argument("sources", type=Path)
parser.add_argument("output", type=Path)
args=parser.parse_args()
args.output.mkdir(parents=True,exist_ok=True)
root = args.output
for output, dimensions, quality in [
    ('earth-day-4096.webp', (4096, 2048), 88),
    ('earth-day-2048.webp', (2048, 1024), 84),
]:
    Image.open(args.sources / 'world.200407.3x5400x2700.jpg').convert('RGB').resize(
        dimensions, Image.Resampling.LANCZOS
    ).save(root / output, 'WEBP', quality=quality, method=6)
for output, dimensions, quality in [
    ('earth-clouds-2048.webp', (2048, 1024), 70),
    ('earth-clouds-1024.webp', (1024, 512), 70),
]:
    Image.open(args.sources / 'cloud_combined_2048.jpg').convert('L').resize(
        dimensions, Image.Resampling.LANCZOS
    ).save(root / output, 'WEBP', quality=quality, method=6)
