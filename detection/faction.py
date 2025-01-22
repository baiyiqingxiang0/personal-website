# 导入必要的库
import os
import cv2
from PIL import Image, ImageDraw, ImageFont
from parser import opt

try:
    import fastdeploy.vision as vision
    import fastdeploy as fd
    FASTDEPLOY_INSTALLED = True
except (ImportError, TypeError):
    FASTDEPLOY_INSTALLED = False

# 定义标签列表
labels_PCB = ['支线', '杂散铜', '老鼠咬', '缺失洞', '开路', '短的']
labels_Moth = ['佩戴安全帽','无安全帽']

# 全局变量
PCB_model = None
Hard_hat_model = None

# 加载字体
try:
    font = ImageFont.truetype(opt.font_path, opt.font_size)
except:
    print("警告：无法加载字体文件，将使用默认字体")
    font = ImageFont.load_default()

# 导入模型
def load_model():
    global PCB_model, Hard_hat_model
    
    if not FASTDEPLOY_INSTALLED:
        print("警告：fastdeploy 未安装，将使用模拟检测模式")
        return True
        
    try:
        option = fd.RuntimeOption()
        if opt.device.lower() == "gpu":
            option.use_gpu(opt.device_id)
            option.use_paddle_infer_backend()
            
        # 加载PPYOLOE模型
        PCB_model = vision.detection.PPYOLOE(
            os.path.join('PCB','inference.pdmodel'),
            os.path.join('PCB','inference.pdiparams'),
            os.path.join('PCB','inference.yml')
        )

        Hard_hat_model = vision.detection.PPYOLOE(
            os.path.join('Hard_hat','inference.pdmodel'),
            os.path.join('Hard_hat','inference.pdiparams'),
            os.path.join('Hard_hat','inference.yml')
        )
        return True
    except Exception as e:
        print(f"模型加载失败: {str(e)}")
        return False

# 模拟检测结果的函数
def mock_detect(cv_img):
    class MockResult:
        def __init__(self):
            self.boxes = [[100, 100, 200, 200]]  # 模拟一个检测框
            self.scores = [0.95]  # 模拟置信度
            self.label_ids = [0]  # 模拟标签ID
    return MockResult()

# 目标检测逻辑
def detect_objects(cv_img, model_name):
    # 添加图像预处理
    max_size = 1024  # 限制最大尺寸
    h, w = cv_img.shape[:2]
    scale = min(max_size/h, max_size/w)
    
    if scale < 1:
        new_h, new_w = int(h*scale), int(w*scale)
        cv_img = cv2.resize(cv_img, (new_w, new_h))
    
    if not FASTDEPLOY_INSTALLED:
        result = mock_detect(cv_img)
    else:
        try:
            if model_name == 'PCB':
                result = PCB_model.predict(cv_img)
            else:
                result = Hard_hat_model.predict(cv_img)
        except Exception as e:
            print(f"检测失败: {str(e)}")
            result = mock_detect(cv_img)

    # 使用PIL处理图像
    pil_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)

    # 批量处理检测框
    boxes = []
    for i in range(len(result.boxes)):
        if result.scores[i] >= opt.score_threshold:
            boxes.append({
                'box': result.boxes[i],
                'score': result.scores[i],
                'label_idx': result.label_ids[i]
            })

    # 批量绘制
    for box in boxes:
        x1, y1, x2, y2 = box['box']
        score = box['score']
        label_idx = box['label_idx']
        
        if model_name == 'PCB':
            label = labels_PCB[int(label_idx)]
        else:
            label = labels_Moth[int(label_idx)]

        draw.rectangle([(x1, y1), (x2, y2)], outline=(0, 255, 0), width=4)
        draw.text((x1, y1 - opt.font_size), f"{label}: {score:.2f}", 
                 font=font, fill=get_text_color(opt.text_color))

    # 压缩输出图像
    output_size = (800, 800)  # 设置合适的输出尺寸
    pil_img.thumbnail(output_size, Image.LANCZOS)
    
    return pil_img

def get_text_color(text_color):
    if text_color == 'red':
        return (255, 0, 0)
    elif text_color == 'green':
        return (0, 255, 0)
    elif text_color == 'blue':
        return (0, 0, 255)


def resize_and_pad(img, size, fill=(255, 255, 255)):
    w, h = img.size
    tw, th = size
    if w > tw or h > th:  # 如果图片尺寸大于画布尺寸，则缩放图片
        img.thumbnail(size, Image.LANCZOS)
        new_size = size
    else:  # 如果图片尺寸小于画布尺寸，则填充图片
        ratio = min(float(tw)/float(w), float(th)/float(h))
        new_size = (int(w*ratio), int(h*ratio))
        img = img.resize(new_size, Image.LANCZOS)

    new_img = Image.new("RGB", size, fill)
    new_img.paste(img, (int((tw-new_size[0])/2), int((th-new_size[1])/2)))
    return new_img