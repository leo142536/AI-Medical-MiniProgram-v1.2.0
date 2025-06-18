// components/modern-toast.js
// 基于GitHub最佳实践的现代化Toast组件

Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'isolated',
    pureDataPattern: /^_/
  },

  properties: {
    // 显示状态
    visible: {
      type: Boolean,
      value: false,
      observer: '_onVisibleChange'
    },

    // Toast类型：success, error, warning, info, loading
    type: {
      type: String,
      value: 'info'
    },

    // 消息内容
    message: {
      type: String,
      value: ''
    },

    // 显示位置：top, bottom, center
    position: {
      type: String,
      value: 'top'
    },

    // 自动关闭时间（毫秒），0表示不自动关闭
    duration: {
      type: Number,
      value: 3000
    },

    // 是否显示图标
    showIcon: {
      type: Boolean,
      value: true
    },

    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      value: false
    },

    // 是否显示进度条
    showProgress: {
      type: Boolean,
      value: false
    },

    // 操作按钮文本
    actionText: {
      type: String,
      value: ''
    },

    // 是否启用暗黑模式
    darkMode: {
      type: Boolean,
      value: false
    },

    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    },

    // 是否禁用动画
    disableAnimation: {
      type: Boolean,
      value: false
    },

    // 遮罩层
    mask: {
      type: Boolean,
      value: false
    },

    // 震动效果
    vibrate: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 内部状态
    _visible: false,
    _animating: false,
    _progressWidth: '100%',
    _timer: null,
    _progressTimer: null,
    _animationClass: '',
    
    // 动画状态
    _enterAnimation: '',
    _exitAnimation: '',
    _shakeAnimation: false
  },

  lifetimes: {
    created() {
      this._timers = new Set();
    },

    detached() {
      this._clearAllTimers();
    }
  },

  observers: {
    'type, position': function(type, position) {
      this._updateAnimationClass();
    }
  },

  methods: {
    /**
     * 显示状态变化处理
     */
    _onVisibleChange(visible) {
      if (visible) {
        this._show();
      } else {
        this._hide();
      }
    },

    /**
     * 显示Toast
     */
    _show() {
      if (this.data._animating) return;

      this.setData({
        _visible: true,
        _animating: true,
        _progressWidth: '100%'
      });

      // 添加进入动画
      if (!this.data.disableAnimation) {
        this._addEnterAnimation();
      }

      // 震动反馈
      if (this.data.vibrate) {
        this._triggerVibrate();
      }

      // 启动自动关闭计时器
      if (this.data.duration > 0) {
        this._startAutoClose();
      }

      // 启动进度条动画
      if (this.data.showProgress && this.data.duration > 0) {
        this._startProgress();
      }

      // 触发显示事件
      this.triggerEvent('show', {
        type: this.data.type,
        message: this.data.message
      });

      // 动画完成回调
      this._setTimeout(() => {
        this.setData({ _animating: false });
      }, 300);
    },

    /**
     * 隐藏Toast
     */
    _hide() {
      if (this.data._animating && !this.data._visible) return;

      this.setData({ _animating: true });

      // 清除所有计时器
      this._clearAllTimers();

      // 添加退出动画
      if (!this.data.disableAnimation) {
        this._addExitAnimation();
      }

      // 触发隐藏事件
      this.triggerEvent('hide', {
        type: this.data.type,
        message: this.data.message
      });

      // 动画完成后隐藏
      this._setTimeout(() => {
        this.setData({
          _visible: false,
          _animating: false,
          _animationClass: '',
          _progressWidth: '100%'
        });

        // 触发隐藏完成事件
        this.triggerEvent('hidden');
      }, this.data.disableAnimation ? 0 : 300);
    },

    /**
     * 更新动画类名
     */
    _updateAnimationClass() {
      const { type, position } = this.data;
      let className = `modern-toast toast-${type} toast-${position}`;
      
      if (this.data.darkMode) {
        className += ' dark-mode';
      }
      
      if (this.data.customClass) {
        className += ` ${this.data.customClass}`;
      }

      this.setData({ _animationClass: className });
    },

    /**
     * 添加进入动画
     */
    _addEnterAnimation() {
      this.setData({
        _animationClass: `${this.data._animationClass} toast-enter`
      });

      this._setTimeout(() => {
        this.setData({
          _animationClass: this.data._animationClass.replace(' toast-enter', '')
        });
      }, 300);
    },

    /**
     * 添加退出动画
     */
    _addExitAnimation() {
      this.setData({
        _animationClass: `${this.data._animationClass} toast-exit`
      });
    },

    /**
     * 启动自动关闭计时器
     */
    _startAutoClose() {
      const timer = setTimeout(() => {
        this.setData({ visible: false });
        this._timers.delete(timer);
      }, this.data.duration);
      
      this._timers.add(timer);
    },

    /**
     * 启动进度条动画
     */
    _startProgress() {
      let progress = 100;
      const interval = 50; // 50ms更新一次
      const step = (interval / this.data.duration) * 100;

      const updateProgress = () => {
        progress -= step;
        if (progress <= 0) {
          progress = 0;
          return;
        }

        this.setData({ _progressWidth: `${progress}%` });

        const timer = setTimeout(updateProgress, interval);
        this._timers.add(timer);
      };

      updateProgress();
    },

    /**
     * 震动反馈
     */
    _triggerVibrate() {
      try {
        wx.vibrateShort({
          type: 'light'
        });
      } catch (e) {
        console.warn('震动功能不支持:', e);
      }

      // 添加震动动画
      this.setData({ _shakeAnimation: true });
      this._setTimeout(() => {
        this.setData({ _shakeAnimation: false });
      }, 600);
    },

    /**
     * 安全的setTimeout
     */
    _setTimeout(callback, delay) {
      const timer = setTimeout(() => {
        callback();
        this._timers.delete(timer);
      }, delay);
      
      this._timers.add(timer);
      return timer;
    },

    /**
     * 清除所有计时器
     */
    _clearAllTimers() {
      this._timers.forEach(timer => {
        clearTimeout(timer);
      });
      this._timers.clear();
    },

    /**
     * 点击Toast内容
     */
    _onTap() {
      this.triggerEvent('tap', {
        type: this.data.type,
        message: this.data.message
      });
    },

    /**
     * 点击关闭按钮
     */
    _onClose() {
      this.setData({ visible: false });
      this.triggerEvent('close', {
        type: this.data.type,
        message: this.data.message
      });
    },

    /**
     * 点击操作按钮
     */
    _onAction() {
      this.triggerEvent('action', {
        type: this.data.type,
        message: this.data.message,
        actionText: this.data.actionText
      });
    },

    /**
     * 点击遮罩层
     */
    _onMaskTap() {
      if (this.data.mask) {
        this.triggerEvent('maskTap');
      }
    },

    // 公共方法

    /**
     * 手动显示Toast
     */
    show() {
      this.setData({ visible: true });
    },

    /**
     * 手动隐藏Toast
     */
    hide() {
      this.setData({ visible: false });
    },

    /**
     * 切换显示状态
     */
    toggle() {
      this.setData({ visible: !this.data.visible });
    },

    /**
     * 更新消息内容
     */
    updateMessage(message) {
      this.setData({ message });
    },

    /**
     * 更新Toast类型
     */
    updateType(type) {
      this.setData({ type });
      this._updateAnimationClass();
    },

    /**
     * 重置进度条
     */
    resetProgress() {
      this.setData({ _progressWidth: '100%' });
      if (this.data.showProgress && this.data.duration > 0) {
        this._startProgress();
      }
    },

    /**
     * 立即执行震动
     */
    shake() {
      this._triggerVibrate();
    }
  }
}); 