// Professional Stopwatch Application
class ProfessionalStopwatch {
  constructor() {
    this.isRunning = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.intervalId = null;
    this.laps = [];
    this.currentMode = 'stopwatch';
    this.settings = {
      displayFormat: 'standard',
      soundAlerts: true,
      autoSave: true
    };
    this.themes = ['default', 'ocean', 'sunset', 'forest', 'midnight'];
    this.currentTheme = 0;
    
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
    this.updateDisplay();
    this.updateStatistics();
  }

  initializeElements() {
    this.display = document.getElementById('display');
    this.timerSubtitle = document.getElementById('timerSubtitle');
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.lapBtn = document.getElementById('lapBtn');
    this.saveBtn = document.getElementById('saveBtn');
    this.clearLapsBtn = document.getElementById('clearLapsBtn');
    this.lapsList = document.getElementById('laps');
    this.darkModeToggle = document.getElementById('darkModeToggle');
    this.themeToggle = document.getElementById('themeToggle');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.closeSettings = document.getElementById('closeSettings');
    
    // Statistics elements
    this.avgLapEl = document.getElementById('avgLap');
    this.fastestLapEl = document.getElementById('fastestLap');
    this.totalLapsEl = document.getElementById('totalLaps');
    this.totalTimeEl = document.getElementById('totalTime');
    
    // Settings elements
    this.displayFormat = document.getElementById('displayFormat');
    this.soundAlerts = document.getElementById('soundAlerts');
    this.autoSave = document.getElementById('autoSave');
  }

