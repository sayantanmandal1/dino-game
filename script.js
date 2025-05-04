document.addEventListener('DOMContentLoaded', function() {

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            tabLinks.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const tab = this.getAttribute('data-tab');
            document.querySelector(`[data-tab="${tab}"].tab-content`).classList.add('active');
        });
    });

    const contentTabs = document.querySelectorAll('.tab');
    const contentTabContents = document.querySelectorAll('[data-tab-content]');

    contentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabContent = this.getAttribute('data-tab-content');

            const parentTabGroup = this.closest('.tabs');
            parentTabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

            const parentCard = parentTabGroup.closest('.card');
            parentCard.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            parentCard.querySelector(`.tab-content[data-tab-content="${tabContent}"]`).classList.add('active');
        });
    });

    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            this.classList.toggle('open');
            content.classList.toggle('open');
        });
    });

    const rangeInputs = document.querySelectorAll('input[type="range"]');

    rangeInputs.forEach(input => {
        const valueDisplay = document.getElementById(`${input.id}-value`);

        input.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
    });

    const speedButtons = document.querySelectorAll('.speed-btn');

    speedButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            speedButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const speed = this.getAttribute('data-speed');
            simulationSpeed = parseInt(speed);
        });
    });

    const startTrainingBtn = document.getElementById('start-training');
    const pauseTrainingBtn = document.getElementById('pause-training');
    const stopTrainingBtn = document.getElementById('stop-training');

    let trainingInProgress = false;
    let trainingPaused = false;
    let trainingInterval;
    let currentGeneration = 0;
    let simulationSpeed = 1;

    startTrainingBtn.addEventListener('click', function() {
        if (trainingInProgress && trainingPaused) {

            trainingPaused = false;
            this.textContent = 'Pause';
            updateTrainingStatus('Training resumed');
            continueTraining();
        } else if (!trainingInProgress) {

            trainingInProgress = true;
            trainingPaused = false;
            currentGeneration = 0;

            this.textContent = 'Pause';
            pauseTrainingBtn.disabled = false;
            stopTrainingBtn.disabled = false;

            initTraining();
            startTraining();
        }
    });

    pauseTrainingBtn.addEventListener('click', function() {
        if (trainingInProgress && !trainingPaused) {
            trainingPaused = true;
            startTrainingBtn.textContent = 'Resume';
            updateTrainingStatus('Training paused');
            clearInterval(trainingInterval);
        }
    });

    stopTrainingBtn.addEventListener('click', function() {
        if (trainingInProgress) {
            trainingInProgress = false;
            trainingPaused = false;
            startTrainingBtn.textContent = 'Start Training';
            pauseTrainingBtn.disabled = true;
            stopTrainingBtn.disabled = true;
            updateTrainingStatus('Training stopped');
            clearInterval(trainingInterval);
            resetTrainingVisuals();
        }
    });

    const startExpertBtn = document.getElementById('start-expert');
    const pauseExpertBtn = document.getElementById('pause-expert');
    const stopExpertBtn = document.getElementById('stop-expert');

    let expertRunning = false;
    let expertPaused = false;
    let expertInterval;
    let expertScore = 0;

    startExpertBtn.addEventListener('click', function() {
        if (expertRunning && expertPaused) {

            expertPaused = false;
            this.textContent = 'Pause';
            continueExpertPlay();
        } else if (!expertRunning) {

            expertRunning = true;
            expertPaused = false;
            expertScore = 0;

            this.textContent = 'Pause';
            pauseExpertBtn.disabled = false;
            stopExpertBtn.disabled = false;

            initExpertPlay();
            startExpertPlay();
        }
    });

    pauseExpertBtn.addEventListener('click', function() {
        if (expertRunning && !expertPaused) {
            expertPaused = true;
            startExpertBtn.textContent = 'Resume';
            clearInterval(expertInterval);
        }
    });

    stopExpertBtn.addEventListener('click', function() {
        if (expertRunning) {
            expertRunning = false;
            expertPaused = false;
            startExpertBtn.textContent = 'Watch Expert Play';
            pauseExpertBtn.disabled = true;
            stopExpertBtn.disabled = true;
            clearInterval(expertInterval);
            resetExpertVisuals();
        }
    });

    const startGameBtn = document.getElementById('start-game');
    const resetStatsBtn = document.getElementById('reset-stats');

    let gamesPlayed = 0;
    let currentScore = 0;
    let highScore = 0;

    startGameBtn.addEventListener('click', function() {

        const gameIframe = document.getElementById('game-iframe');
        gameIframe.src = gameIframe.src;

        gamesPlayed++;
        updateGameStats();
    });

    resetStatsBtn.addEventListener('click', function() {
        gamesPlayed = 0;
        currentScore = 0;
        highScore = 0;
        updateGameStats();
    });

    function updateGameStats() {
        document.getElementById('current-score').textContent = currentScore;
        document.getElementById('high-score').textContent = highScore;
        document.getElementById('games-played').textContent = gamesPlayed;
    }

    function updateTrainingStatus(status) {
        document.getElementById('training-status').textContent = status;
    }

    function initTraining() {
        updateTrainingStatus('Initializing training environment...');

        const populationSize = parseInt(document.getElementById('population-size').value);
        const mutationRate = parseFloat(document.getElementById('mutation-rate').value);
        const elitism = parseInt(document.getElementById('elitism').value);
        const trainingMode = document.getElementById('training-mode').value;
        const rewardFunction = document.getElementById('reward-function').value;

        const cnnVisualizationContainer = document.getElementById('cnn-visualization-container');
        if (trainingMode === 'cnn' || trainingMode === 'hybrid') {
            cnnVisualizationContainer.style.display = 'block';
        } else {
            cnnVisualizationContainer.style.display = 'none';
        }

        generateCNNFilters();

        initCharts();

        document.getElementById('training-progress').style.width = '0%';

        const trainingVisualization = document.getElementById('training-visualization');
        trainingVisualization.innerHTML = `
            <div style="width: 100%; height: 100%; background-color: #f7f8fa; position: relative;">
                <div style="position: absolute; top: 20px; left: 20px; color: #333; font-size: 14px;">
                    <strong>Generation: <span id="viz-generation">0</span></strong> | 
                    <strong>Population: <span id="viz-population">${populationSize}</span></strong> | 
                    <strong>Alive: <span id="viz-alive">${populationSize}</span></strong>
                </div>
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; height: 100px; background-color: #e5e7eb; border-radius: 5px; overflow: hidden;">
                    <!-- Terrain will be generated here -->
                </div>
            </div>
        `;

        initNetworkVisualization();
    }

    function startTraining() {
        updateTrainingStatus('Training in progress...');

        trainingInterval = setInterval(function() {
            if (currentGeneration >= 100) {

                clearInterval(trainingInterval);
                trainingInProgress = false;
                updateTrainingStatus('Training complete! Model reached 95%+ accuracy.');
                document.getElementById('training-progress').style.width = '100%';
                startTrainingBtn.textContent = 'Start New Training';
                pauseTrainingBtn.disabled = true;
                stopTrainingBtn.disabled = true;
                return;
            }

            simulateGeneration();

            const progress = (currentGeneration / 100) * 100;
            document.getElementById('training-progress').style.width = `${progress}%`;

        }, 1000 / simulationSpeed);
    }

    function continueTraining() {
        updateTrainingStatus('Training in progress...');

        trainingInterval = setInterval(function() {
            if (currentGeneration >= 100) {

                clearInterval(trainingInterval);
                updateTrainingStatus('Training complete! Model reached 95%+ accuracy.');
                document.getElementById('training-progress').style.width = '100%';
                startTrainingBtn.textContent = 'Start New Training';
                pauseTrainingBtn.disabled = true;
                stopTrainingBtn.disabled = true;
                return;
            }

            simulateGeneration();

            const progress = (currentGeneration / 100) * 100;
            document.getElementById('training-progress').style.width = `${progress}%`;

        }, 1000 / simulationSpeed);
    }

    function simulateGeneration() {
        currentGeneration++;

        document.getElementById('current-generation').textContent = currentGeneration;
        document.getElementById('viz-generation').textContent = currentGeneration;

        const baseFitness = 100 + (currentGeneration * 50);
        const bestFitness = baseFitness + Math.floor(Math.random() * 200);
        const avgFitness = baseFitness - Math.floor(Math.random() * 100);

        const baseScore = 500 + (currentGeneration * 100);
        const bestScore = baseScore + Math.floor(Math.random() * 300);

        document.getElementById('best-fitness').textContent = bestFitness;
        document.getElementById('avg-fitness').textContent = avgFitness;
        document.getElementById('best-ai-score').textContent = bestScore;

        const baseNeurons = 12 + Math.floor(currentGeneration / 5);
        const baseConnections = baseNeurons * 2 + Math.floor(currentGeneration / 2);

        document.getElementById('network-neurons').textContent = baseNeurons;
        document.getElementById('network-connections').textContent = baseConnections;

        updateCharts(currentGeneration, bestFitness, avgFitness, bestScore);

        updateNetworkVisualization();

        if (document.getElementById('cnn-visualization-container').style.display !== 'none') {
            updateCNNFilters();
        }
    }

    function resetTrainingVisuals() {

        const trainingVisualization = document.getElementById('training-visualization');
        trainingVisualization.innerHTML = `
            <img src="/api/placeholder/800/300" alt="Training visualization placeholder" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;"/>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
                <h3>Click "Start Training" to begin</h3>
            </div>
        `;

        const networkVisualizer = document.getElementById('network-visualizer');
        networkVisualizer.innerHTML = `
            <img src="/api/placeholder/800/400" alt="Network visualization placeholder" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;"/>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
                <h3>Network will appear during training</h3>
            </div>
        `;

        document.getElementById('current-generation').textContent = '0';
        document.getElementById('best-fitness').textContent = '0';
        document.getElementById('avg-fitness').textContent = '0';
        document.getElementById('best-ai-score').textContent = '0';
        document.getElementById('network-neurons').textContent = '12';
        document.getElementById('network-connections').textContent = '24';

        document.getElementById('training-progress').style.width = '0%';
    }

    function initNetworkVisualization() {
        const networkVisualizer = document.getElementById('network-visualizer');
        networkVisualizer.innerHTML = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        networkVisualizer.appendChild(svg);

        const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        linksGroup.setAttribute('class', 'links');
        svg.appendChild(linksGroup);

        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodesGroup.setAttribute('class', 'nodes');
        svg.appendChild(nodesGroup);

        createInitialNetwork(svg, linksGroup, nodesGroup);
    }

    function createInitialNetwork(svg, linksGroup, nodesGroup) {
        const width = svg.clientWidth;
        const height = svg.clientHeight;

        const layers = [
            { name: 'input', size: 4, x: width * 0.1 },
            { name: 'hidden1', size: 6, x: width * 0.4 },
            { name: 'hidden2', size: 4, x: width * 0.7 },
            { name: 'output', size: 2, x: width * 0.9 }
        ];

        let nodes = [];
        let nodeId = 0;

        layers.forEach(layer => {
            const yStep = height / (layer.size + 1);

            for (let i = 0; i < layer.size; i++) {
                nodes.push({
                    id: nodeId++,
                    x: layer.x,
                    y: yStep * (i + 1),
                    layer: layer.name
                });
            }
        });

        let links = [];
        let linkId = 0;

        for (let i = 0; i < nodes.length; i++) {
            const source = nodes[i];

            for (let j = 0; j < nodes.length; j++) {
                const target = nodes[j];

                if (source.layer === 'input' && target.layer === 'hidden1') {
                    links.push({
                        id: linkId++,
                        source: source,
                        target: target,
                        weight: Math.random() * 2 - 1
                    });
                } else if (source.layer === 'hidden1' && target.layer === 'hidden2') {
                    links.push({
                        id: linkId++,
                        source: source,
                        target: target,
                        weight: Math.random() * 2 - 1
                    });
                } else if (source.layer === 'hidden2' && target.layer === 'output') {
                    links.push({
                        id: linkId++,
                        source: source,
                        target: target,
                        weight: Math.random() * 2 - 1
                    });
                }
            }
        }

        links.forEach(link => {
            const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            lineElement.setAttribute('x1', link.source.x);
            lineElement.setAttribute('y1', link.source.y);
            lineElement.setAttribute('x2', link.target.x);
            lineElement.setAttribute('y2', link.target.y);
            lineElement.setAttribute('class', 'link');
            lineElement.setAttribute('data-id', link.id);

            const strokeWidth = Math.abs(link.weight) * 3;
            const strokeColor = link.weight > 0 ? '#4a6cff' : '#ef4444';
            const opacity = Math.abs(link.weight) * 0.7 + 0.3;

            lineElement.setAttribute('stroke', strokeColor);
            lineElement.setAttribute('stroke-width', strokeWidth);
            lineElement.setAttribute('opacity', opacity);

            linksGroup.appendChild(lineElement);
        });

        nodes.forEach(node => {
            const circleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circleElement.setAttribute('cx', node.x);
            circleElement.setAttribute('cy', node.y);
            circleElement.setAttribute('r', 8);
            circleElement.setAttribute('class', 'node');
            circleElement.setAttribute('data-id', node.id);

            let fillColor;
            if (node.layer === 'input') {
                fillColor = '#10b981';
            } else if (node.layer === 'output') {
                fillColor = '#ef4444';
            } else {
                fillColor = '#4a6cff';
            }

            circleElement.setAttribute('fill', fillColor);
            nodesGroup.appendChild(circleElement);
        });
    }

    function updateNetworkVisualization() {
        const svg = document.querySelector('#network-visualizer svg');
        if (!svg) return;

        const links = svg.querySelectorAll('.link');

        links.forEach(link => {
            const weight = Math.random() * 2 - 1;
            const strokeWidth = Math.abs(weight) * 3;
            const strokeColor = weight > 0 ? '#4a6cff' : '#ef4444';
            const opacity = Math.abs(weight) * 0.7 + 0.3;

            link.setAttribute('stroke', strokeColor);
            link.setAttribute('stroke-width', strokeWidth);
            link.setAttribute('opacity', opacity);
        });
    }

    function generateCNNFilters() {
        const filterContainers = [
            document.getElementById('cnn-filters-1'),
            document.getElementById('cnn-filters-2')
        ];

        filterContainers.forEach((container, layerIndex) => {
            container.innerHTML = '';

            const numFilters = layerIndex === 0 ? 8 : 16;

            for (let i = 0; i < numFilters; i++) {
                const filter = document.createElement('div');
                filter.className = 'cnn-filter';
                filter.id = `filter-${layerIndex}-${i}`;

                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                filter.appendChild(canvas);

                container.appendChild(filter);

                drawRandomFilterPattern(canvas);
            }
        });
    }

    function updateCNNFilters() {

        for (let layerIndex = 0; layerIndex < 2; layerIndex++) {
            const numFilters = layerIndex === 0 ? 8 : 16;

            for (let i = 0; i < numFilters; i++) {
                const filter = document.getElementById(`filter-${layerIndex}-${i}`);
                if (filter) {
                    const canvas = filter.querySelector('canvas');
                    if (canvas) {

                        drawRandomFilterPattern(canvas);
                    }
                }
            }
        }
    }

    function drawRandomFilterPattern(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const cellSize = 10;
        const cols = Math.ceil(width / cellSize);
        const rows = Math.ceil(height / cellSize);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const value = Math.random();
                const color = `rgba(74, 108, 255, ${value})`;

                ctx.fillStyle = color;
                ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }

    function initCharts() {
        const fitnessChartCanvas = document.getElementById('fitness-chart');
        const fitnessChart = new Chart(fitnessChartCanvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Best Fitness',
                        data: [],
                        borderColor: '#4a6cff',
                        backgroundColor: 'rgba(74, 108, 255, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Average Fitness',
                        data: [],
                        borderColor: '#6b46c1',
                        backgroundColor: 'rgba(107, 70, 193, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Generation',
                            color: '#9ca3af'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f3f4f6'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Fitness Over Generations',
                        color: '#f3f4f6'
                    }
                }
            }
        });

        window.trainingCharts = {
            fitnessChart,

            scoreChart: null,
            speciesChart: null,
            complexityChart: null
        };
    }

    function updateCharts(generation, bestFitness, avgFitness, bestScore) {
        const { fitnessChart, scoreChart, speciesChart, complexityChart } = window.trainingCharts;

        fitnessChart.data.labels.push(generation);
        scoreChart.data.labels.push(generation);
        speciesChart.data.labels.push(generation);
        complexityChart.data.labels.push(generation);

        fitnessChart.data.datasets[0].data.push(bestFitness);
        fitnessChart.data.datasets[1].data.push(avgFitness);

        scoreChart.data.datasets[0].data.push(bestScore);

        let speciesCount;
        if (generation < 20) {
            speciesCount = 1 + Math.floor(generation / 2);
        } else if (generation < 50) {
            speciesCount = 10 + Math.floor(Math.random() * 3) - 1;
        } else {
            speciesCount = 8 + Math.floor(Math.random() * 2) - 1;
        }
        speciesChart.data.datasets[0].data.push(speciesCount);

        const neurons = 12 + Math.floor(generation / 5);
        const connections = neurons * 2 + Math.floor(generation / 2);
        complexityChart.data.datasets[0].data.push(neurons);
        complexityChart.data.datasets[1].data.push(connections);

        fitnessChart.update();
        scoreChart.update();
        speciesChart.update();
        complexityChart.update();

        const maxVisiblePoints = 20;
        if (fitnessChart.data.labels.length > maxVisiblePoints) {
            fitnessChart.data.labels.shift();
            fitnessChart.data.datasets.forEach(dataset => dataset.data.shift());

            scoreChart.data.labels.shift();
            scoreChart.data.datasets.forEach(dataset => dataset.data.shift());

            speciesChart.data.labels.shift();
            speciesChart.data.datasets.forEach(dataset => dataset.data.shift());

            complexityChart.data.labels.shift();
            complexityChart.data.datasets.forEach(dataset => dataset.data.shift());
        }
    }

    function initExpertPlay() {
        const expertVisualization = document.getElementById('expert-visualization');
        expertVisualization.innerHTML = `
            <div style="width: 100%; height: 100%; background-color: #f7f8fa; position: relative;">
                <div style="position: absolute; top: 20px; left: 20px; color: #333; font-size: 14px;">
                    <strong>Mode: Expert AI</strong> | 
                    <strong>Status: Running</strong> | 
                    <strong>FPS: 60</strong>
                </div>
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; height: 100px; background-color: #e5e7eb; border-radius: 5px; overflow: hidden;">
                    <!-- Game terrain will be generated here -->
                </div>
            </div>
        `;

        initExpertNetworkVisualization();
    }

    function startExpertPlay() {
        expertScore = 0;
        document.getElementById('expert-score').textContent = expertScore;

        expertInterval = setInterval(function() {

            expertScore += Math.floor(Math.random() * 10) + 10;
            document.getElementById('expert-score').textContent = expertScore;

            const decisionsPerSec = 120 + Math.floor(Math.random() * 8);
            document.getElementById('expert-decisions').textContent = `${decisionsPerSec}/s`;

            const accuracy = 98.5 + (Math.random() * 0.4);
            document.getElementById('expert-accuracy').textContent = `${accuracy.toFixed(1)}%`;

            updateExpertNetworkVisualization();
        }, 100);
    }

    function continueExpertPlay() {
        expertInterval = setInterval(function() {

            expertScore += Math.floor(Math.random() * 10) + 10;
            document.getElementById('expert-score').textContent = expertScore;

            const decisionsPerSec = 120 + Math.floor(Math.random() * 8);
            document.getElementById('expert-decisions').textContent = `${decisionsPerSec}/s`;

            const accuracy = 98.5 + (Math.random() * 0.4);
            document.getElementById('expert-accuracy').textContent = `${accuracy.toFixed(1)}%`;

            updateExpertNetworkVisualization();
        }, 100);
    }

    function resetExpertVisuals() {

        const expertVisualization = document.getElementById('expert-visualization');
        expertVisualization.innerHTML = `
            <img src="/api/placeholder/800/300" alt="Expert visualization placeholder" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;"/>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
                <h3>Click "Watch Expert Play" to begin</h3>
            </div>
        `;

        const expertNetworkVisualizer = document.getElementById('expert-network-visualizer');
        expertNetworkVisualizer.innerHTML = `
            <img src="/api/placeholder/800/400" alt="Expert network visualization placeholder" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;"/>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
                <h3>Network will appear when expert plays</h3>
            </div>
        `;

        document.getElementById('expert-score').textContent = '0';
        document.getElementById('expert-decisions').textContent = '124/s';
        document.getElementById('expert-accuracy').textContent = '98.7%';
    }

    function initExpertNetworkVisualization() {
        const networkVisualizer = document.getElementById('expert-network-visualizer');
        networkVisualizer.innerHTML = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        networkVisualizer.appendChild(svg);

        const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        linksGroup.setAttribute('class', 'links');
        svg.appendChild(linksGroup);

        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodesGroup.setAttribute('class', 'nodes');
        svg.appendChild(nodesGroup);

        createExpertNetwork(svg, linksGroup, nodesGroup);
    }

    function createExpertNetwork(svg, linksGroup, nodesGroup) {
        const width = svg.clientWidth;
        const height = svg.clientHeight;

        const layers = [
            { name: 'input', size: 8, x: width * 0.05 },
            { name: 'hidden1', size: 12, x: width * 0.25 },
            { name: 'hidden2', size: 10, x: width * 0.45 },
            { name: 'hidden3', size: 8, x: width * 0.65 },
            { name: 'output', size: 3, x: width * 0.85 }
        ];

        let nodes = [];
        let nodeId = 0;

        layers.forEach(layer => {
            const yStep = height / (layer.size + 1);

            for (let i = 0; i < layer.size; i++) {
                nodes.push({
                    id: nodeId++,
                    x: layer.x,
                    y: yStep * (i + 1),
                    layer: layer.name,
                    activation: Math.random() 
                });
            }
        });

        let links = [];
        let linkId = 0;

        for (let i = 0; i < layers.length - 1; i++) {
            const sourceLayerName = layers[i].name;
            const targetLayerName = layers[i+1].name;

            const sourceNodes = nodes.filter(node => node.layer === sourceLayerName);
            const targetNodes = nodes.filter(node => node.layer === targetLayerName);

            sourceNodes.forEach(source => {
                targetNodes.forEach(target => {
                    if (Math.random() > 0.3) {  
                        links.push({
                            id: linkId++,
                            source: source,
                            target: target,
                            weight: Math.random() * 2 - 1
                        });
                    }
                });
            });
        }

        if (layers.length > 2) {
            const inputNodes = nodes.filter(node => node.layer === 'input');
            const outputNodes = nodes.filter(node => node.layer === 'output');

            inputNodes.forEach(source => {
                outputNodes.forEach(target => {
                    if (Math.random() > 0.7) {  
                        links.push({
                            id: linkId++,
                            source: source,
                            target: target,
                            weight: Math.random() * 2 - 1
                        });
                    }
                });
            });
        }

        links.forEach(link => {
            const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            lineElement.setAttribute('x1', link.source.x);
            lineElement.setAttribute('y1', link.source.y);
            lineElement.setAttribute('x2', link.target.x);
            lineElement.setAttribute('y2', link.target.y);
            lineElement.setAttribute('class', 'link');
            lineElement.setAttribute('data-id', link.id);

            const strokeWidth = Math.abs(link.weight) * 2;
            const strokeColor = link.weight > 0 ? '#4a6cff' : '#ef4444';
            const opacity = Math.abs(link.weight) * 0.7 + 0.3;

            lineElement.setAttribute('stroke', strokeColor);
            lineElement.setAttribute('stroke-width', strokeWidth);
            lineElement.setAttribute('opacity', opacity);

            linksGroup.appendChild(lineElement);
        });

        nodes.forEach(node => {
            const circleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circleElement.setAttribute('cx', node.x);
            circleElement.setAttribute('cy', node.y);
            circleElement.setAttribute('r', 6);
            circleElement.setAttribute('class', 'node');
            circleElement.setAttribute('data-id', node.id);
            circleElement.setAttribute('data-layer', node.layer);

            let fillColor;
            if (node.layer === 'input') {
                fillColor = '#10b981';
            } else if (node.layer === 'output') {
                fillColor = '#ef4444';
            } else {
                fillColor = '#4a6cff';
            }

            circleElement.setAttribute('fill', fillColor);
            nodesGroup.appendChild(circleElement);
        });
    }

    function updateExpertNetworkVisualization() {
        const svg = document.querySelector('#expert-network-visualizer svg');
        if (!svg) return;

        const nodes = svg.querySelectorAll('.node');
        const links = svg.querySelectorAll('.link');

        nodes.forEach(node => {
            const layer = node.getAttribute('data-layer');
            let pulseProbability;

            if (layer === 'input') {
                pulseProbability = 0.4;  
            } else if (layer === 'output') {
                pulseProbability = 0.3;  
            } else {
                pulseProbability = 0.2;  
            }

            if (Math.random() < pulseProbability) {

                const originalR = 6;
                const pulseR = 10;
                const originalOpacity = 1;
                const pulseOpacity = 0.7;

                node.setAttribute('r', pulseR);
                node.setAttribute('opacity', pulseOpacity);

                setTimeout(() => {
                    node.setAttribute('r', originalR);
                    node.setAttribute('opacity', originalOpacity);
                }, 300);
            }
        });

        links.forEach(link => {
            if (Math.random() < 0.1) {  
                const originalOpacity = link.getAttribute('opacity');
                const originalWidth = link.getAttribute('stroke-width');

                link.setAttribute('opacity', '1');
                link.setAttribute('stroke-width', parseFloat(originalWidth) * 1.5);

                setTimeout(() => {
                    link.setAttribute('opacity', originalOpacity);
                    link.setAttribute('stroke-width', originalWidth);
                }, 200);
            }
        });
    }

    updateGameStats();

    window.addEventListener('message', function(event) {

        if (event.data && event.data.type === 'gameScore') {
            currentScore = event.data.score;
            if (currentScore > highScore) {
                highScore = currentScore;
            }
            updateGameStats();
        }
    });
});