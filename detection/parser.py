import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--model_path", type=str, default='PCB', help="模型路径")
parser.add_argument("--font_size", type=int, default=50, help="标签文字的大小")
parser.add_argument("--font_path", type=str, default="chinese.TTF", help="字体文件路径")
parser.add_argument("--score_threshold", type=float, default=0.5, help="置信度阈值")
parser.add_argument("--text_color", type=str, default='red', help="标签文字的颜色")
parser.add_argument("--device", type=str, default='gpu', help="cpu or gpu")
parser.add_argument("--device_id", type=int, default=0, help="GPU设备ID")
opt, unknown = parser.parse_known_args()
print(opt)