  bindEvents() {
    // Control buttons
    this.startBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.lapBtn.addEventListener('click', () => this.lap());
    this.saveBtn.addEventListener('click', () => this.saveSession());
    this.clearLapsBtn.addEventListener('click', () => this.clearLaps());
    
    // Theme and settings
    this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
    this.themeToggle.addEventListener('click', () => this.cycleTheme());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
    
    // Mode buttons - Fixed event handling
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });
    
    // Settings changes
    this.displayFormat.addEventListener('change', () => this.updateSettings());
    this.soundAlerts.addEventListener('change', () => this.updateSettings());
    this.autoSave.addEventListener('change', () => this.updateSettings());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Modal backdrop click
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettingsModal();
    });
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = Date.now() - this.elapsedTime;
      this.intervalId = setInterval(() => this.updateDisplay(), 10);
      
      this.startBtn.classList.add('hidden');
      this.pauseBtn.classList.remove('hidden');
      this.display.classList.add('running');
      
      this.playSound('start');
      this.showToast('Timer started', 'success');
    }
  }

  pause() {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.intervalId);
      this.elapsedTime = Date.now() - this.startTime;
      
      this.pauseBtn.classList.add('hidden');
      this.startBtn.classList.remove('hidden');
      this.display.classList.remove('running');
      
      this.playSound('pause');
      this.showToast('Timer paused', 'info');
    }
  }

  reset() {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.elapsedTime = 0;
    this.startTime = 0;
    
    this.pauseBtn.classList.add('hidden');
    this.startBtn.classList.remove('hidden');
    this.display.classList.remove('running', 'finished');
    
    this.updateDisplay();
    this.playSound('reset');
    this.showToast('Timer reset', 'warning');
  }

  lap() {
    if (this.isRunning || this.elapsedTime > 0) {
      const currentTime = this.isRunning ? Date.now() - this.startTime : this.elapsedTime;
      const lapTime = this.laps.length === 0 ? currentTime : currentTime - this.laps[this.laps.length - 1].totalTime;
      
      const lap = {
        number: this.laps.length + 1,
        lapTime: lapTime,
        totalTime: currentTime,
        timestamp: new Date().toLocaleTimeString()
      };
      
      this.laps.push(lap);
      this.addLapToList(lap);
      this.updateStatistics();
      
      this.playSound('lap');
      this.showToast(`Lap ${lap.number} recorded`, 'success');
      
      if (this.settings.autoSave) {
        this.saveToLocalStorage();
      }
    }
  }

  addLapToList(lap) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="lap-info">
        <span class="lap-number">#${lap.number}</span>
        <span class="lap-time">${this.formatTime(lap.lapTime)}</span>
      </div>
      <div class="lap-details">
        <span class="lap-total">${this.formatTime(lap.totalTime)}</span>
        <span class="lap-timestamp">${lap.timestamp}</span>
      </div>
    `;
    
    // Add special styling for fastest/slowest laps
    if (this.laps.length === 1) {
      li.classList.add('fastest-lap');
  } else {
      const fastestLap = Math.min(...this.laps.map(l => l.lapTime));
      const slowestLap = Math.max(...this.laps.map(l => l.lapTime));
      
      if (lap.lapTime === fastestLap) {
        li.classList.add('fastest-lap');
      } else if (lap.lapTime === slowestLap) {
        li.classList.add('slowest-lap');
      }
    }
    
    this.lapsList.insertBefore(li, this.lapsList.firstChild);
  }

  clearLaps() {
    this.laps = [];
    this.lapsList.innerHTML = '';
    this.updateStatistics();
    this.showToast('Lap history cleared', 'info');
  }

  updateDisplay() {
    const currentTime = this.isRunning ? Date.now() - this.startTime : this.elapsedTime;
    this.display.textContent = this.formatTime(currentTime);
  }

  formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    
    switch (this.settings.displayFormat) {
      case 'compact':
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
      case 'decimal':
        return (milliseconds / 1000).toFixed(2);
      default:
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
  }

  updateStatistics() {
    if (this.laps.length === 0) {
      this.avgLapEl.textContent = '00:00.00';
      this.fastestLapEl.textContent = '00:00.00';
      this.totalLapsEl.textContent = '0';
      this.totalTimeEl.textContent = '00:00:00';
      return;
    }
    
    const lapTimes = this.laps.map(lap => lap.lapTime);
    const avgLap = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const fastestLap = Math.min(...lapTimes);
    const totalTime = this.laps[this.laps.length - 1].totalTime;
    
    this.avgLapEl.textContent = this.formatTime(avgLap);
    this.fastestLapEl.textContent = this.formatTime(fastestLap);
    this.totalLapsEl.textContent = this.laps.length.toString();
    this.totalTimeEl.textContent = this.formatTime(totalTime);
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Update subtitle
    const modeNames = {
      stopwatch: 'Stopwatch Mode',
      countdown: 'Countdown Timer',
      pomodoro: 'Pomodoro Timer',
      interval: 'Interval Timer'
    };
    this.timerSubtitle.textContent = modeNames[mode] || 'Stopwatch Mode';
    
    // Reset for new mode
    this.reset();
    this.showToast(`Switched to ${modeNames[mode] || mode}`, 'info');
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    const icon = this.darkModeToggle.querySelector('.icon i');
    const text = this.darkModeToggle.querySelector('.toggle-text');
    
    if (isDark) {
      icon.className = 'fas fa-sun';
      text.textContent = 'Light Mode';
    } else {
      icon.className = 'fas fa-moon';
      text.textContent = 'Dark Mode';
    }
    
    this.showToast(`${isDark ? 'Dark' : 'Light'} mode enabled`, 'success');
  }

  cycleTheme() {
    this.currentTheme = (this.currentTheme + 1) % this.themes.length;
    const theme = this.themes[this.currentTheme];
    
    // Remove all theme classes
    document.body.classList.remove('theme-default', 'theme-ocean', 'theme-sunset', 'theme-forest', 'theme-midnight');
    // Add current theme class
    document.body.classList.add(`theme-${theme}`);
    
    this.showToast(`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`, 'success');
  }

  openSettings() {
    this.settingsModal.classList.remove('hidden');
    setTimeout(() => this.settingsModal.classList.add('show'), 10);
  }

  closeSettingsModal() {
    this.settingsModal.classList.remove('show');
    setTimeout(() => this.settingsModal.classList.add('hidden'), 300);
  }

  updateSettings() {
    this.settings.displayFormat = this.displayFormat.value;
    this.settings.soundAlerts = this.soundAlerts.checked;
    this.settings.autoSave = this.autoSave.checked;
    
    this.saveSettings();
    this.updateDisplay();
    this.showToast('Settings updated', 'success');
  }

  handleKeyboard(e) {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (this.isRunning) this.pause();
        else this.start();
        break;
      case 'KeyR':
        if (e.ctrlKey) {
          e.preventDefault();
          this.reset();
        }
        break;
      case 'KeyL':
        e.preventDefault();
        this.lap();
        break;
      case 'Escape':
        this.closeSettingsModal();
        break;
    }
  }

  playSound(type) {
    if (!this.settings.soundAlerts) return;
    
    try {
      // Create audio context for beep sounds
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const frequencies = {
        start: 800,
        pause: 600,
        reset: 400,
        lap: 1000
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Audio not supported in this browser');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${this.getToastIcon(type)}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'times-circle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  saveSession() {
    const session = {
      timestamp: new Date().toISOString(),
      mode: this.currentMode,
      totalTime: this.elapsedTime,
      laps: this.laps,
      settings: this.settings
    };
    
    const sessions = JSON.parse(localStorage.getItem('stopwatchSessions') || '[]');
    sessions.push(session);
    localStorage.setItem('stopwatchSessions', JSON.stringify(sessions));
    
    this.showToast('Session saved successfully', 'success');
  }

  saveToLocalStorage() {
    const data = {
      elapsedTime: this.elapsedTime,
      laps: this.laps,
      settings: this.settings,
      currentMode: this.currentMode
    };
    localStorage.setItem('stopwatchData', JSON.stringify(data));
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('stopwatchData');
      if (saved) {
        const data = JSON.parse(saved);
        this.elapsedTime = data.elapsedTime || 0;
        this.laps = data.laps || [];
        this.settings = { ...this.settings, ...data.settings };
        this.currentMode = data.currentMode || 'stopwatch';
        
        // Restore laps list
        this.laps.forEach(lap => this.addLapToList(lap));
        
        // Update settings UI
        if (this.displayFormat) this.displayFormat.value = this.settings.displayFormat;
        if (this.soundAlerts) this.soundAlerts.checked = this.settings.soundAlerts;
        if (this.autoSave) this.autoSave.checked = this.settings.autoSave;
        
        // Switch to saved mode
        this.switchMode(this.currentMode);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('stopwatchSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new ProfessionalStopwatch();
});

// Add toast styles dynamically
const toastStyles = `
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 0.5rem;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 10000;
    max-width: 300px;
  }
  
  .toast.show {
    transform: translateX(0);
  }
  
  .toast-success {
    border-left: 4px solid #10b981;
    color: #065f46;
  }
  
  .toast-warning {
    border-left: 4px solid #f59e0b;
    color: #92400e;
  }
  
  .toast-error {
    border-left: 4px solid #ef4444;
    color: #991b1b;
  }
  
  .toast-info {
    border-left: 4px solid #3b82f6;
    color: #1e40af;
  }
  
  .lap-info, .lap-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .lap-number {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .lap-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    color: var(--text-primary);
  }
  
  .lap-total {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  
  .lap-timestamp {
    font-size: 0.8rem;
    color: var(--text-secondary);
    opacity: 0.7;
  }
  
  .fastest-lap {
    border-left: 4px solid #10b981;
    background: rgba(16, 185, 129, 0.1);
  }
  
  .slowest-lap {
    border-left: 4px solid #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet); 