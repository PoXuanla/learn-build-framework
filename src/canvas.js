// Canvas 图片文字编辑器
class CanvasEditor {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.backgroundImage = null;
    this.textObjects = [];
    this.selectedText = null;
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null; // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.originalScale = { x: 1, y: 1 };
    this.isEditing = false;
    this.editInput = null;
    this.lastClickTime = 0;
    this.doubleClickDelay = 300; // 双击时间间隔
    this.isOverlayMode = false;
    this.overlay = null;
    this.overlayInput = null;
    this.trashCan = null;
    this.isOverTrash = false;

    this.init();
  }

  init() {
    // 绑定事件监听器
    this.bindEvents();

    // 设置canvas背景色
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 初始化控件值显示
    this.updateRangeDisplay();
  }

  bindEvents() {
    // 图片上传
    document.getElementById("imageInput").addEventListener("change", (e) => {
      this.loadBackgroundImage(e.target.files[0]);
    });

    // Canvas鼠标事件
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("dblclick", (e) => this.handleDoubleClick(e));

    // 控件事件
    document.getElementById("fontSize").addEventListener("input", (e) => {
      this.updateSelectedTextProperty("fontSize", parseInt(e.target.value));
      this.updateRangeDisplay();
    });

    document.getElementById("rotation").addEventListener("input", (e) => {
      this.updateSelectedTextProperty("rotation", parseInt(e.target.value));
      this.updateRangeDisplay();
    });

    document.getElementById("textColor").addEventListener("change", (e) => {
      this.updateSelectedTextProperty("color", e.target.value);
    });

    document.getElementById("fontFamily").addEventListener("change", (e) => {
      this.updateSelectedTextProperty("fontFamily", e.target.value);
    });

    // 点击canvas外部时结束编辑
    document.addEventListener("click", (e) => {
      if (
        this.isEditing &&
        !this.canvas.contains(e.target) &&
        e.target !== this.editInput
      ) {
        this.finishEditing();
      }
    });
  }

  loadBackgroundImage(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.backgroundImage = img;
        this.redraw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  addText() {
    const textInput = document.getElementById("textInput");
    const text = textInput.value.trim();

    if (!text) {
      alert("请输入文字内容");
      return;
    }

    this.createTextObject(text);

    // 清空输入框
    textInput.value = "";
  }

  // 新增：显示覆盖层输入模式
  showOverlayInput() {
    if (this.isOverlayMode) return;

    this.isOverlayMode = true;

    // 创建半透明黑色遮罩
    this.overlay = document.createElement("div");
    this.overlay.style.position = "fixed";
    this.overlay.style.top = "0";
    this.overlay.style.left = "0";
    this.overlay.style.width = "100%";
    this.overlay.style.height = "100%";
    this.overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.overlay.style.zIndex = "9999";
    this.overlay.style.display = "flex";
    this.overlay.style.alignItems = "center";
    this.overlay.style.justifyContent = "center";
    this.overlay.style.backdropFilter = "blur(2px)";

    // 创建输入容器
    const inputContainer = document.createElement("div");
    inputContainer.style.textAlign = "center";
    inputContainer.style.padding = "30px";
    inputContainer.style.borderRadius = "12px";
    inputContainer.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    inputContainer.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";
    inputContainer.style.minWidth = "400px";

    // 创建标题
    const title = document.createElement("h3");
    title.textContent = "输入文字内容";
    title.style.margin = "0 0 20px 0";
    title.style.color = "#333";
    title.style.fontSize = "18px";
    title.style.fontWeight = "500";

    // 创建输入框
    this.overlayInput = document.createElement("textarea");
    this.overlayInput.placeholder = "请输入文字内容...";
    this.overlayInput.style.width = "100%";
    this.overlayInput.style.minHeight = "120px";
    this.overlayInput.style.padding = "15px";
    this.overlayInput.style.border = "2px solid #007bff";
    this.overlayInput.style.borderRadius = "8px";
    this.overlayInput.style.fontSize = "16px";
    this.overlayInput.style.fontFamily = "inherit";
    this.overlayInput.style.outline = "none";
    this.overlayInput.style.resize = "vertical";
    this.overlayInput.style.boxSizing = "border-box";

    // 创建提示文字
    const hint = document.createElement("p");
    hint.textContent = "按 Enter 确认，按 Escape 取消";
    hint.style.margin = "15px 0 0 0";
    hint.style.color = "#666";
    hint.style.fontSize = "14px";

    // 创建按钮容器
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "20px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.justifyContent = "center";

    // 确认按钮
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "确认";
    confirmButton.style.padding = "10px 20px";
    confirmButton.style.backgroundColor = "#007bff";
    confirmButton.style.color = "white";
    confirmButton.style.border = "none";
    confirmButton.style.borderRadius = "6px";
    confirmButton.style.fontSize = "14px";
    confirmButton.style.cursor = "pointer";
    confirmButton.style.transition = "background-color 0.2s";

    // 取消按钮
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "取消";
    cancelButton.style.padding = "10px 20px";
    cancelButton.style.backgroundColor = "#6c757d";
    cancelButton.style.color = "white";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "6px";
    cancelButton.style.fontSize = "14px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.transition = "background-color 0.2s";

    // 按钮悬停效果
    confirmButton.addEventListener("mouseenter", () => {
      confirmButton.style.backgroundColor = "#0056b3";
    });
    confirmButton.addEventListener("mouseleave", () => {
      confirmButton.style.backgroundColor = "#007bff";
    });

    cancelButton.addEventListener("mouseenter", () => {
      cancelButton.style.backgroundColor = "#545b62";
    });
    cancelButton.addEventListener("mouseleave", () => {
      cancelButton.style.backgroundColor = "#6c757d";
    });

    // 组装界面
    inputContainer.appendChild(title);
    inputContainer.appendChild(this.overlayInput);
    inputContainer.appendChild(hint);
    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);
    inputContainer.appendChild(buttonContainer);
    this.overlay.appendChild(inputContainer);
    document.body.appendChild(this.overlay);

    // 聚焦输入框
    this.overlayInput.focus();

    // 绑定事件
    this.overlayInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.confirmOverlayInput();
      } else if (e.key === "Escape") {
        this.cancelOverlayInput();
      }
    });

    confirmButton.addEventListener("click", () => {
      this.confirmOverlayInput();
    });

    cancelButton.addEventListener("click", () => {
      this.cancelOverlayInput();
    });

    // 点击遮罩外部取消
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.cancelOverlayInput();
      }
    });
  }

  confirmOverlayInput() {
    if (!this.isOverlayMode || !this.overlayInput) return;

    const text = this.overlayInput.value.trim();
    if (text) {
      this.createTextObject(text);
    }

    this.cancelOverlayInput();
  }

  cancelOverlayInput() {
    if (!this.isOverlayMode) return;

    this.isOverlayMode = false;

    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
      this.overlayInput = null;
    }
  }

  createTextObject(text) {
    const textObject = {
      text: text,
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      fontSize: parseInt(document.getElementById("fontSize").value),
      fontFamily: document.getElementById("fontFamily").value,
      color: document.getElementById("textColor").value,
      rotation: parseInt(document.getElementById("rotation").value),
      scaleX: 1,
      scaleY: 1,
      width: 0,
      height: 0,
    };

    // 计算文字尺寸
    this.ctx.font = `${textObject.fontSize}px ${textObject.fontFamily}`;
    const metrics = this.ctx.measureText(textObject.text);
    textObject.width = metrics.width;
    textObject.height = textObject.fontSize;

    this.textObjects.push(textObject);
    this.selectedText = textObject;
    this.redraw();
  }

  handleMouseDown(e) {
    // 如果正在编辑文字，先结束编辑
    if (this.isEditing) {
      this.finishEditing();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查双击
    const currentTime = Date.now();
    const isDoubleClick =
      currentTime - this.lastClickTime < this.doubleClickDelay;
    this.lastClickTime = currentTime;

    // 检查是否点击了缩放控制点
    if (this.selectedText && !isDoubleClick) {
      const handle = this.getResizeHandle(x, y, this.selectedText);
      if (handle) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.dragStartX = x;
        this.dragStartY = y;
        this.originalScale = {
          x: this.selectedText.scaleX,
          y: this.selectedText.scaleY,
        };
        return;
      }
    }

    // 检查是否点击了文字
    for (let i = this.textObjects.length - 1; i >= 0; i--) {
      const textObj = this.textObjects[i];
      if (this.isPointInText(x, y, textObj)) {
        this.selectedText = textObj;

        if (isDoubleClick) {
          // 双击开始编辑
          this.startEditing(textObj, x, y);
          return;
        } else {
          // 单击开始拖拽
          this.isDragging = true;
          this.dragStartX = x - textObj.x;
          this.dragStartY = y - textObj.y;
          this.updateControlsFromSelectedText();
          this.showTrashCan(); // 显示垃圾桶
          this.redraw();
          return;
        }
      }
    }

    // 如果没有点击文字，取消选择
    this.selectedText = null;
    this.redraw();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 更新鼠标指针样式
    this.updateCursor(x, y);

    if (this.isResizing && this.selectedText) {
      this.handleResize(x, y);
    } else if (this.isDragging && this.selectedText) {
      this.selectedText.x = x - this.dragStartX;
      this.selectedText.y = y - this.dragStartY;

      // 检查是否在垃圾桶上方
      this.checkTrashCollision(x, y);

      this.redraw();
    }
  }

  handleMouseUp(e) {
    console.log("鼠标释放:", {
      isDragging: this.isDragging,
      isOverTrash: this.isOverTrash,
      hasSelectedText: !!this.selectedText,
    });

    if (this.isDragging && this.isOverTrash && this.selectedText) {
      console.log("准备删除文字:", this.selectedText.text);
      // 删除文字
      this.deleteSelectedText();
    }

    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.hideTrashCan(); // 隐藏垃圾桶
    this.isOverTrash = false;
  }

  handleDoubleClick(e) {
    if (this.isEditing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查是否双击了文字
    for (let i = this.textObjects.length - 1; i >= 0; i--) {
      const textObj = this.textObjects[i];
      if (this.isPointInText(x, y, textObj)) {
        this.selectedText = textObj;
        this.startEditing(textObj, x, y);
        return;
      }
    }
  }

  startEditing(textObj, clickX, clickY) {
    if (this.isEditing) return;

    this.isEditing = true;

    // 创建临时输入框
    this.editInput = document.createElement("input");
    this.editInput.type = "text";
    this.editInput.value = textObj.text;
    this.editInput.style.position = "absolute";
    this.editInput.style.fontSize = `${textObj.fontSize * textObj.scaleX}px`;
    this.editInput.style.fontFamily = textObj.fontFamily;
    this.editInput.style.color = textObj.color;
    this.editInput.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    this.editInput.style.border = "2px solid #007bff";
    this.editInput.style.borderRadius = "4px";
    this.editInput.style.padding = "4px 8px";
    this.editInput.style.outline = "none";
    this.editInput.style.zIndex = "1000";
    this.editInput.style.textAlign = "center";
    this.editInput.style.minWidth = "100px";

    // 计算输入框位置
    const canvasRect = this.canvas.getBoundingClientRect();
    const inputWidth = Math.max(textObj.width * textObj.scaleX, 100);
    const inputHeight = textObj.fontSize * textObj.scaleY + 16; // 加上padding

    this.editInput.style.left = `${
      canvasRect.left + textObj.x - inputWidth / 2
    }px`;
    this.editInput.style.top = `${
      canvasRect.top + textObj.y - inputHeight / 2
    }px`;
    this.editInput.style.width = `${inputWidth}px`;

    // 添加到页面
    document.body.appendChild(this.editInput);

    // 选中文字并聚焦
    this.editInput.select();
    this.editInput.focus();

    // 绑定事件
    this.editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.finishEditing();
      } else if (e.key === "Escape") {
        this.cancelEditing();
      }
    });

    this.editInput.addEventListener("blur", () => {
      this.finishEditing();
    });

    // 隐藏选中的文字（在编辑期间）
    this.redraw();
  }

  finishEditing() {
    if (!this.isEditing || !this.editInput) return;

    const newText = this.editInput.value.trim();

    if (newText && this.selectedText) {
      // 更新文字内容
      this.selectedText.text = newText;

      // 重新计算文字尺寸
      this.ctx.font = `${this.selectedText.fontSize}px ${this.selectedText.fontFamily}`;
      const metrics = this.ctx.measureText(this.selectedText.text);
      this.selectedText.width = metrics.width;
      this.selectedText.height = this.selectedText.fontSize;
    }

    this.cancelEditing();
  }

  cancelEditing() {
    if (!this.isEditing) return;

    this.isEditing = false;

    if (this.editInput) {
      document.body.removeChild(this.editInput);
      this.editInput = null;
    }

    this.redraw();
  }

  updateCursor(x, y) {
    if (!this.selectedText) {
      this.canvas.style.cursor = "default";
      return;
    }

    const handle = this.getResizeHandle(x, y, this.selectedText);
    if (handle) {
      switch (handle) {
        case "n":
        case "s":
          this.canvas.style.cursor = "ns-resize";
          break;
        case "e":
        case "w":
          this.canvas.style.cursor = "ew-resize";
          break;
        case "ne":
        case "sw":
          this.canvas.style.cursor = "nesw-resize";
          break;
        case "nw":
        case "se":
          this.canvas.style.cursor = "nwse-resize";
          break;
      }
    } else if (this.isPointInText(x, y, this.selectedText)) {
      this.canvas.style.cursor = "move";
    } else {
      this.canvas.style.cursor = "default";
    }
  }

  getResizeHandle(x, y, textObj) {
    const handleSize = 8;
    const padding = 5;

    // 计算文字边界框的四个角和四条边的中点
    const bounds = this.getTextBounds(textObj);
    const handles = {
      nw: { x: bounds.left - padding, y: bounds.top - padding },
      n: { x: bounds.centerX, y: bounds.top - padding },
      ne: { x: bounds.right + padding, y: bounds.top - padding },
      e: { x: bounds.right + padding, y: bounds.centerY },
      se: { x: bounds.right + padding, y: bounds.bottom + padding },
      s: { x: bounds.centerX, y: bounds.bottom + padding },
      sw: { x: bounds.left - padding, y: bounds.bottom + padding },
      w: { x: bounds.left - padding, y: bounds.centerY },
    };

    for (const [handle, pos] of Object.entries(handles)) {
      if (
        Math.abs(x - pos.x) <= handleSize / 2 &&
        Math.abs(y - pos.y) <= handleSize / 2
      ) {
        return handle;
      }
    }

    return null;
  }

  getTextBounds(textObj) {
    const halfWidth = (textObj.width * textObj.scaleX) / 2;
    const halfHeight = (textObj.height * textObj.scaleY) / 2;

    return {
      left: textObj.x - halfWidth,
      right: textObj.x + halfWidth,
      top: textObj.y - halfHeight,
      bottom: textObj.y + halfHeight,
      centerX: textObj.x,
      centerY: textObj.y,
    };
  }

  handleResize(x, y) {
    const deltaX = x - this.dragStartX;
    const deltaY = y - this.dragStartY;
    const textObj = this.selectedText;

    const originalWidth = textObj.width;
    const originalHeight = textObj.height;

    // 计算缩放因子，根据拖拽的主要方向来确定
    let scaleFactor = 1;

    switch (this.resizeHandle) {
      case "e":
        scaleFactor = this.originalScale.x + (deltaX / originalWidth) * 2;
        break;
      case "w":
        scaleFactor = this.originalScale.x - (deltaX / originalWidth) * 2;
        break;
      case "n":
        scaleFactor = this.originalScale.y - (deltaY / originalHeight) * 2;
        break;
      case "s":
        scaleFactor = this.originalScale.y + (deltaY / originalHeight) * 2;
        break;
      case "ne":
        // 取X和Y方向变化的平均值
        const scaleXFactor =
          this.originalScale.x + (deltaX / originalWidth) * 2;
        const scaleYFactor =
          this.originalScale.y - (deltaY / originalHeight) * 2;
        scaleFactor = (scaleXFactor + scaleYFactor) / 2;
        break;
      case "nw":
        const scaleXFactorNW =
          this.originalScale.x - (deltaX / originalWidth) * 2;
        const scaleYFactorNW =
          this.originalScale.y - (deltaY / originalHeight) * 2;
        scaleFactor = (scaleXFactorNW + scaleYFactorNW) / 2;
        break;
      case "se":
        const scaleXFactorSE =
          this.originalScale.x + (deltaX / originalWidth) * 2;
        const scaleYFactorSE =
          this.originalScale.y + (deltaY / originalHeight) * 2;
        scaleFactor = (scaleXFactorSE + scaleYFactorSE) / 2;
        break;
      case "sw":
        const scaleXFactorSW =
          this.originalScale.x - (deltaX / originalWidth) * 2;
        const scaleYFactorSW =
          this.originalScale.y + (deltaY / originalHeight) * 2;
        scaleFactor = (scaleXFactorSW + scaleYFactorSW) / 2;
        break;
    }

    // 限制最小缩放值，并应用等比例缩放
    scaleFactor = Math.max(0.1, scaleFactor);
    textObj.scaleX = scaleFactor;
    textObj.scaleY = scaleFactor;

    this.redraw();
  }

  isPointInText(x, y, textObj) {
    const bounds = this.getTextBounds(textObj);
    return (
      x >= bounds.left &&
      x <= bounds.right &&
      y >= bounds.top &&
      y <= bounds.bottom
    );
  }

  updateSelectedTextProperty(property, value) {
    if (!this.selectedText) return;

    this.selectedText[property] = value;

    // 如果修改了字体相关属性，重新计算文字尺寸
    if (property === "fontSize" || property === "fontFamily") {
      this.ctx.font = `${this.selectedText.fontSize}px ${this.selectedText.fontFamily}`;
      const metrics = this.ctx.measureText(this.selectedText.text);
      this.selectedText.width = metrics.width;
      this.selectedText.height = this.selectedText.fontSize;
    }

    this.redraw();
  }

  updateControlsFromSelectedText() {
    if (!this.selectedText) return;

    document.getElementById("fontSize").value = this.selectedText.fontSize;
    document.getElementById("rotation").value = this.selectedText.rotation;
    document.getElementById("textColor").value = this.selectedText.color;
    document.getElementById("fontFamily").value = this.selectedText.fontFamily;

    this.updateRangeDisplay();
  }

  updateRangeDisplay() {
    const fontSize = document.getElementById("fontSize").value;
    const rotation = document.getElementById("rotation").value;

    document.getElementById("fontSizeValue").textContent = `${fontSize}px`;
    document.getElementById("rotationValue").textContent = `${rotation}°`;
  }

  redraw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 填充白色背景
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制背景图片
    if (this.backgroundImage) {
      this.drawBackgroundImage();
    }

    // 绘制所有文字
    this.textObjects.forEach((textObj) => {
      this.drawText(textObj);
    });

    // 绘制选中文字的边框
    if (this.selectedText) {
      this.drawTextBorder(this.selectedText);
    }
  }

  drawBackgroundImage() {
    const img = this.backgroundImage;
    const canvasRatio = this.canvas.width / this.canvas.height;
    const imgRatio = img.width / img.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      // 图片更宽，以高度为准
      drawHeight = this.canvas.height;
      drawWidth = drawHeight * imgRatio;
      offsetX = (this.canvas.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // 图片更高，以宽度为准
      drawWidth = this.canvas.width;
      drawHeight = drawWidth / imgRatio;
      offsetX = 0;
      offsetY = (this.canvas.height - drawHeight) / 2;
    }

    this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  drawText(textObj) {
    // 如果正在编辑这个文字，不绘制它
    if (this.isEditing && textObj === this.selectedText) return;

    this.ctx.save();

    // 移动到文字位置
    this.ctx.translate(textObj.x, textObj.y);

    // 旋转
    this.ctx.rotate((textObj.rotation * Math.PI) / 180);

    // 缩放
    this.ctx.scale(textObj.scaleX, textObj.scaleY);

    // 设置字体和颜色
    this.ctx.font = `${textObj.fontSize}px ${textObj.fontFamily}`;
    this.ctx.fillStyle = textObj.color;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // 添加文字描边以提高可读性
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(textObj.text, 0, 0);

    // 绘制文字
    this.ctx.fillText(textObj.text, 0, 0);

    this.ctx.restore();
  }

  drawTextBorder(textObj) {
    // 如果正在编辑这个文字，不绘制边框
    if (this.isEditing && textObj === this.selectedText) return;

    this.ctx.save();

    // 绘制选中边框（不应用旋转，这样边框始终水平垂直）
    this.ctx.strokeStyle = "#007bff";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    const bounds = this.getTextBounds(textObj);
    const padding = 5;

    this.ctx.strokeRect(
      bounds.left - padding,
      bounds.top - padding,
      bounds.right - bounds.left + padding * 2,
      bounds.bottom - bounds.top + padding * 2
    );

    // 绘制缩放控制点
    this.drawResizeHandles(textObj);

    this.ctx.restore();
  }

  drawResizeHandles(textObj) {
    const handleSize = 8;
    const padding = 5;
    const bounds = this.getTextBounds(textObj);

    const handles = [
      { x: bounds.left - padding, y: bounds.top - padding }, // nw
      { x: bounds.centerX, y: bounds.top - padding }, // n
      { x: bounds.right + padding, y: bounds.top - padding }, // ne
      { x: bounds.right + padding, y: bounds.centerY }, // e
      { x: bounds.right + padding, y: bounds.bottom + padding }, // se
      { x: bounds.centerX, y: bounds.bottom + padding }, // s
      { x: bounds.left - padding, y: bounds.bottom + padding }, // sw
      { x: bounds.left - padding, y: bounds.centerY }, // w
    ];

    this.ctx.fillStyle = "#007bff";
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);

    handles.forEach((handle) => {
      this.ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  }

  clearCanvas() {
    if (confirm("确定要清空画布吗？")) {
      this.textObjects = [];
      this.selectedText = null;
      this.backgroundImage = null;
      this.redraw();
    }
  }

  downloadCanvas() {
    // 创建一个临时canvas，不包含选择边框
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // 填充白色背景
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 绘制背景图片
    if (this.backgroundImage) {
      const img = this.backgroundImage;
      const canvasRatio = tempCanvas.width / tempCanvas.height;
      const imgRatio = img.width / img.height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgRatio > canvasRatio) {
        drawHeight = tempCanvas.height;
        drawWidth = drawHeight * imgRatio;
        offsetX = (tempCanvas.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = tempCanvas.width;
        drawHeight = drawWidth / imgRatio;
        offsetX = 0;
        offsetY = (tempCanvas.height - drawHeight) / 2;
      }

      tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // 绘制所有文字
    this.textObjects.forEach((textObj) => {
      tempCtx.save();
      tempCtx.translate(textObj.x, textObj.y);
      tempCtx.rotate((textObj.rotation * Math.PI) / 180);
      tempCtx.scale(textObj.scaleX, textObj.scaleY);
      tempCtx.font = `${textObj.fontSize}px ${textObj.fontFamily}`;
      tempCtx.fillStyle = textObj.color;
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";

      // 文字描边
      tempCtx.strokeStyle = "white";
      tempCtx.lineWidth = 2;
      tempCtx.strokeText(textObj.text, 0, 0);

      // 绘制文字
      tempCtx.fillText(textObj.text, 0, 0);
      tempCtx.restore();
    });

    // 下载图片
    const link = document.createElement("a");
    link.download = "canvas-image.png";
    link.href = tempCanvas.toDataURL();
    link.click();
  }

  showTrashCan() {
    if (this.trashCan) return;

    this.trashCan = document.createElement("div");
    this.trashCan.innerHTML = "🗑️";
    this.trashCan.style.position = "absolute";
    this.trashCan.style.fontSize = "48px";
    this.trashCan.style.width = "80px";
    this.trashCan.style.height = "80px";
    this.trashCan.style.display = "flex";
    this.trashCan.style.alignItems = "center";
    this.trashCan.style.justifyContent = "center";
    this.trashCan.style.backgroundColor = "rgba(220, 53, 69, 0.8)";
    this.trashCan.style.border = "3px dashed #dc3545";
    this.trashCan.style.borderRadius = "50%";
    this.trashCan.style.transition = "all 0.2s ease";
    this.trashCan.style.zIndex = "1000";
    this.trashCan.style.pointerEvents = "none";

    // 定位垃圾桶在canvas下方中央
    const canvasRect = this.canvas.getBoundingClientRect();
    this.trashCan.style.left = `${
      canvasRect.left + canvasRect.width / 2 - 40
    }px`;
    this.trashCan.style.top = `${canvasRect.bottom + 20}px`;

    document.body.appendChild(this.trashCan);

    // 添加动画效果
    setTimeout(() => {
      this.trashCan.style.transform = "scale(1.1)";
    }, 100);
  }

  hideTrashCan() {
    if (!this.trashCan) return;

    this.trashCan.style.transform = "scale(0.8)";
    this.trashCan.style.opacity = "0";

    setTimeout(() => {
      if (this.trashCan) {
        document.body.removeChild(this.trashCan);
        this.trashCan = null;
      }
    }, 200);
  }

  checkTrashCollision(mouseX, mouseY) {
    if (!this.trashCan) return;

    const canvasRect = this.canvas.getBoundingClientRect();

    // 垃圾桶的实际位置
    const trashLeft = canvasRect.left + canvasRect.width / 2 - 40; // 垃圾桶左边界
    const trashTop = canvasRect.bottom + 20; // 垃圾桶上边界
    const trashRight = trashLeft + 80; // 垃圾桶右边界
    const trashBottom = trashTop + 80; // 垃圾桶下边界

    // 文字的实际屏幕坐标
    const textScreenX = canvasRect.left + mouseX;
    const textScreenY = canvasRect.top + mouseY;

    const wasOverTrash = this.isOverTrash;

    // 简化的碰撞检测：检查文字是否在垃圾桶区域内
    this.isOverTrash =
      textScreenX >= trashLeft - 20 &&
      textScreenX <= trashRight + 20 &&
      textScreenY >= trashTop - 20 &&
      textScreenY <= trashBottom + 20;

    // 调试信息（可选）
    console.log("碰撞检测:", {
      textX: textScreenX,
      textY: textScreenY,
      trashArea: {
        left: trashLeft - 20,
        right: trashRight + 20,
        top: trashTop - 20,
        bottom: trashBottom + 20,
      },
      isOverTrash: this.isOverTrash,
    });

    // 更新垃圾桶样式
    if (this.isOverTrash !== wasOverTrash) {
      if (this.isOverTrash) {
        this.trashCan.style.backgroundColor = "rgba(220, 53, 69, 1)";
        this.trashCan.style.transform = "scale(1.3)";
        this.trashCan.style.boxShadow = "0 4px 20px rgba(220, 53, 69, 0.5)";
        this.canvas.style.cursor = "not-allowed";
        console.log("文字进入垃圾桶区域");
      } else {
        this.trashCan.style.backgroundColor = "rgba(220, 53, 69, 0.8)";
        this.trashCan.style.transform = "scale(1.1)";
        this.trashCan.style.boxShadow = "none";
        this.canvas.style.cursor = "move";
        console.log("文字离开垃圾桶区域");
      }
    }
  }

  deleteSelectedText() {
    if (!this.selectedText) {
      console.log("没有选中的文字可删除");
      return;
    }

    console.log("删除文字:", this.selectedText.text);

    // 从数组中移除选中的文字
    const index = this.textObjects.indexOf(this.selectedText);
    if (index > -1) {
      this.textObjects.splice(index, 1);
      this.selectedText = null;
      this.redraw();

      console.log("文字已删除，剩余文字数量:", this.textObjects.length);

      // 显示删除提示
      this.showDeleteNotification();
    } else {
      console.log("未找到要删除的文字");
    }
  }

  showDeleteNotification() {
    const notification = document.createElement("div");
    notification.textContent = "文字已删除";
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.padding = "12px 20px";
    notification.style.backgroundColor = "#28a745";
    notification.style.color = "white";
    notification.style.borderRadius = "6px";
    notification.style.fontSize = "14px";
    notification.style.fontWeight = "500";
    notification.style.zIndex = "10000";
    notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
    notification.style.transform = "translateX(100%)";
    notification.style.transition = "transform 0.3s ease";

    document.body.appendChild(notification);

    // 滑入动画
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // 自动消失
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }
}

// 全局函数，供HTML调用
function addText() {
  canvasEditor.addText();
}

function showOverlayInput() {
  canvasEditor.showOverlayInput();
}

function clearCanvas() {
  canvasEditor.clearCanvas();
}

function downloadCanvas() {
  canvasEditor.downloadCanvas();
}

// 初始化编辑器
const canvasEditor = new CanvasEditor();
