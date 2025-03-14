const state = {
    bucket12: 0,
    bucket8: 0,
    bucket5: 0,
    maxCapacity12: 12,
    maxCapacity8: 8,
    maxCapacity5: 5,
    moves: 0,
    dragSource: null,
    dragStartX: 0,
    dragStartY: 0,
    startTime: null
  };

  const hints = [
    "Hint: Tap the tap to fill a jug",
    "Hint: Drag one jug onto another to transfer water",
    "Hint: Tap the trash to empty a jug",
    "Hint: You need exactly 6 liters in any jug to win"
  ];

  let currentHintIndex = 0;

  // Initialize the game
  window.onload = function() {
    document.getElementById('game-screen').style.display = 'flex';
    document.getElementById('win-screen').style.display = 'none';
    updateVisuals();
    
    // Start tracking time
    state.startTime = new Date();
    
    // Prevent default behavior for touch events
    document.addEventListener('touchmove', function(e) {
      if (state.dragSource !== null) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Set up touch events for mobile
    setupTouchEvents();
    
    // Adjust the height to use full screen
    adjustHeight();
    window.addEventListener('resize', adjustHeight);

    // Start rotating hints
    startRotatingHints();
  };
  
  // Adjust component heights to use full screen
  function adjustHeight() {
    const screenHeight = window.innerHeight;
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return;
    
    gameScreen.style.height = screenHeight + 'px';
    
    // Make sure buckets-container has enough space
    const headerElement = document.querySelector('h1');
    const instructionsElement = document.querySelector('.instructions');
    const goalElement = document.querySelector('.goal');
    const dragHintElement = document.querySelector('.drag-hint');
    const bucketsContainer = document.querySelector('.buckets-container');
    
    if (!headerElement || !instructionsElement || !goalElement || !dragHintElement || !bucketsContainer) return;
    
    const header = headerElement.offsetHeight;
    const instructions = instructionsElement.offsetHeight;
    const goal = goalElement.offsetHeight;
    const dragHint = dragHintElement.offsetHeight;
    
    const availableHeight = screenHeight - header - instructions - goal - dragHint - 60; // extra padding
    bucketsContainer.style.minHeight = Math.max(availableHeight, 250) + 'px'; // Set minimum height
  }

  // Setup touch events
  function setupTouchEvents() {
    const buckets = document.querySelectorAll('.bucket-visual');
    
    // Add touch event listeners
    buckets.forEach(bucket => {
      bucket.addEventListener('touchmove', handleTouchMove);
    });
    
    // Prevent scrolling when interacting with game elements
    document.querySelectorAll('.tap, .valve, button').forEach(el => {
      el.addEventListener('touchstart', e => e.preventDefault());
    });
  }

  // Touch drag start
  function startDrag(event, size) {
    state.dragSource = size;
    const touch = event.touches[0];
    state.dragStartX = touch.clientX;
    state.dragStartY = touch.clientY;
    
    // Visual feedback
    event.currentTarget.style.opacity = '0.7';
  }

  // Touch drag end
  function endDrag(event) {
    if (state.dragSource === null) return;
    
    // Reset visual feedback
    document.querySelectorAll('.bucket-visual').forEach(bucket => {
      bucket.style.opacity = '1';
      bucket.style.borderColor = '';
    });
    
    state.dragSource = null;
  }

  // Handle touch move
  function handleTouchMove(event) {
    if (state.dragSource === null) return;
    
    const touch = event.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    // Check if touch is over a bucket
    const elementsAtPoint = document.elementsFromPoint(currentX, currentY);
    const targetBucket = elementsAtPoint.find(el => 
      el.classList.contains('bucket-visual') && 
      el.parentElement.id !== 'bucket' + state.dragSource
    );
    
    if (targetBucket) {
      // Visual feedback for potential drop target
      targetBucket.style.borderColor = '#4CAF50';
      
      // Check distance moved to determine if this is a drag or a tap
      const distX = Math.abs(currentX - state.dragStartX);
      const distY = Math.abs(currentY - state.dragStartY);
      
      if (distX > 10 || distY > 10) {
        // Consider it a drag if moved more than 10px
        const targetSize = parseInt(targetBucket.parentElement.id.replace('bucket', ''));
        
        // Transfer water to target bucket
        if (state.dragSource !== targetSize) {
          transferWater(state.dragSource, targetSize);
          
          // Reset drag state
          state.dragSource = null;
          
          // Reset visual feedback
          document.querySelectorAll('.bucket-visual').forEach(bucket => {
            bucket.style.opacity = '1';
            bucket.style.borderColor = '';
          });
        }
      }
    }
  }

  // Fill a bucket to capacity
  function fillBucket(size) {
    state['bucket' + size] = state['maxCapacity' + size];
    updateVisuals();
    checkWin();
  }

  // Empty a bucket
  function emptyBucket(size) {
    state['bucket' + size] = 0;
    updateVisuals();
    checkWin();
  }

  // Transfer water between buckets
  function transferWater(sourceSize, targetSize) {
    const sourceKey = 'bucket' + sourceSize;
    const targetKey = 'bucket' + targetSize;
    const targetMaxKey = 'maxCapacity' + targetSize;
    
    // Calculate space available in target bucket
    const spaceInTarget = state[targetMaxKey] - state[targetKey];
    
    if (spaceInTarget > 0 && state[sourceKey] > 0) {
      // Calculate amount to transfer (minimum of source amount and space in target)
      const amountToTransfer = Math.min(state[sourceKey], spaceInTarget);
      state[targetKey] += amountToTransfer;
      state[sourceKey] -= amountToTransfer;
    }
    
    state.moves++;
    updateVisuals();
    checkWin();
  }

  // Update visual representation of water
  function updateVisuals() {
    // Update all three jugs
    updateJugVisual(12);
    updateJugVisual(8);
    updateJugVisual(5);
  }
  
  // Update visual for a specific jug
  function updateJugVisual(size) {
    const bucketKey = 'bucket' + size;
    const maxCapacityKey = 'maxCapacity' + size;
    
    // Update amount text
    document.getElementById('amount' + size).textContent = state[bucketKey] + 'L';
    
    // Update water height
    const water = document.getElementById('water' + size);
    const height = (state[bucketKey] / state[maxCapacityKey]) * 100;
    water.style.height = height + '%';
    
    // Update current level indicator
    const currentLevel = document.getElementById('current-level' + size);
    currentLevel.textContent = state[bucketKey] + 'L';
    
    // Position the current level indicator based on water height
    if (state[bucketKey] > 0) {
      const bucketHeight = document.querySelector('#bucket' + size + ' .bucket-visual').offsetHeight;
      const position = bucketHeight - (height * bucketHeight / 100);
      currentLevel.style.top = position + 'px';
      currentLevel.style.display = 'block';
    } else {
      currentLevel.style.display = 'none';
    }
  }

  // Check if the win condition is met
  function checkWin() {
    if (state.bucket8 === 6) {
      setTimeout(() => {
        showWinScreen();
      }, 1000);
    }
  }

  // Reset the game
  function resetGame() {
    state.bucket12 = 0;
    state.bucket8 = 0;
    state.bucket5 = 0;
    state.moves = 0;
    state.startTime = new Date();
    updateVisuals();
  }

  // Show the win screen
  function showWinScreen() {
    // Calculate completion time
    const endTime = new Date();
    const timeDiff = Math.floor((endTime - state.startTime) / 1000); // in seconds
    const minutes = Math.floor(timeDiff / 60);
    const seconds = timeDiff % 60;
    
    // Update completion time display
    document.getElementById('completion-time').textContent = `${minutes}m ${seconds}s`;
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'flex';
    
    // Create confetti effect
    createConfetti();
    
    setTimeout(() => {
      window.location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSc_VB_2bODsMvn5RlciD1nONL6cZ7AiUst0zcQpoXrprimSiw/viewform';
    }, 4000);
  }

  // Create confetti effect
  function createConfetti() {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.setProperty('--translateX', Math.random() * 100 - 50);
      confetti.style.setProperty('--rotate', Math.random() * 360);
      
      document.body.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 6000);
    }
  }

  function startRotatingHints() {
    // Show first hint immediately
    updateHint();
    
    // Rotate hints every 6 seconds
    setInterval(() => {
      currentHintIndex = (currentHintIndex + 1) % hints.length;
      updateHint();
    }, 6000);
  }

  function updateHint() {
    const dragHint = document.querySelector('.drag-hint');
    // Add fade out effect
    dragHint.style.opacity = '0';
    
    setTimeout(() => {
      dragHint.textContent = hints[currentHintIndex];
      // Add fade in effect
      dragHint.style.opacity = '1';
    }, 300);
  }