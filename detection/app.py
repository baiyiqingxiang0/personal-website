from flask import Flask, request, send_file, jsonify, make_response
import cv2
import numpy as np
from PIL import Image
import io
import os
from faction import load_model, detect_objects

app = Flask(__name__, static_folder='static')

# 添加调试信息
print(f"静态文件夹路径: {app.static_folder}")
print(f"静态文件是否存在:")
print(f"index.html: {os.path.exists(os.path.join(app.static_folder, 'index.html'))}")
print(f"style.css: {os.path.exists(os.path.join(app.static_folder, 'style.css'))}")
print(f"script.js: {os.path.exists(os.path.join(app.static_folder, 'script.js'))}")

# 初始化模型
if not load_model():
    print("警告：模型加载失败，将使用模拟检测模式")

@app.route('/')
def index():
    try:
        return app.send_static_file('index.html')
    except Exception as e:
        return f"错误：{str(e)}", 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    return app.send_static_file(filename)

@app.route('/detect', methods=['POST'])
def detect():
    try:
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
        
        file = request.files['image']
        model_name = request.form.get('model_name', 'PCB')
        
        # 读取图片并进行初步压缩
        image_bytes = file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 进行检测
        result_img = detect_objects(cv_img, model_name)
        
        # 将结果转换为字节流，使用JPEG格式减小文件大小
        img_byte_arr = io.BytesIO()
        result_img.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr.seek(0)
        
        # 添加缓存控制
        response = make_response(send_file(img_byte_arr, mimetype='image/jpeg'))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 